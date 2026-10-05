import { sameOrigin } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/supabase-server";
import { TRIP_ID, validFile } from "@/lib/domain";
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new Error("잘못된 요청");
    const { client } = await authorize(true);
    const form = await request.formData();
    const reservationId = z.uuid().parse(form.get("reservation_id"));
    const textInput = form.get("text_content");
    const text =
      textInput === null
        ? null
        : z.string().trim().min(1).max(10000).parse(textInput);
    const file = form.get("file");
    if (text !== null && file instanceof File && file.size > 0)
      throw new Error("파일과 텍스트는 각각 첨부해주세요");
    if (text === null && (!(file instanceof File) || file.size > 10485760))
      throw new Error("PDF, PNG, JPG, WEBP 파일을 10MB 이하로 선택해주세요");
    const { data: reservation } = await client
      .from("reservations")
      .select("id")
      .eq("trip_id", TRIP_ID)
      .eq("id", reservationId)
      .single();
    if (!reservation) throw new Error("예약을 찾을 수 없습니다");
    if (text !== null) {
      const title = z.string().trim().min(1).max(200).parse(form.get("title"));
      const { error } = await client.from("reservation_attachments").insert({
        trip_id: TRIP_ID,
        reservation_id: reservationId,
        file_name: title,
        text_content: text,
      });
      if (error) throw new Error("텍스트 첨부를 저장하지 못했습니다");
      return NextResponse.json({ ok: true });
    }
    if (!(file instanceof File)) throw new Error("파일을 선택해주세요");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validFile(bytes, file.type))
      throw new Error("파일 형식이나 크기가 올바르지 않습니다");
    const path = `${TRIP_ID}/${reservationId}/${crypto.randomUUID()}`;
    const { error: uploadError } = await client.storage
      .from("reservation-files")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error("첨부 업로드에 실패했습니다");
    const { error: dbError } = await client
      .from("reservation_attachments")
      .insert({
        trip_id: TRIP_ID,
        reservation_id: reservationId,
        file_name: file.name.slice(0, 200),
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      });
    if (dbError) {
      await client.storage.from("reservation-files").remove([path]);
      throw new Error("첨부정보 저장에 실패했습니다");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "업로드 실패" },
      { status: 400 },
    );
  }
}
export async function GET(request: Request) {
  try {
    const { client } = await authorize();
    const id = z.uuid().parse(new URL(request.url).searchParams.get("id"));
    const { data } = await client
      .from("reservation_attachments")
      .select("storage_path")
      .eq("trip_id", TRIP_ID)
      .eq("id", id)
      .single();
    if (!data?.storage_path) throw new Error("파일 첨부를 찾을 수 없습니다");
    const { data: url, error } = await client.storage
      .from("reservation-files")
      .createSignedUrl(data.storage_path, 60);
    if (error || !url) throw new Error("첨부를 열지 못했습니다");
    return NextResponse.json(
      { url: url.signedUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!sameOrigin(request)) throw new Error("잘못된 요청");
    const { client } = await authorize(true);
    const { id } = z.object({ id: z.uuid() }).parse(await request.json());
    const { data: attachment } = await client
      .from("reservation_attachments")
      .select("storage_path")
      .eq("trip_id", TRIP_ID)
      .eq("id", id)
      .single();
    if (!attachment) throw new Error("첨부를 찾을 수 없습니다");
    if (attachment.storage_path) {
      const { error: storageError } = await client.storage
        .from("reservation-files")
        .remove([attachment.storage_path]);
      if (storageError)
        throw new Error("파일을 삭제하지 못했습니다. 다시 시도해주세요");
    }
    const { error: dbError } = await client
      .from("reservation_attachments")
      .delete()
      .eq("trip_id", TRIP_ID)
      .eq("id", id);
    if (dbError)
      throw new Error(
        "파일 정보 정리에 실패했습니다. 삭제를 다시 시도해주세요",
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "삭제 실패" },
      { status: 400 },
    );
  }
}
