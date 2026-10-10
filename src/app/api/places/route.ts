import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/supabase-server";
import { TRIP_ID } from "@/lib/domain";
import { lookupPlanPlace } from "@/lib/google-lookup";
export async function GET(request: Request) {
  let session;
  try {
    session = await authorize();
  } catch {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  // Only stored plan places may initiate a search. No free-form search/editing.
  const placeId = params.get("place");
  const id = params.get("id");
  if (!placeId && !id)
    return NextResponse.json(
      { error: "장소 검색은 제공하지 않습니다" },
      { status: 400 },
    );
  try {
    let place: { google_place_id?: string | null; maps_url?: string | null };
    if (placeId) {
      z.uuid().parse(placeId);
      const { data, error } = await session.client
        .from("places")
        .select("google_place_id,maps_url")
        .eq("trip_id", TRIP_ID)
        .eq("id", placeId)
        .eq("archived", false)
        .single();
      if (error || !data)
        return NextResponse.json(
          { error: "계획에 등록된 장소를 찾을 수 없습니다" },
          { status: 404 },
        );
      place = data;
    } else {
      place = {
        google_place_id: z
          .string()
          .regex(/^[\w-]{1,200}$/)
          .parse(id),
      };
    }
    const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
    if (!key)
      return NextResponse.json(
        { error: "Google Places API 키가 아직 설정되지 않았습니다" },
        { status: 503 },
      );
    return NextResponse.json(await lookupPlanPlace(key, place), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "장소 ID를 확인해주세요"
            : e instanceof Error && e.name === "Error"
              ? e.message
              : "장소 위치 조회가 지연되고 있습니다. 다시 시도해주세요",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
