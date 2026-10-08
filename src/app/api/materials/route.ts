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
        schedule_id: z.uuid(),
        reservation_id: z.uuid().optional(),
        title: z.string().trim().min(1).max(200).optional(),
      })
      .parse(await request.json());
    if (!input.reservation_id && !input.title)
      throw new Error("자료 제목 또는 기존 예약을 선택해주세요");
    const { data, error } = await client.rpc("add_schedule_material", {
      p_trip_id: TRIP_ID,
      p_schedule_id: input.schedule_id,
      p_reservation_id: input.reservation_id ?? null,
      p_title: input.title ?? null,
    });
    if (error)
      throw new Error("예약자료를 연결하지 못했습니다. 다시 시도해주세요");
    return NextResponse.json({ id: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "자료 저장 실패" },
      { status: 400 },
    );
  }
}
