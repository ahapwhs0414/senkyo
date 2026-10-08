// Local-only Supabase contract fixture. Never imported by application code.
// RLS is tested separately against a real PostgreSQL engine.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const seed = JSON.parse(readFileSync("src/lib/seed.json", "utf8"));
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "fixture_a@senkyo.invalid",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
let data;
function reset() {
  data = structuredClone(seed);

  for (const rows of Object.values(data))
    for (const row of rows) row.updated_at = "2026-10-05T00:00:00.000Z";
  data.trip_members = [
    {
      id: randomUUID(),
      trip_id: seed.trips[0].id,
      user_id: user.id,
      slot: "USER_A",
      role: "EDITOR",
    },
    {
      id: randomUUID(),
      trip_id: seed.trips[0].id,
      user_id: "22222222-2222-4222-8222-222222222222",
      slot: "USER_B",
      role: "EDITOR",
    },
  ];
  data.profiles = [
    { id: user.id, username: "fixture_a", display_name: "테스트 A" },
    {
      id: "22222222-2222-4222-8222-222222222222",
      username: "fixture_b",
      display_name: "테스트 B",
    },
  ];
}
reset();
const encode = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.UTC(2030, 0, 1) / 1000) })}.fixture`;
const userB = {
  ...user,
  id: "22222222-2222-4222-8222-222222222222",
  email: "fixture_b@senkyo.invalid",
};
const tokenB = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: userB.id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.UTC(2030, 0, 1) / 1000) })}.fixture-b`;
const authenticated = (req) =>
  req.headers.authorization?.includes(tokenB)
    ? userB
    : req.headers.authorization?.includes(token)
      ? user
      : null;
const objects = new Map();
let failAttachment = false;
const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3100");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization,apikey,content-type,x-client-info,x-supabase-api-version",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  const url = new URL(req.url, "http://127.0.0.1:3101");
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  const body =
    raw && req.headers["content-type"]?.includes("application/json")
      ? JSON.parse(raw)
      : null;
  const respond = (status, value) => {
    res.writeHead(status);
    res.end(JSON.stringify(value));
  };
  if (url.pathname === "/test/reset") {
    reset();
    objects.clear();
    failAttachment = false;
    respond(200, { ok: true });
    return;
  }
  if (url.pathname === "/test/data") {
    respond(200, { data, objectCount: objects.size });
    return;
  }
  if (url.pathname === "/test/fail-attachment") {
    failAttachment = true;
    respond(200, { ok: true });
    return;
  }
  if (url.pathname === "/auth/v1/token") {
    const selected =
      body?.email === user.email
        ? user
        : body?.email === userB.email
          ? userB
          : null;
    if (!selected || body?.password !== "fixture-only-password") {
      respond(400, {
        error: "invalid_grant",
        error_description: "Invalid credentials",
      });
      return;
    }
    respond(200, {
      access_token: selected === user ? token : tokenB,
      refresh_token: "fixture-refresh",
      expires_in: 86400,
      token_type: "bearer",
      user: selected,
    });
    return;
  }
  if (url.pathname === "/auth/v1/user") {
    const selected = authenticated(req);
    respond(selected ? 200 : 401, selected ?? { message: "Unauthorized" });
    return;
  }
  if (url.pathname === "/auth/v1/logout") {
    respond(200, {});
    return;
  }
  if (url.pathname.startsWith("/storage/v1/")) {
    if (!authenticated(req)) {
      respond(403, { message: "Unauthorized" });
      return;
    }
    const path = url.pathname.replace("/storage/v1/object/", "");
    if (req.method === "POST" && path.startsWith("sign/")) {
      respond(200, {
        signedURL: `/object/sign/${path.slice(5)}?token=${randomUUID()}`,
      });
      return;
    }
    if (req.method === "DELETE") {
      for (const prefix of body?.prefixes ?? [])
        objects.delete(`reservation-files/${prefix}`);
      respond(200, []);
      return;
    }
    if (req.method === "POST") {
      objects.set(path, Buffer.concat(chunks));
      respond(200, { Key: path });
      return;
    }
    respond(200, { ok: true });
    return;
  }
  if (url.pathname === "/rest/v1/rpc/add_schedule_material") {
    if (!authenticated(req)) {
      respond(403, { message: "Unauthorized" });
      return;
    }
    const schedule = data.schedule_items.find(
      (s) => s.id === body.p_schedule_id && !s.archived,
    );
    if (!schedule) {
      respond(400, { message: "Active schedule required" });
      return;
    }
    const id = body.p_reservation_id ?? randomUUID();
    if (!body.p_reservation_id)
      data.reservations.push({
        id,
        trip_id: seed.trips[0].id,
        type: "OTHER",
        title: body.p_title,
        status: "PLANNED",
        material_only: true,
        note: "",
        updated_at: new Date().toISOString(),
      });
    if (
      !data.reservation_schedule_items.some(
        (l) => l.reservation_id === id && l.schedule_item_id === schedule.id,
      )
    )
      data.reservation_schedule_items.push({
        id: randomUUID(),
        trip_id: seed.trips[0].id,
        reservation_id: id,
        schedule_item_id: schedule.id,
        updated_at: new Date().toISOString(),
      });
    respond(200, id);
    return;
  }
  const table = url.pathname.split("/").at(-1);
  if (!url.pathname.startsWith("/rest/v1/") || !data[table]) {
    respond(404, { message: "Not found" });
    return;
  }
  if (!authenticated(req)) {
    respond(403, { message: "Unauthorized" });
    return;
  }
  const filters = [...url.searchParams].filter(([, v]) => v.startsWith("eq."));
  const matches = (r) => filters.every(([k, v]) => String(r[k]) === v.slice(3));
  let rows = data[table].filter(matches);
  if (req.method === "POST") {
    if (table === "reservation_attachments" && failAttachment) {
      failAttachment = false;
      respond(400, { message: "Fixture DB failure" });
      return;
    }
    const added = {
      ...body,
      id: body.id ?? randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (table === "schedule_items")
      added.sort_order =
        Math.max(
          -1,
          ...data.schedule_items
            .filter((r) => r.date === added.date)
            .map((r) => r.sort_order),
        ) + 1;
    data[table].push(added);
    rows = [added];
  }
  if (req.method === "PATCH") {
    for (const row of rows)
      Object.assign(row, body, { updated_at: new Date().toISOString() });
  }
  if (req.method === "DELETE")
    data[table] = data[table].filter((r) => !matches(r));
  if (req.headers.accept?.includes("application/vnd.pgrst.object+json")) {
    if (rows.length !== 1) {
      respond(406, {
        code: "PGRST116",
        message: "No rows",
        details: "The result contains 0 rows",
      });
      return;
    }
    respond(200, rows[0]);
  } else respond(200, rows);
});
server.listen(3101, "127.0.0.1", () => {
  const env = {
    ...process.env,
    SENKYO_TEST_BUILD: "1",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3101",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-publishable",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon",
    GOOGLE_MAPS_SERVER_API_KEY: "",
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "fixture-browser-key",
  };
  let child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "build"],
    { stdio: "inherit", env },
  );
  let stopping = false;
  const stop = () => {
    stopping = true;
    child.kill("SIGTERM");
    server.close();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  child.on("exit", (code) => {
    if (stopping || code !== 0) {
      server.close();
      return;
    }
    child = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3100",
      ],
      { stdio: "inherit", env },
    );
    child.on("exit", () => server.close());
  });
});
