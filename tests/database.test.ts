import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
const db = new PGlite();
const trip = "20261222-2026-4222-8222-202612270002";
const editor = "11111111-1111-4111-8111-111111111111";
const viewer = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  await db.exec(
    `create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;`,
  );
  for (const file of readdirSync("supabase/migrations").sort()) {
    await db.exec(
      readFileSync(`supabase/migrations/${file}`, "utf8").replace(
        /^alter publication.*$/gm,
        "",
      ),
    );
  }
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  await db.exec(
    `insert into auth.users values('${editor}'),('${viewer}');insert into profiles(id,username,display_name) values('${editor}','editor','A'),('${viewer}','viewer','B');insert into trip_members(trip_id,user_id,role,slot) values('${trip}','${editor}','EDITOR','USER_A'),('${trip}','${viewer}','VIEWER','USER_B');grant usage on schema public,auth,storage to authenticated;grant select,insert,update,delete on all tables in schema public,storage to authenticated;`,
  );
});
afterAll(async () => {
  await db.close();
});
async function asUser(user: string, sql: string) {
  await db.exec(
    `set role authenticated;select set_config('request.jwt.claim.sub','${user}',false);`,
  );
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role;");
  }
}
describe("schema, seed and authorization", () => {
  it("reruns seed without duplicates or overwriting edits", async () => {
    await db.exec(
      "update schedule_items set note='user note' where sort_order=0 and date='2026-12-22';",
    );
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    const { rows } = await db.query<{ count: number }>(
      "select count(*)::int as count from schedule_items",
    );
    expect(rows[0].count).toBe(113);
    expect(
      (
        await db.query<{ note: string }>(
          "select note from schedule_items where sort_order=0 and date='2026-12-22'",
        )
      ).rows[0].note,
    ).toBe("user note");
  });
  it("nonmember cannot read data", async () => {
    expect(
      (
        await asUser(
          "33333333-3333-4333-8333-333333333333",
          "select * from schedule_items",
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("viewer reads but cannot update", async () => {
    expect(
      (await asUser(viewer, "select * from schedule_items")).rows.length,
    ).toBe(113);
    expect(
      (
        await asUser(
          viewer,
          "update schedule_items set note='forbidden' returning id",
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("editor updates", async () => {
    expect(
      (
        await asUser(
          editor,
          "update schedule_items set note='edited' where sort_order=0 and date='2026-12-22' returning id",
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("rejects cross-trip relations", async () => {
    await db.exec(
      "insert into trips(id,title,start_date,end_date) values('44444444-4444-4444-8444-444444444444','other','2026-12-22','2026-12-27');insert into places(id,trip_id,custom_name) values('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','other');",
    );
    await expect(
      db.exec(
        "update schedule_items set place_id='55555555-5555-4555-8555-555555555555' where sort_order=0 and date='2026-12-22'",
      ),
    ).rejects.toThrow();
  });
  it("rejects invalid expense splits and maintains derived splits", async () => {
    await expect(
      asUser(
        editor,
        `insert into expenses(trip_id,date,category,title,amount,payer_user_id,share_a_yen,share_b_yen) values('${trip}','2026-12-22','음식','invalid',100,'${editor}',70,20)`,
      ),
    ).rejects.toThrow();
    const result = await asUser(
      editor,
      `insert into expenses(trip_id,date,category,title,amount,payer_user_id,share_a_yen,share_b_yen) values('${trip}','2026-12-22','음식','meal',101,'${editor}',51,50) returning id`,
    );
    expect(result.rows).toHaveLength(1);
    const sum = await db.query<{ total: number }>(
      "select sum(amount_yen)::int total from expense_splits",
    );
    expect(sum.rows[0].total).toBe(101);
  });
  it("private attachment objects are hidden from outsiders", async () => {
    await db.exec(
      `insert into storage.objects(bucket_id,name) values('reservation-files','${trip}/reservation/file')`,
    );
    expect(
      (
        await asUser(
          "33333333-3333-4333-8333-333333333333",
          "select * from storage.objects",
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(editor, "select * from storage.objects")).rows,
    ).toHaveLength(1);
  });
  it("members cannot promote themselves or alter derived shares", async () => {
    expect(
      (
        await asUser(
          editor,
          "update trip_members set role='OWNER' returning id",
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(
          editor,
          "update expense_splits set amount_yen=999 returning id",
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("viewer cannot insert and another trip remains hidden", async () => {
    await expect(
      asUser(
        viewer,
        `insert into notes(trip_id,title) values('${trip}','forbidden')`,
      ),
    ).rejects.toThrow();
    expect(
      (
        await asUser(
          editor,
          "select * from places where trip_id='44444444-4444-4444-8444-444444444444'",
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("members can read both profiles without policy recursion", async () => {
    expect((await asUser(editor, "select * from profiles")).rows).toHaveLength(
      2,
    );
  });
  it("unsafe URLs are rejected in PostgreSQL", async () => {
    await expect(
      asUser(
        editor,
        `insert into emergency_contacts(trip_id,title,url) values('${trip}','bad','javascript:alert(1)')`,
      ),
    ).rejects.toThrow();
  });
});

describe("private reservation text attachments", () => {
  it("allows an editor to save text and a viewer to read it", async () => {
    await asUser(
      editor,
      `insert into reservation_attachments(trip_id,reservation_id,file_name,text_content) select '${trip}',id,'안내','예약 확인 메시지' from reservations limit 1`,
    );
    const result = await asUser(
      viewer,
      "select text_content from reservation_attachments where file_name='안내'",
    );
    expect(result.rows).toEqual([{ text_content: "예약 확인 메시지" }]);
    await expect(
      asUser(
        viewer,
        `insert into reservation_attachments(trip_id,reservation_id,file_name,text_content) select '${trip}',id,'forbidden','text' from reservations limit 1`,
      ),
    ).rejects.toThrow();
  });
  it("rejects empty text and incomplete file attachments", async () => {
    await expect(
      db.exec(
        `insert into reservation_attachments(trip_id,reservation_id,file_name,text_content) select '${trip}',id,'empty','   ' from reservations limit 1`,
      ),
    ).rejects.toThrow();
    await expect(
      db.exec(
        `insert into reservation_attachments(trip_id,reservation_id,file_name) select '${trip}',id,'missing' from reservations limit 1`,
      ),
    ).rejects.toThrow();
  });
});
