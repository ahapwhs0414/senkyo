import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/supabase-server";
import { googlePlaceSchema, googleErrorInfo } from "@/lib/google";
export async function GET(request: Request) {
  try {
    await authorize();
    const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
    if (!key)
      return NextResponse.json(
        { error: "Google Places API 키가 아직 설정되지 않았습니다" },
        { status: 503 },
      );
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    const query = params.get("q");
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
      const text = z.string().trim().min(2).max(200).parse(query);
      response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location",
          },
          body: JSON.stringify({
            textQuery: text,
            languageCode: "ko",
            regionCode: "JP",
            pageSize: 10,
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        },
      );
    }
    if (!response.ok) {
      const info = googleErrorInfo(
        await response.json().catch(() => null),
        response.status,
      );
      console.error("Google Places request failed", {
        operation: id ? "detail" : "search",
        status: response.status,
        code: info.code,
      });
      return NextResponse.json(
        { error: info.message, code: info.code },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
    const body: unknown = await response.json();
    const result = id
      ? googlePlaceSchema.parse(body)
      : z
          .object({ places: z.array(googlePlaceSchema).default([]) })
          .parse(body);
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
