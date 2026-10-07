import { redirect } from "next/navigation";
import { Planner } from "@/components/planner";
import { authorize, configured } from "@/lib/supabase-server";
import { TRIP_ID, readTables, type Data, type Member } from "@/lib/domain";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!configured()) redirect("/login");
  let auth: Awaited<ReturnType<typeof authorize>>;
  try {
    auth = await authorize();
  } catch {
    redirect("/login");
  }
  const tables = readTables;
  const entries = await Promise.all(
    tables.map(async (table) => {
      let query = auth.client.from(table).select("*");
      if (table === "trips") query = query.eq("id", TRIP_ID);
      else if (table !== "profiles") query = query.eq("trip_id", TRIP_ID);
      const { data, error } = await query;
      if (error)
        throw new Error(
          "여행 정보를 불러오지 못했습니다. DB migration 및 연결 상태를 확인해주세요",
        );
      return [table, data ?? []] as const;
    }),
  );
  const data: Data = Object.fromEntries(entries);
  if (!data.trip_days.length)
    throw new Error("여행 Seed가 필요합니다. 초기 데이터를 적용해주세요");
  const members: Member[] = data.trip_members.map((m) => ({
    user_id: String(m.user_id),
    slot: m.slot as Member["slot"],
    role: m.role as Member["role"],
    display_name: String(
      data.profiles.find((p) => p.id === m.user_id)?.display_name ?? m.slot,
    ),
  }));
  return <Planner initial={data} userId={auth.user.id} members={members} />;
}
