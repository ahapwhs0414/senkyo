import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/supabase-server";
import { googlePlaceSchema, googleErrorInfo } from "@/lib/google";
export async function GET(request: Request) {
  try {
    try {
      await authorize();
    } catch {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (!id)
      return NextResponse.json(
        { error: "장소 검색은 제공하지 않습니다" },
        { status: 400 },
      );
    const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
    if (!key)
      return NextResponse.json(
        { error: "Google Places API 키가 아직 설정되지 않았습니다" },
        { status: 503 },
      );
    let response: Response;
    if (id) {
      z.string()
        .regex(/^[\w-]{1,200}$/)
        .parse(id);
      response = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=ko`,
        {
          headers: {
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask":
              "id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,priceRange,regularOpeningHours,nationalPhoneNumber,websiteUri,googleMapsUri,photos",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        },
      );
    } else {
      return NextResponse.json(
        {
          error:
            "장소 검색은 제공하지 않습니다. 계획서의 지도 링크를 이용해주세요",
        },
        { status: 400 },
      );
    }
    if (!response.ok) {
      const info = googleErrorInfo(
        await response.json().catch(() => null),
        response.status,
      );
      console.error("Google Places request failed", {
        operation: "detail",
        status: response.status,
        code: info.code,
      });
      return NextResponse.json(
        { error: info.message, code: info.code },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
    const body: unknown = await response.json();
    const result = googlePlaceSchema.parse(body);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "검색어나 장소 ID를 확인해주세요"
            : e instanceof Error
              ? e.message
              : "Google 장소 정보를 불러오지 못했습니다",
      },
      { status: 400 },
    );
  }
}
