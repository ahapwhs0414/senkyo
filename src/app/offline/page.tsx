"use client";
import Link from "next/link";
import { useMemo, useSyncExternalStore, useState } from "react";
import { type Data, type Row, inScope } from "@/lib/domain";
export default function Offline() {
  const raw = useSyncExternalStore(
    () => () => {},
    () => sessionStorage.getItem("senkyo-offline"),
    () => null,
  );
  const snapshot = useMemo(() => {
    try {
      return JSON.parse(raw ?? "null") as {
        data: Data;
        savedAt: string;
      } | null;
    } catch {
      return null;
    }
  }, [raw]);
  const data = snapshot?.data ?? null;
  const saved = snapshot?.savedAt ?? "";
  const [date, setDate] = useState("2026-12-22");
  const schedules =
    data?.schedule_items
      .filter((s) => s.date === date)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order)) ?? [];
  const block = (title: string, rows: Row[], label: (row: Row) => string) => (
    <section className="card">
      <h2>{title}</h2>
      {rows.length ? (
        rows.map((r) => <p key={r.id}>{label(r)}</p>)
      ) : (
        <p className="muted">저장된 정보가 없습니다.</p>
      )}
    </section>
  );
  return (
    <main className="shell">
      <h1>오프라인 여행정보</h1>
      <p className="notice">
        마지막 조회 정보입니다. 오프라인에서는 수정할 수 없습니다. 지도·Places
        최신정보와 첨부파일은 온라인 연결이 필요합니다.
      </p>
      {saved && (
        <p className="muted">
          저장 시각:{" "}
          {new Date(saved).toLocaleString("ko-KR", { timeZone: "Asia/Tokyo" })}
        </p>
      )}
      <Link className="link" href="/">
        온라인으로 다시 연결 ↗
      </Link>
      {!data ? (
        <p className="card">
          이 탭에 저장된 여행정보가 없습니다. 온라인에서 로그인하고 여행 화면을
          먼저 열어주세요.
        </p>
      ) : (
        <>
          <label>
            여행 날짜
            <select value={date} onChange={(e) => setDate(e.target.value)}>
              {data.trip_days.map((d) => (
                <option key={d.id} value={String(d.date)}>
                  {String(d.date)}
                </option>
              ))}
            </select>
          </label>
          {block(
            "숙소",
            data.trip_days.filter((d) => d.date === date),
            (r) => String(r.hotel_name ?? "귀국"),
          )}
          {block("일정", schedules, (r) => `${r.time_label} · ${r.title}`)}
          {block(
            "교통",
            data.transport_segments.filter((t) => t.date === date),
            (r) =>
              `${r.time_label} · ${r.route_name} · ${r.origin_name} → ${r.destination_name}`,
          )}
          {block(
            "예약번호",
            data.reservations,
            (r) =>
              `${r.title} · ${r.reservation_number ?? "입력 전"} · ${r.note ?? ""}`,
          )}
          {block(
            "준비물",
            data.packing_items.filter((p) =>
              inScope(p, date, data.schedule_items),
            ),
            (r) => `${r.checked ? "✓" : "□"} ${r.label}`,
          )}
          {block(
            "긴급정보",
            data.emergency_contacts,
            (r) => `${r.title} · ${r.phone ?? ""} · ${r.note ?? ""}`,
          )}
        </>
      )}
    </main>
  );
}
