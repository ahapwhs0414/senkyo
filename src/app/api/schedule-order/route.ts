import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/supabase-server";
import { sameOrigin } from "@/lib/request-security";
import { TRIP_ID } from "@/lib/domain";
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 403 });
    const { client } = await authorize(true);
    const input = z
      .object({
        date: z.iso.date(),
        items: z
          .array(
            z.object({
              id: z.uuid(),
              updated_at: z.iso.datetime({ offset: true }),
            }),
          )
          .min(1)
          .max(1000),
      })
      .parse(await request.json());
    const { error } = await client.rpc("reorder_schedule", {
      p_trip_id: TRIP_ID,
      p_date: input.date,
      p_ids: input.items.map((i) => i.id),
      p_versions: input.items.map((i) => i.updated_at),
    });
    if (error)
      return NextResponse.json(
        {
          error:
            error.code === "40001"
              ? "일정이 변경되었습니다. 새로고침 후 순서를 다시 편집해주세요."
              : "순서를 저장하지 못했습니다.",
        },
        { status: error.code === "40001" ? 409 : 400 },
      );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "순서 편집 권한과 입력값을 확인해주세요." },
      { status: 400 },
    );
  }
}
