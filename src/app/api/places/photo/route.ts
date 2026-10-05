import { NextResponse } from "next/server";
import { authorize } from "@/lib/supabase-server";
export async function GET(request: Request) {
  try {
    await authorize();
    const name = new URL(request.url).searchParams.get("name");
    if (!name || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(name))
      throw new Error("사진 정보를 확인해주세요");
    const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
    if (!key) throw new Error("Google API 키 설정 필요");
    const response = await fetch(
      `https://places.googleapis.com/v1/${name}/media?maxWidthPx=600&skipHttpRedirect=true`,
      {
        headers: { "X-Goog-Api-Key": key },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    const body: { photoUri?: string } = await response.json();
    if (!response.ok || !body.photoUri)
      throw new Error("사진을 불러오지 못했습니다");
    const photo = await fetch(body.photoUri, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!photo.ok) throw new Error("사진을 불러오지 못했습니다");
    return new Response(photo.body, {
      headers: {
        "Content-Type": photo.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "사진을 불러오지 못했습니다" },
      { status: 400 },
    );
  }
}
