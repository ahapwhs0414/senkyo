import { sameOrigin } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/supabase-server";
import { TRIP_ID, schemas, readTables, type Table } from "@/lib/domain";
export async function GET() {
  try {
    const { client } = await authorize();
    const results = await Promise.all(
      readTables.map(async (table) => {
        let query = client.from(table).select("*");
        if (table === "trips") query = query.eq("id", TRIP_ID);
        else if (table !== "profiles") query = query.eq("trip_id", TRIP_ID);
        const { data, error } = await query;
        if (error)
          throw new Error(
            "여행 데이터를 불러오지 못했습니다. 다시 시도해주세요",
          );
        return [table, data] as const;
      }),
    );
    return NextResponse.json(Object.fromEntries(results), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 403 },
    );
  }
}
const envelope = z.object({
  table: z.enum(Object.keys(schemas) as [Table, ...Table[]]),
  id: z.uuid().optional(),
  updated_at: z.iso.datetime({ offset: true }).optional(),
  values: z.record(z.string(), z.unknown()).optional(),
});
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 403 });
    const { client } = await authorize(true);
    const input = envelope.parse(await request.json());
    const values = schemas[input.table].parse(input.values);
    let query = input.id
      ? client
          .from(input.table)
          .update(values)
          .eq("trip_id", TRIP_ID)
          .eq("id", input.id)
      : client.from(input.table).insert({ ...values, trip_id: TRIP_ID });
    if (input.id) {
      if (!input.updated_at)
        return NextResponse.json(
          { error: "최신 데이터를 다시 불러온 후 수정해주세요" },
          { status: 409 },
        );
      query = query.eq("updated_at", input.updated_at);
    }
    const { data, error } = await query.select().maybeSingle();
    if (error)
      throw new Error(
        "저장하지 못했습니다. 연결된 항목, 중복 또는 입력값을 확인해주세요",
      );
    if (!data)
      return NextResponse.json(
        { error: "다른 사용자가 수정했습니다. 새로고침 후 다시 시도해주세요" },
        { status: 409 },
      );
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? e.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("\n")
            : e instanceof Error
              ? e.message
              : "저장 실패",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  try {
    if (!sameOrigin(request)) throw new Error("잘못된 요청");
    const { client } = await authorize(true);
    const input = envelope.parse(await request.json());
    if (!input.id || !input.updated_at)
      throw new Error("최신 데이터와 ID가 필요합니다");
    const { data, error } = await client
      .from(input.table)
      .delete()
      .eq("trip_id", TRIP_ID)
      .eq("id", input.id)
      .eq("updated_at", input.updated_at)
      .select("id");
    if (error)
      throw new Error(
        "연결된 데이터가 있어 삭제할 수 없습니다. 먼저 연결을 해제해주세요",
      );
    if (!data?.length)
      return NextResponse.json(
        { error: "데이터가 변경되었습니다. 다시 불러와주세요" },
        { status: 409 },
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "삭제 실패" },
      { status: 400 },
    );
  }
}
