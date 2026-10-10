import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/supabase-server";
import { sameOrigin } from "@/lib/request-security";
import { TRIP_ID } from "@/lib/domain";

export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 403 });
  try {
    const { client } = await authorize(true);
    const input = z
      .object({ id: z.uuid(), updated_at: z.iso.datetime({ offset: true }) })
      .nullable()
      .parse(await request.json());
    if (input) {
      const { error } = await client.rpc("delete_reservation", {
        p_trip_id: TRIP_ID,
        p_reservation_id: input.id,
        p_updated_at: input.updated_at,
      });
      if (error)
        return NextResponse.json(
          {
            error:
              error.code === "40001"
                ? "다른 사용자가 수정했습니다. 자료를 다시 열고 삭제해주세요"
                : "예약 자료를 삭제하지 못했습니다. 연결 상태와 migration 007 적용 여부를 확인해주세요",
          },
          { status: error.code === "40001" ? 409 : 400 },
        );
    }
    const { data: pending, error: readError } = await client
      .from("reservation_file_deletions")
      .select("storage_path")
      .eq("trip_id", TRIP_ID);
    let cleanupPending = Boolean(readError);
    for (const row of pending ?? []) {
      const { error } = await client.storage
        .from("reservation-files")
        .remove([row.storage_path]);
      if (error) {
        cleanupPending = true;
        continue;
      }
      const { error: deleteError } = await client
        .from("reservation_file_deletions")
        .delete()
        .eq("trip_id", TRIP_ID)
        .eq("storage_path", row.storage_path);
      if (deleteError) cleanupPending = true;
    }
    return NextResponse.json(
      { ok: true, cleanupPending },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "자료 삭제 권한과 연결 상태를 확인해주세요" },
      { status: 400 },
    );
  }
}
