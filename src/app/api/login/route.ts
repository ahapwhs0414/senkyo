import { sameOrigin } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { z } from "zod";
import { serverClient, configured } from "@/lib/supabase-server";
import { TRIP_ID } from "@/lib/domain";
export async function POST(request: Request) {
  if (!configured())
    return NextResponse.json(
      {
        error:
          "아직 서비스 연결 전입니다. Supabase 설정 후 로그인할 수 있습니다.",
      },
      { status: 503 },
    );
  try {
    if (!sameOrigin(request))
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 403 });
    const input = z
      .object({
        username: z.string().regex(/^[a-zA-Z0-9_-]{3,32}$/),
        password: z.string().min(1).max(128),
      })
      .parse(await request.json());
    const client = await serverClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: `${input.username.toLowerCase()}@senkyo.invalid`,
      password: input.password,
    });
    if (error || !data.user)
      return NextResponse.json(
        { error: "아이디 또는 비밀번호를 확인해주세요" },
        { status: 401 },
      );
    const { data: member } = await client
      .from("trip_members")
      .select("id")
      .eq("trip_id", TRIP_ID)
      .eq("user_id", data.user.id)
      .single();
    if (!member) {
      await client.auth.signOut();
      return NextResponse.json(
        { error: "아이디 또는 비밀번호를 확인해주세요" },
        { status: 401 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호를 확인해주세요" },
      { status: 400 },
    );
  }
}
