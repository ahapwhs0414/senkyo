// Use an ignored, permission-restricted JSON file; never supply passwords as CLI arguments.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const file = process.argv[2];
if (
  !file ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
)
  throw new Error(
    "URL, service role key, and path to a private accounts JSON are required",
  );
const accounts = JSON.parse(readFileSync(file, "utf8"));
if (
  !Array.isArray(accounts) ||
  accounts.length !== 2 ||
  new Set(accounts.map((a) => a.username.toLowerCase())).size !== 2
)
  throw new Error("Exactly two unique accounts required");
for (const a of accounts)
  if (
    !/^[a-zA-Z0-9_-]{3,32}$/.test(a.username) ||
    typeof a.password !== "string" ||
    a.password.length < 12 ||
    !a.display_name
  )
    throw new Error(
      "Invalid account input. Password must have at least 12 characters.",
    );
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { data: existing, error: listError } = await client.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) throw new Error("Unable to list accounts");
const allowed = new Set(
  accounts.map((a) => `${a.username.toLowerCase()}@senkyo.invalid`),
);
if (existing.users.some((u) => !allowed.has(u.email)))
  throw new Error(
    "Unexpected existing Auth accounts; inspect manually. No users deleted.",
  );
for (const [i, a] of accounts.entries()) {
  const email = `${a.username.toLowerCase()}@senkyo.invalid`;
  let user = existing.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await client.auth.admin.createUser({
      email,
      password: a.password,
      email_confirm: true,
    });
    if (error)
      throw new Error("Auth account creation failed; inspect Supabase.");
    user = data.user;
  }
  const { error: profileError } = await client.from("profiles").upsert({
    id: user.id,
    username: a.username.toLowerCase(),
    display_name: a.display_name,
  });
  if (profileError) throw new Error("Profile creation failed");
  const { error: memberError } = await client.from("trip_members").upsert(
    {
      trip_id: "20261222-2026-4222-8222-202612270002",
      user_id: user.id,
      slot: i === 0 ? "USER_A" : "USER_B",
      role: "EDITOR",
    },
    { onConflict: "trip_id,user_id" },
  );
  if (memberError)
    throw new Error(
      "Membership creation failed. Run migrations and seed first.",
    );
}
console.log("Two accounts provisioned. Existing passwords were not changed.");
