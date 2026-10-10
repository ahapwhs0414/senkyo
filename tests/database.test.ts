import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFileSync as read, readdirSync } from "node:fs";
import seed from "../scripts/plan/r3-seed.json";
import legacy from "../scripts/plan/legacy-seed.json";
const db = new PGlite();
const trip = "20261222-2026-4222-8222-202612270002",
  editor = "11111111-1111-4111-8111-111111111111",
  viewer = "22222222-2222-4222-8222-222222222222",
  outsider = "33333333-3333-4333-8333-333333333333";
const oldHotel = legacy.reservations.find((r) => r.title.includes("칸데오"))!;
const keptPacking = legacy.packing_items[0];
const retiredSchedule = legacy.schedule_items.find((s) =>
  s.title.includes("아라하마 초등학교 관람"),
)!;
const migration = (f: string) =>
  read(`supabase/migrations/${f}`, "utf8").replace(
    /^alter publication.*$/gm,
    "",
  );
async function asUser<T>(user: string, sql: string, params: unknown[] = []) {
  await db.exec(
    `set role authenticated;select set_config('request.jwt.claim.sub','${user}',false);`,
  );
  try {
    return await db.query<T>(sql, params);
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  await db.exec(
    `create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;`,
  );
  const files = readdirSync("supabase/migrations").sort();
  for (const f of files.filter((f) => f.startsWith("20261005")))
    await db.exec(migration(f));
  await db.exec(read("scripts/plan/legacy-seed.sql", "utf8"));
  await db.exec(
    `insert into auth.users values('${editor}'),('${viewer}');insert into profiles values('${editor}','editor','A'),('${viewer}','viewer','B');insert into trip_members(trip_id,user_id,role,slot) values('${trip}','${editor}','EDITOR','USER_A'),('${trip}','${viewer}','VIEWER','USER_B');grant usage on schema public,auth,storage to authenticated;grant select,insert,update,delete on all tables in schema public,storage to authenticated;`,
  );
  await db.exec(
    `update reservations set reservation_number='OLD-HOTEL-REAL-DATA',seat_number='USER-SEAT',status='BOOKED',note='user reservation text' where id='${oldHotel.id}';insert into reservation_attachments(trip_id,reservation_id,file_name,text_content) values('${trip}','${oldHotel.id}','旧予約','personal attachment');insert into reservation_attachments(trip_id,reservation_id,file_name,storage_path,mime_type,size_bytes) values('${trip}','${oldHotel.id}','old.pdf','${trip}/${oldHotel.id}/file','application/pdf',100);insert into storage.objects(bucket_id,name) values('reservation-files','${trip}/${oldHotel.id}/file');update packing_items set checked=true,note='my note' where id='${keptPacking.id}';insert into packing_items(trip_id,date,schedule_item_id,label,checked) values('${trip}','2026-12-23','${retiredSchedule.id}','user-added retired preparation',true);update checklist_items set status='DONE' where id='${legacy.checklist_items[0].id}';update schedule_items set note='my schedule note',status='completed' where id='${legacy.schedule_items[0].id}';insert into expenses(trip_id,date,category,title,amount,payer_user_id,share_a_yen,share_b_yen) values('${trip}','2026-12-22','food','historical expense',101,'${editor}',51,50);`,
  );
  for (const f of files.filter((f) => f.startsWith("20261006")))
    await db.exec(migration(f));
  // Grants cannot re-enable plan writes: RLS policies must also deny them.
  await db.exec(
    "grant select,insert,update,delete on all tables in schema public,storage to authenticated",
  );
  for (const f of files.filter((f) => f.startsWith("20261008")))
    await db.exec(migration(f));
});
afterAll(async () => {
  await db.close();
});
describe("non-destructive r3 migration", () => {
  it("preserves UUIDs, personal booking fields, text/files, user preparation and completion", async () => {
    const hotel = (
      await db.query<{
        reservation_number: string;
        seat_number: string;
        status: string;
        archived: boolean;
        title: string;
      }>("select * from reservations where id=$1", [oldHotel.id])
    ).rows[0];
    expect(hotel).toMatchObject({
      reservation_number: "OLD-HOTEL-REAL-DATA",
      seat_number: "USER-SEAT",
      status: "BOOKED",
      archived: true,
      title: oldHotel.title,
    });
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int count from reservation_attachments where reservation_id=$1",
          [oldHotel.id],
        )
      ).rows[0].count,
    ).toBe(2);
    expect(
      (
        await db.query<{ checked: boolean; note: string; archived: boolean }>(
          "select * from packing_items where id=$1",
          [keptPacking.id],
        )
      ).rows[0],
    ).toMatchObject({ checked: true, note: "my note", archived: false });
    expect(
      (
        await db.query<{ checked: boolean }>(
          "select checked from packing_items where label='user-added retired preparation'",
        )
      ).rows[0].checked,
    ).toBe(true);
    expect(
      (
        await db.query<{ status: string }>(
          "select status from checklist_items where id=$1",
          [legacy.checklist_items[0].id],
        )
      ).rows[0].status,
    ).toBe("DONE");
    expect(
      (
        await db.query<{ note: string; status: string }>(
          "select note,status from schedule_items where id=$1",
          [legacy.schedule_items[0].id],
        )
      ).rows[0],
    ).toEqual({ note: "my schedule note", status: "completed" });
  });
  it("archives retired plans but never treats old hotel bookings as the new hotel", async () => {
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int count from schedule_items where not archived",
        )
      ).rows[0].count,
    ).toBe(108);
    expect(
      (
        await db.query<{ archived: boolean }>(
          "select archived from schedule_items where id=$1",
          [retiredSchedule.id],
        )
      ).rows[0].archived,
    ).toBe(true);
    const newHotel = seed.reservations.find(
      (r) => r.plan_key === "res-hotel-ueno",
    )!;
    expect(
      (
        await db.query<{ reservation_number: string | null }>(
          "select reservation_number from reservations where id=$1",
          [newHotel.id],
        )
      ).rows[0].reservation_number,
    ).toBeNull();
    expect(
      (
        await db.query(
          "select * from reservation_schedule_items where reservation_id=$1 and schedule_item_id=$2",
          [
            oldHotel.id,
            seed.schedule_items.find((s) => s.plan_key === "d3-hotel-checkin")!
              .id,
          ],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("reapplies deterministically without duplicate rows or overwriting progress", async () => {
    const before = (
      await db.query(
        "select (select count(*) from schedule_items) schedules,(select count(*) from packing_items) packing,(select count(*) from reservation_schedule_items) links",
      )
    ).rows;
    await db.exec(read("supabase/migrations/202610060006_plan_r3.sql", "utf8"));
    await db.exec(read("supabase/migrations/202610060006_plan_r3.sql", "utf8"));
    expect(
      (
        await db.query(
          "select (select count(*) from schedule_items) schedules,(select count(*) from packing_items) packing,(select count(*) from reservation_schedule_items) links",
        )
      ).rows,
    ).toEqual(before);
    expect(
      (
        await db.query<{ checked: boolean }>(
          "select checked from packing_items where id=$1",
          [keptPacking.id],
        )
      ).rows[0].checked,
    ).toBe(true);
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int count from plan_revision_backups",
        )
      ).rows[0].count,
    ).toBe(1);
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int count from expenses",
        )
      ).rows[0].count,
    ).toBe(1);
  });
});
describe("plan/read and material/write authorization", () => {
  it("hides all data and storage attachments from nonmembers", async () => {
    expect(
      (await asUser(outsider, "select * from schedule_items")).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(outsider, "select * from reservation_attachments")).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(outsider, "select * from storage.objects")).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(editor, "select * from storage.objects")).rows,
    ).toHaveLength(1);
  });
  it("makes the plan read-only for editors and viewers", async () => {
    for (const user of [editor, viewer]) {
      expect(
        (await asUser(user, "select * from schedule_items where not archived"))
          .rows,
      ).toHaveLength(108);
      expect(
        (
          await asUser(
            user,
            "update schedule_items set title='forbidden' returning id",
          )
        ).rows,
      ).toHaveLength(0);
      expect(
        (
          await asUser(
            user,
            "update places set custom_name='forbidden' returning id",
          )
        ).rows,
      ).toHaveLength(0);
      expect(
        (await asUser(user, "delete from schedule_places returning id")).rows,
      ).toHaveLength(0);
      await expect(
        asUser(
          user,
          `insert into schedule_items(trip_id,date,title) values('${trip}','2026-12-22','forbidden')`,
        ),
      ).rejects.toThrow();
      await expect(
        asUser(
          user,
          "select reorder_schedule($1,$2,'{}'::uuid[],'{}'::timestamptz[])",
          [trip, "2026-12-22"],
        ),
      ).rejects.toThrow();
    }
  });
  it("blocks expense writes while retaining historical data", async () => {
    expect(
      (await asUser(editor, "update expenses set amount=999 returning id"))
        .rows,
    ).toHaveLength(0);
    await expect(
      asUser(
        editor,
        `insert into expenses(trip_id,date,category,title,amount,payer_user_id,share_a_yen,share_b_yen) values('${trip}','2026-12-22','food','forbidden',101,'${editor}',51,50)`,
      ),
    ).rejects.toThrow();
    expect(
      (
        await db.query<{ total: number }>(
          "select sum(amount_yen)::int total from expense_splits",
        )
      ).rows[0].total,
    ).toBe(101);
  });
  it("keeps editable preparations and reservations with viewer restrictions", async () => {
    expect(
      (
        await asUser(
          editor,
          "update reservations set note='new personal note' where id=$1 returning id",
          [seed.reservations[0].id],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await asUser(
          viewer,
          "update reservations set note='forbidden' returning id",
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      asUser(
        viewer,
        `insert into checklist_items(trip_id,title) values('${trip}','forbidden')`,
      ),
    ).rejects.toThrow();
    expect(
      (
        await asUser(
          editor,
          "update trip_members set role='OWNER' returning id",
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("enforces date/owner/definition identity for daily carry state", async () => {
    const p = seed.packing_items.find(
      (p) => p.plan_key === "pack-phone:USER_A",
    )!;
    await asUser(
      editor,
      `insert into packing_checks(trip_id,packing_item_id,date,owner,checked) values('${trip}','${p.id}','2026-12-24','USER_A',true)`,
    );
    await expect(
      asUser(
        editor,
        `insert into packing_checks(trip_id,packing_item_id,date,owner) values('${trip}','${p.id}','2026-12-24','USER_A')`,
      ),
    ).rejects.toThrow();
    await expect(
      asUser(
        editor,
        `insert into packing_checks(trip_id,packing_item_id,date,owner) values('${trip}','${p.id}','2026-12-25','USER_B')`,
      ),
    ).rejects.toThrow();
    const nonDaily = seed.packing_items.find((p) => !p.repeat_daily)!;
    await expect(
      asUser(
        editor,
        `insert into packing_checks(trip_id,packing_item_id,date,owner) values('${trip}','${nonDaily.id}','2026-12-25','${nonDaily.owner}')`,
      ),
    ).rejects.toThrow();
    expect(
      (await asUser(viewer, "select * from packing_checks")).rows,
    ).toHaveLength(1);
  });
  it("creates a non-booking material atomically and idempotently links existing material", async () => {
    const s = seed.schedule_items.find((s) => s.plan_key === "d3-bus-falls")!;
    const result = await asUser<{ id: string }>(
      editor,
      "select add_schedule_material($1,$2,null,'Bus timetable') id",
      [trip, s.id],
    );
    const id = result.rows[0].id;
    expect(
      (
        await db.query<{ material_only: boolean; status: string }>(
          "select material_only,status from reservations where id=$1",
          [id],
        )
      ).rows[0],
    ).toEqual({ material_only: true, status: "PLANNED" });
    await asUser(editor, "select add_schedule_material($1,$2,$3,null)", [
      trip,
      s.id,
      id,
    ]);
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int count from reservation_schedule_items where reservation_id=$1",
          [id],
        )
      ).rows[0].count,
    ).toBe(1);
    await expect(
      asUser(viewer, "select add_schedule_material($1,$2,null,'forbidden')", [
        trip,
        s.id,
      ]),
    ).rejects.toThrow();
    await expect(
      asUser(editor, "select add_schedule_material($1,$2,null,'forbidden')", [
        trip,
        retiredSchedule.id,
      ]),
    ).rejects.toThrow();
  });
  it("supports private text/file/mixed attachments and rejects malformed records", async () => {
    const r = seed.reservations[0].id;
    await asUser(
      editor,
      `insert into reservation_attachments(trip_id,reservation_id,file_name,text_content) values('${trip}','${r}','Text','private text')`,
    );
    await asUser(
      editor,
      `insert into reservation_attachments(trip_id,reservation_id,file_name,text_content,storage_path,mime_type,size_bytes) values('${trip}','${r}','Mixed','private text','${trip}/${r}/mixed','application/pdf',10)`,
    );
    expect(
      (
        await asUser(
          viewer,
          "select * from reservation_attachments where file_name='Mixed'",
        )
      ).rows,
    ).toHaveLength(1);
    await expect(
      asUser(
        viewer,
        `insert into reservation_attachments(trip_id,reservation_id,file_name,text_content) values('${trip}','${r}','forbidden','text')`,
      ),
    ).rejects.toThrow();
    await expect(
      db.exec(
        `insert into reservation_attachments(trip_id,reservation_id,file_name,text_content) values('${trip}','${r}','empty',' ')`,
      ),
    ).rejects.toThrow();
    await expect(
      db.exec(
        `insert into reservation_attachments(trip_id,reservation_id,file_name) values('${trip}','${r}','missing')`,
      ),
    ).rejects.toThrow();
  });
  it("rejects unsafe URLs and cross-trip links", async () => {
    await expect(
      asUser(
        editor,
        `insert into emergency_contacts(trip_id,title,url) values('${trip}','bad','javascript:alert(1)')`,
      ),
    ).rejects.toThrow();
    await db.exec(
      "insert into trips(id,title,start_date,end_date) values('44444444-4444-4444-8444-444444444444','other','2026-12-22','2026-12-27');insert into places(id,trip_id,custom_name) values('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','other')",
    );
    await expect(
      db.exec(
        "update schedule_items set place_id='55555555-5555-4555-8555-555555555555' where not archived",
      ),
    ).rejects.toThrow();
    expect((await asUser(editor, "select * from profiles")).rows).toHaveLength(
      2,
    );
  });
});

describe("fresh install and reviewed rollback", () => {
  it("installs into an empty database and refuses a rollback without legacy data", async () => {
    const fresh = new PGlite();
    try {
      await fresh.exec(
        `create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;`,
      );

      for (const f of readdirSync("supabase/migrations").sort())
        await fresh.exec(migration(f));
      await fresh.exec(read("supabase/seed.sql", "utf8"));
      expect(
        (
          await fresh.query<{ count: number }>(
            "select count(*)::int count from schedule_items where not archived",
          )
        ).rows[0].count,
      ).toBe(113);
      await expect(
        fresh.exec(read("supabase/plan-rollback.sql", "utf8")),
      ).rejects.toThrow("populated pre-renewal snapshot");
    } finally {
      await fresh.close();
    }
  });
  it("rolls back plan fields without reverting newer user edits, then reapplies r3", async () => {
    await db.exec(
      "update reservations set note='edited after migration' where id='" +
        oldHotel.id +
        "';update packing_items set checked=false where id='" +
        keptPacking.id +
        "';",
    );
    await db.exec(read("supabase/plan-rollback.sql", "utf8"));
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int count from schedule_items where not archived",
        )
      ).rows[0].count,
    ).toBe(113);
    expect(
      (
        await db.query<{ note: string }>(
          "select note from reservations where id=$1",
          [oldHotel.id],
        )
      ).rows[0].note,
    ).toBe("edited after migration");
    expect(
      (
        await db.query<{ checked: boolean }>(
          "select checked from packing_items where id=$1",
          [keptPacking.id],
        )
      ).rows[0].checked,
    ).toBe(false);
    await db.exec(read("supabase/migrations/202610060006_plan_r3.sql", "utf8"));
    expect(
      (
        await db.query<{ count: number }>(
          "select count(*)::int count from schedule_items where not archived",
        )
      ).rows[0].count,
    ).toBe(108);
    expect(
      (
        await db.query<{ note: string }>(
          "select note from reservations where id=$1",
          [oldHotel.id],
        )
      ).rows[0].note,
    ).toBe("edited after migration");
  });
});

describe("reservation deletion transaction", () => {
  it("rejects viewer/outsider, stale timestamps and direct deletes without losing data", async () => {
    const r = (
      await db.query<{ id: string; updated_at: string }>(
        `insert into reservations(trip_id,type,title) values($1,'OTHER','delete-test') returning id,updated_at::text`,
        [trip],
      )
    ).rows[0];
    const call = "select public.delete_reservation($1,$2,$3)";
    for (const user of [viewer, outsider])
      await expect(
        asUser(user, call, [trip, r.id, r.updated_at]),
      ).rejects.toThrow("Editor required");
    await expect(
      asUser(editor, call, [trip, r.id, "2000-01-01T00:00:00Z"]),
    ).rejects.toThrow("Reservation changed");
    await expect(
      asUser(editor, "delete from reservations where id=$1", [r.id]),
    ).rejects.toThrow();
    expect(
      (await db.query("select id from reservations where id=$1", [r.id])).rows,
    ).toHaveLength(1);
  });
  it("removes only the chosen reservation, preserves itinerary and queues private files with retry support", async () => {
    const r = (
      await db.query<{ id: string; updated_at: string }>(
        `insert into reservations(trip_id,type,title) values($1,'OTHER','delete-linked') returning id,updated_at::text`,
        [trip],
      )
    ).rows[0];
    const schedule = seed.schedule_items[0];
    const transport = seed.transport_segments[0];
    const path = `${trip}/${r.id}/private.pdf`;
    await db.query(
      "insert into reservation_schedule_items(trip_id,reservation_id,schedule_item_id) values($1,$2,$3)",
      [trip, r.id, schedule.id],
    );
    await db.query(
      "insert into reservation_attachments(trip_id,reservation_id,file_name,storage_path,mime_type,size_bytes) values($1,$2,'file',$3,'application/pdf',100)",
      [trip, r.id, path],
    );
    await db.query(
      "update transport_segments set reservation_id=$1 where id=$2",
      [r.id, transport.id],
    );
    await asUser(editor, "select public.delete_reservation($1,$2,$3)", [
      trip,
      r.id,
      r.updated_at,
    ]);
    for (const table of [
      "reservations",
      "reservation_attachments",
      "reservation_schedule_items",
    ])
      expect(
        (
          await db.query(
            `select * from ${table} where ${table === "reservations" ? "id" : "reservation_id"}=$1`,
            [r.id],
          )
        ).rows,
      ).toHaveLength(0);
    expect(
      (
        await db.query("select * from schedule_items where id=$1", [
          schedule.id,
        ])
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query<{ reservation_id: string | null }>(
          "select reservation_id from transport_segments where id=$1",
          [transport.id],
        )
      ).rows[0].reservation_id,
    ).toBeNull();
    expect(
      (
        await asUser(
          editor,
          "select * from reservation_file_deletions where storage_path=$1",
          [path],
        )
      ).rows,
    ).toHaveLength(1);
    for (const user of [viewer, outsider])
      expect(
        (await asUser(user, "select * from reservation_file_deletions")).rows,
      ).toHaveLength(0);
    await expect(
      asUser(
        editor,
        "insert into reservation_file_deletions(storage_path,trip_id) values($1,$2)",
        [`${trip}/invented`, trip],
      ),
    ).rejects.toThrow();
    await asUser(editor, "select public.delete_reservation($1,$2,$3)", [
      trip,
      r.id,
      r.updated_at,
    ]);
    expect(
      (
        await asUser(
          editor,
          "select * from reservation_file_deletions where storage_path=$1",
          [path],
        )
      ).rows,
    ).toHaveLength(1);
    await asUser(
      editor,
      "delete from reservation_file_deletions where storage_path=$1",
      [path],
    );
  });
});

describe("r4 migration preserves personal data across moved days and changed trains", () => {
  it("moves preparation dates, archives old trains and is safely repeatable", async () => {
    const moved = seed.schedule_items.find((s) => s.plan_key === "d5-lunch")!;
    const oldTrain = seed.reservations.find(
      (r) => r.plan_key === "res-hayabusa-return",
    )!;
    const p = (
      await db.query<{ id: string }>(
        "insert into packing_items(trip_id,date,schedule_item_id,label,checked,note) values($1,'2026-12-26',$2,'MY BAG',true,'keep note') returning id",
        [trip, moved.id],
      )
    ).rows[0];
    await db.query(
      "update reservations set reservation_number='KEEP-R3-BOOKING' where id=$1",
      [oldTrain.id],
    );
    await db.query(
      "insert into reservation_attachments(trip_id,reservation_id,file_name,text_content) values($1,$2,'KEEP TEXT','real booking details')",
      [trip, oldTrain.id],
    );
    await db.exec(migration("202610100008_plan_r4.sql"));
    expect(
      (
        await db.query<{ date: string; checked: boolean; note: string }>(
          "select date::text,checked,note from packing_items where id=$1",
          [p.id],
        )
      ).rows[0],
    ).toEqual({ date: "2026-12-25", checked: true, note: "keep note" });
    expect(
      (
        await db.query<{ archived: boolean; reservation_number: string }>(
          "select archived,reservation_number from reservations where id=$1",
          [oldTrain.id],
        )
      ).rows[0],
    ).toEqual({ archived: true, reservation_number: "KEEP-R3-BOOKING" });
    expect(
      (
        await db.query(
          "select id from reservation_attachments where reservation_id=$1 and file_name='KEEP TEXT'",
          [oldTrain.id],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select id from schedule_items where not archived")).rows,
    ).toHaveLength(113);
    const newTrain = (
      await db.query<{ id: string; updated_at: string }>(
        "select id,updated_at::text from reservations where plan_key='res-skyliner-return'",
      )
    ).rows[0];
    await asUser(editor, "select public.delete_reservation($1,$2,$3)", [
      trip,
      newTrain.id,
      newTrain.updated_at,
    ]);
    await db.exec(migration("202610100008_plan_r4.sql"));
    expect(
      (await db.query("select id from reservations where id=$1", [newTrain.id]))
        .rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select id from schedule_items where not archived")).rows,
    ).toHaveLength(113);
    expect(
      (
        await db.query(
          "select id from packing_items where id=$1 and checked and note='keep note'",
          [p.id],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "select * from plan_revision_backups where plan_version='2026-10-10-r4'",
        )
      ).rows,
    ).toHaveLength(1);
  });
});

describe("failed delete rolls back the entire reservation transaction", () => {
  it("does not leave a cleanup job or lose attachments when a dependent table blocks deletion", async () => {
    const r = (
      await db.query<{ id: string; updated_at: string }>(
        "insert into reservations(trip_id,type,title) values($1,'OTHER','blocked-delete') returning id,updated_at::text",
        [trip],
      )
    ).rows[0];
    await db.query(
      "insert into reservation_attachments(trip_id,reservation_id,file_name,storage_path,mime_type,size_bytes) values($1,$2,'safe.pdf',$3,'application/pdf',100)",
      [trip, r.id, `${trip}/${r.id}/safe.pdf`],
    );
    await db.exec(
      "create table public.test_reservation_dependency(reservation_id uuid references public.reservations(id))",
    );
    await db.query("insert into test_reservation_dependency values($1)", [
      r.id,
    ]);
    await expect(
      asUser(editor, "select public.delete_reservation($1,$2,$3)", [
        trip,
        r.id,
        r.updated_at,
      ]),
    ).rejects.toThrow();
    expect(
      (await db.query("select id from reservations where id=$1", [r.id])).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "select id from reservation_attachments where reservation_id=$1",
          [r.id],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "select * from reservation_file_deletions where storage_path=$1",
          [`${trip}/${r.id}/safe.pdf`],
        )
      ).rows,
    ).toHaveLength(0);
    await db.exec("drop table public.test_reservation_dependency");
  });
});
