import { sameOrigin } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase-server";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "잘못된 요청" }, { status: 403 });
  try {
    await (await serverClient()).auth.signOut();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "로그아웃에 실패했습니다. 다시 시도해주세요" },
      { status: 500 },
    );
  }
}
