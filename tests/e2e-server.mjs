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
  data.schedule_places = [];
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
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 86400 })}.fixture`;
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
  const body = raw ? JSON.parse(raw) : null;
  const respond = (status, value) => {
    res.writeHead(status);
    res.end(JSON.stringify(value));
  };
  if (url.pathname === "/test/reset") {
    reset();
    respond(200, { ok: true });
    return;
  }
  if (url.pathname === "/auth/v1/token") {
    if (
      body?.email !== user.email ||
      body?.password !== "fixture-only-password"
    ) {
      respond(400, {
        error: "invalid_grant",
        error_description: "Invalid credentials",
      });
      return;
    }
    respond(200, {
      access_token: token,
      refresh_token: "fixture-refresh",
      expires_in: 86400,
      token_type: "bearer",
      user,
    });
    return;
  }
  if (url.pathname === "/auth/v1/user") {
    respond(
      req.headers.authorization?.includes(token) ? 200 : 401,
      req.headers.authorization?.includes(token)
        ? user
        : { message: "Unauthorized" },
    );
    return;
  }
  if (url.pathname === "/auth/v1/logout") {
    respond(200, {});
    return;
  }
  if (url.pathname === "/rest/v1/rpc/reorder_schedule") {
    if (!req.headers.authorization?.includes(token)) {
      respond(403, { message: "Unauthorized" });
      return;
    }
    const rows = data.schedule_items.filter((r) => r.date === body.p_date);
    if (
      rows.length !== body.p_ids.length ||
      rows.some(
        (r) =>
          !body.p_ids.includes(r.id) ||
          body.p_versions[body.p_ids.indexOf(r.id)] !== r.updated_at,
      )
    ) {
      respond(409, { code: "40001" });
      return;
    }
    body.p_ids.forEach((id, index) =>
      Object.assign(
        rows.find((r) => r.id === id),
        { sort_order: index, updated_at: new Date().toISOString() },
      ),
    );
    respond(200, null);
    return;
  }
  const table = url.pathname.split("/").at(-1);
  if (!url.pathname.startsWith("/rest/v1/") || !data[table]) {
    respond(404, { message: "Not found" });
    return;
  }
  if (!req.headers.authorization?.includes(token)) {
    respond(403, { message: "Unauthorized" });
    return;
  }
  const filters = [...url.searchParams].filter(([, v]) => v.startsWith("eq."));
  const matches = (r) => filters.every(([k, v]) => String(r[k]) === v.slice(3));
  let rows = data[table].filter(matches);
  if (req.method === "POST") {
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
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "",
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
