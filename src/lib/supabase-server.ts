import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { TRIP_ID } from "./domain";
import { supabaseConfig } from "./supabase-config";
export function configured() {
  return supabaseConfig() !== null;
}
export async function serverClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase 환경변수를 설정해주세요");
  const jar = await cookies();
  return createServerClient(
    config.url,
    config.key,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server components cannot set cookies; proxy refreshes them. */
          }
        },
      },
    },
  );
}
export async function authorize(write = false) {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  const { data: member, error } = await client
    .from("trip_members")
    .select("user_id,role,slot")
    .eq("trip_id", TRIP_ID)
    .eq("user_id", user.id)
    .single();
  if (error || !member) throw new Error("여행 접근 권한이 없습니다");
  if (write && !["OWNER", "EDITOR"].includes(member.role))
    throw new Error("수정 권한이 없습니다");
  return { client, user, member };
}
