"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  CalendarDays,
  MapPin,
  Compass,
  LayoutGrid,
  Sun,
  ArrowUpRight,
  Plus,
  TrainFront,
  LogOut,
} from "lucide-react";
import {
  type Data,
  type Row,
  type Table,
  type Member,
  TRIP_ID,
  tokyoDate,
  tokyoTime,
  inScope,
  currentSchedule,
  yenLabel,
  mapsUrl,
  settlement,
} from "@/lib/domain";
import { defaults, labels, words, forms } from "@/lib/forms";
import { browserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Editor } from "./editor";
import { Places } from "./places";
import { TravelMap } from "./travel-map";
import { ReservationFiles } from "./reservation-files";
import { ScheduleConnections } from "./schedule-connections";
import { ScheduleOrder } from "./schedule-order";
import { ReservationDetail } from "./reservation-detail";
type View =
  | "today"
  | "schedule"
  | "map"
  | "places"
  | "more"
  | Table
  | "info"
  | "settings";
const tabs = [
  { view: "today", label: "오늘", Icon: Sun },
  { view: "schedule", label: "일정", Icon: CalendarDays },
  { view: "map", label: "지도", Icon: MapPin },
  { view: "places", label: "장소", Icon: Compass },
  { view: "more", label: "더보기", Icon: LayoutGrid },
] as const;
const menu: View[] = [
  "packing_items",
  "checklist_items",
  "reservations",
  "budget_items",
  "expenses",
  "shopping_items",
  "emergency_contacts",
  "notes",
  "info",
  "settings",
];
export function Planner({
  initial,
  userId,
  members,
}: {
  initial: Data;
  userId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [view, setView] = useState<View>("today");
  const [date, setDate] = useState(() => {
    const today = tokyoDate();
    return initial.trip_days.some((d) => d.date === today)
      ? today
      : "2026-12-22";
  });
  const [clock, setClock] = useState(() => new Date());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [sync, setSync] = useState("연결 중");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<{ table: Table; row: Row } | null>(null);
  const [placeToConnect, setPlaceToConnect] = useState<string>();
  const [ordering, setOrdering] = useState(false);
  const [detail, setDetail] = useState<Row | null>(null);
  const [reservationDetailId, setReservationDetailId] = useState<string | null>(
    null,
  );
  const reservationDetail = data.reservations.find(
    (r) => r.id === reservationDetailId,
  );
  function openReservation(id: string) {
    if (!data.reservations.some((r) => r.id === id)) {
      setError("연결된 예약을 찾을 수 없습니다. 새로고침해주세요");
      return;
    }
    setDetail(null);
    setReservationDetailId(id);
  }
  const member = members.find((m) => m.user_id === userId);
  const writable = !offline && member?.role !== "VIEWER";
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/data", { cache: "no-store" });
      const result: Data & { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
      setOffline(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "새로고침에 실패했습니다");
      setOffline(!navigator.onLine);
    }
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    const online = () => {
      void refresh();
    };
    const offline = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    const client = browserClient();
    const channel = client
      .channel(`trip-${TRIP_ID}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", filter: `trip_id=eq.${TRIP_ID}` },
        () => {
          void refresh();
        },
      )
      .subscribe((status) =>
        setSync(
          status === "SUBSCRIBED"
            ? "공동 편집 연결됨"
            : status === "CHANNEL_ERROR" || status === "TIMED_OUT"
              ? "연결 끊김 · 새로고침 필요"
              : "연결 중",
        ),
      );
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      void client.removeChannel(channel);
    };
  }, [refresh]);
  useEffect(() => {
    const snapshot = {
      userId,
      savedAt: new Date().toISOString(),
      data: Object.fromEntries(
        Object.entries(data).filter(
          ([k]) =>
            !["reservation_attachments", "profiles", "trip_members"].includes(
              k,
            ),
        ),
      ),
    };
    try {
      sessionStorage.setItem("senkyo-offline", JSON.stringify(snapshot));
    } catch {
      /* A full or blocked cache does not prevent online usage. */
    }
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [data, userId]);
  async function mutate(
    table: Table,
    row: Row,
    values: Record<string, unknown>,
    remove = false,
  ) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/data", {
        method: remove ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table,
          id: row.id || undefined,
          updated_at: row.updated_at,
          values,
        }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했습니다");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const edit = (table: Table, row?: Row) =>
    setEditor({
      table,
      row: row ?? {
        ...defaults(table, date),
        ...(table === "schedule_items"
          ? {
              sort_order:
                Math.max(
                  -1,
                  ...data.schedule_items
                    .filter((s) => s.date === date)
                    .map((s) => Number(s.sort_order)),
                ) + 1,
            }
          : {}),
      },
    });
  const changeView = (next: View) => {
    setView(next);
    setPlaceToConnect(undefined);
    setSearch("");
    setFilter("all");
    setDetail(null);
  };
  const schedules = (data.schedule_items ?? [])
    .filter((s) => s.date === date)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  const day = data.trip_days.find((d) => d.date === date);
  const today = tokyoDate(clock);
  const preview = date !== today;
  const dday = Math.round(
    (Date.parse("2026-12-22T00:00:00Z") - Date.parse(`${today}T00:00:00Z`)) /
      86400000,
  );
  const { current, next, minutes } = currentSchedule(schedules, date, clock);
  const nextTransport = [...(data.transport_segments ?? [])]
    .sort((a, b) =>
      String(a.departure_time ?? "").localeCompare(
        String(b.departure_time ?? ""),
      ),
    )
    .find(
      (t) =>
        t.date === date &&
        t.departure_time &&
        String(t.departure_time).slice(0, 5) > tokyoTime(clock),
    );
  const packing = data.packing_items.filter((p) =>
    inScope(p, date, data.schedule_items),
  );
  const checklist = data.checklist_items.filter((p) =>
    inScope(p, date, data.schedule_items),
  );
  const dailyExpenses = data.expenses.filter((e) => e.date === date);
  const dailyReservationIds = new Set(
    data.reservation_schedule_items
      .filter((link) => schedules.some((s) => s.id === link.schedule_item_id))
      .map((link) => link.reservation_id),
  );
  const reservations = data.reservations.filter(
    (r) =>
      dailyReservationIds.has(r.id) ||
      String(r.start_at ?? "").startsWith(date) ||
      (r.type === "HOTEL" && r.title === day?.hotel_name),
  );
  const totalActual = dailyExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const extraEstimate =
    schedules.reduce((s, e) => s + Number(e.estimated_cost_yen ?? 0), 0) * 2;
  const addButton = (table: Table) => (
    <button
      disabled={!writable || busy}
      onClick={() => edit(table)}
      className="primary row"
    >
      <Plus size={16} /> {labels[table]} 추가
    </button>
  );
  const mapLink = (
    name: string,
    origin?: string,
    mode = "transit",
    placeId?: string,
  ) => (
    <a
      className="link"
      href={mapsUrl(name, origin, mode, placeId)}
      target="_blank"
      rel="noopener noreferrer"
    >
      Google Maps <ArrowUpRight size={15} />
    </a>
  );
  function actions(table: Table, row: Row) {
    return (
      <div className="row">
        <button disabled={!writable || busy} onClick={() => edit(table, row)}>
          수정
        </button>
        <button
          disabled={!writable || busy}
          onClick={() => {
            if (window.confirm("이 항목을 삭제할까요?"))
              void mutate(table, row, {}, true).catch(() => {});
          }}
        >
          삭제
        </button>
      </div>
    );
  }
  function checks(table: "packing_items" | "checklist_items", rows: Row[]) {
    return rows.map((row) => (
      <label className="check" key={row.id}>
        <input
          type="checkbox"
          checked={
            table === "packing_items"
              ? Boolean(row.checked)
              : row.status === "DONE"
          }
          disabled={!writable || busy}
          onChange={(e) => {
            void mutate(table, row, {
              ...row,
              [table === "packing_items" ? "checked" : "status"]:
                table === "packing_items"
                  ? e.target.checked
                  : e.target.checked
                    ? "DONE"
                    : "TODO",
            }).catch(() => {});
          }}
        />
        <span>
          {String(row.label ?? row.title)}
          <br />
          <small>
            {words[String(row.owner)]} ·{" "}
            {row.schedule_item_id
              ? "일정별"
              : row.date
                ? "날짜별"
                : "여행 전체"}
            {Number(row.priority) > 0 ? " · 중요" : ""}
          </small>
        </span>
      </label>
    ));
  }
  function transport(row: Row) {
    const min = row.estimated_cost_min_yen;
    const max = row.estimated_cost_max_yen;
    return (
      <div className="card transport" key={row.id}>
        <div className="row">
          <TrainFront size={19} />
          <strong>
            {words[String(row.route_name)] ?? String(row.route_name)}
          </strong>
          {row.is_fixed && <span className="pill">시간 고정</span>}
        </div>
        <p>
          {String(row.origin_name)} → {String(row.destination_name)}
          <br />
          <b>
            {String(
              row.time_label ||
                `${row.departure_time ?? "미정"} → ${row.arrival_time ?? "미정"}`,
            )}
          </b>
        </p>
        {row.operator && (
          <p className="muted">운영사: {String(row.operator)}</p>
        )}
        <p className="muted">
          승차: {String(row.boarding_point ?? row.origin_name)}
          <br />
          하차: {String(row.alighting_point ?? row.destination_name)}
          <br />
          {row.estimated_duration_minutes != null
            ? `약 ${row.estimated_duration_minutes}분 · `
            : ""}
          {min == null
            ? "비용 입력 필요"
            : `${yenLabel(Number(min))}${max != null && max !== min ? `–${yenLabel(Number(max))}` : ""} / 1인`}
        </p>
        {row.reservation_required && (
          <span className="pill">
            {
              words[
                String(
                  data.reservations.find((r) => r.id === row.reservation_id)
                    ?.status ?? "PLANNED",
                )
              ]
            }
          </span>
        )}
        <p>
          {String(row.ticket_note ?? "")} {String(row.preparation_note ?? "")}
        </p>
        <div className="row">
          {mapLink(
            String(row.destination_name),
            String(row.origin_name),
            row.transport_type === "WALK" ? "walking" : "transit",
          )}
          <button
            disabled={!writable || busy}
            onClick={() => edit("transport_segments", row)}
          >
            이동 수정
          </button>
          {row.schedule_item_id && (
            <button
              onClick={() =>
                setDetail(
                  data.schedule_items.find(
                    (s) => s.id === row.schedule_item_id,
                  ) ?? null,
                )
              }
            >
              일정 상세
            </button>
          )}
          {row.reservation_id && (
            <button onClick={() => openReservation(String(row.reservation_id))}>
              예약정보
            </button>
          )}
        </div>
      </div>
    );
  }
  function timeline() {
    return schedules.map((s) => {
      const t = data.transport_segments.find(
        (t) => t.schedule_item_id === s.id,
      );
      const location = data.places.find((p) => p.id === s.place_id);
      return (
        <div key={s.id} className="timeline">
          <div className="time">{String(s.start_time ?? "").slice(0, 5)}</div>
          <div>
            {t ? (
              transport(t)
            ) : (
              <article className="card">
                <div className="row between">
                  <span className="pill">
                    {words[String(s.type)] ?? s.type}
                  </span>
                  <span className="pill">{words[String(s.status)]}</span>
                </div>
                <h3 style={{ marginTop: 14 }}>{String(s.title)}</h3>
                <p className="muted">
                  {String(s.time_label)}
                  {s.description ? ` · ${s.description}` : ""}
                </p>
                {location && (
                  <p>
                    <MapPin size={14} style={{ display: "inline" }} />{" "}
                    {String(location.custom_name)}
                  </p>
                )}
                {s.note && <p>{String(s.note)}</p>}
                <button onClick={() => setDetail(s)}>상세 보기</button>
              </article>
            )}
          </div>
        </div>
      );
    });
  }
  function genericList(table: Table) {
    let rows = data[table] ?? [];
    if (search)
      rows = rows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
      );
    if (filter !== "all") {
      rows = rows.filter(
        (r) =>
          String(r.status ?? r.owner ?? r.category) === filter ||
          r.date === filter ||
          String(r.checked ?? r.purchased) === filter,
      );
    }
    if (table === "reservations")
      rows = [...rows].sort((a, b) =>
        String(a.start_at ?? a.note).localeCompare(
          String(b.start_at ?? b.note),
        ),
      );
    const filters = [
      ...new Set(
        (data[table] ?? [])
          .flatMap((r) => [
            r.status ?? r.owner ?? r.category,
            r.date,
            typeof r.checked === "boolean"
              ? String(r.checked)
              : typeof r.purchased === "boolean"
                ? String(r.purchased)
                : null,
          ])
          .filter((v): v is string => typeof v === "string"),
      ),
    ];
    return (
      <>
        <div className="row between">
          <h1>{labels[table]}</h1>
          {addButton(table)}
        </div>
        <div className="grid" style={{ marginBottom: 18 }}>
          <label>
            검색
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 메모 검색"
            />
          </label>
          <label>
            필터
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">전체</option>
              {filters.map((v) => (
                <option key={v} value={v}>
                  {words[v] ??
                    (v === "true" ? "완료" : v === "false" ? "미완료" : v)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {table === "expenses" && (
          <div className="grid">
            {settlement(data.expenses, members).map((m) => (
              <div className="card" key={m.user_id}>
                <h3>
                  {m.display_name} ({words[m.slot]})
                </h3>
                <p>
                  결제 {yenLabel(m.paid)} · 부담 {yenLabel(m.share)}
                </p>
                <strong>
                  {m.balance < 0
                    ? `상대에게 보낼 금액 ${yenLabel(-m.balance)}`
                    : m.balance > 0
                      ? `상대에게 받을 금액 ${yenLabel(m.balance)}`
                      : "정산 완료"}
                </strong>
              </div>
            ))}
          </div>
        )}
        {table === "budget_items" && (
          <div className="notice">
            <b>
              2인 예상 예산{" "}
              {yenLabel(
                data.budget_items.reduce(
                  (s, r) => s + Number(r.estimated_amount_yen),
                  0,
                ),
              )}
              –
              {yenLabel(
                data.budget_items.reduce(
                  (s, r) =>
                    s + Number(r.estimated_max_yen ?? r.estimated_amount_yen),
                  0,
                ),
              )}
            </b>
            <p>
              실제 지출{" "}
              {yenLabel(
                data.expenses.reduce((s, r) => s + Number(r.amount), 0),
              )}{" "}
              · 예상은 등록된 항목 기준입니다. 교통비 Seed에는 항공·숙박·식비
              등이 포함되지 않습니다.
            </p>
          </div>
        )}
        {!rows.length && (
          <div className="card empty">
            등록된 항목이 없습니다. 추가 버튼으로 첫 항목을 등록해보세요.
          </div>
        )}
        {rows.map((row) => (
          <article className="card" key={row.id}>
            <div className="row between">
              <h3>
                {String(
                  row.title ??
                    row.label ??
                    row.name ??
                    row.custom_name ??
                    labels[table],
                )}
              </h3>
              {row.status && (
                <span className="pill">
                  {words[String(row.status)] ?? row.status}
                </span>
              )}
            </div>
            {(table === "packing_items" || table === "checklist_items") &&
              checks(table, [row])}
            {forms[table]
              .filter(
                (f) =>
                  row[f.key] != null &&
                  row[f.key] !== "" &&
                  ![
                    "title",
                    "name",
                    "label",
                    "status",
                    "checked",
                    "purchased",
                  ].includes(f.key),
              )
              .map((f) => {
                const value = row[f.key];
                if (f.ref) {
                  const related =
                    f.ref === "members"
                      ? members.find((m) => m.user_id === value)?.display_name
                      : (
                          data[f.ref === "meals" ? "schedule_items" : f.ref] ??
                          []
                        ).find((r) => r.id === value);
                  return (
                    <p className="muted" key={f.key}>
                      {f.label}:{" "}
                      {typeof related === "string"
                        ? related
                        : String(
                            related?.title ??
                              related?.custom_name ??
                              "연결 확인 필요",
                          )}
                    </p>
                  );
                }
                if (f.type === "url")
                  return (
                    <a
                      className="link"
                      key={f.key}
                      href={String(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {f.label} ↗
                    </a>
                  );
                return (
                  <p key={f.key} className="muted">
                    {f.label}:{" "}
                    {typeof value === "boolean"
                      ? value
                        ? "예"
                        : "아니오"
                      : f.type === "datetime"
                        ? new Date(String(value)).toLocaleString("ko-KR", {
                            timeZone: "Asia/Tokyo",
                          })
                        : (words[String(value)] ?? String(value))}
                  </p>
                );
              })}
            {table === "reservations" && (
              <>
                <div className="row">
                  <button
                    disabled={!row.reservation_number}
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(String(row.reservation_number))
                        .catch(() => setError("복사할 수 없습니다"));
                    }}
                  >
                    예약번호 복사
                  </button>
                  <button
                    disabled={!writable}
                    onClick={() =>
                      setEditor({
                        table: "reservation_schedule_items",
                        row: {
                          ...defaults("reservation_schedule_items", date),
                          reservation_id: row.id,
                        },
                      })
                    }
                  >
                    일정 연결
                  </button>
                </div>
                {data.reservation_schedule_items
                  .filter((l) => l.reservation_id === row.id)
                  .map((l) => (
                    <div className="row" key={l.id}>
                      <p>
                        {String(
                          data.schedule_items.find(
                            (s) => s.id === l.schedule_item_id,
                          )?.title,
                        )}
                      </p>
                      <button
                        disabled={!writable || busy}
                        onClick={() => {
                          void mutate(
                            "reservation_schedule_items",
                            l,
                            {},
                            true,
                          ).catch(() => {});
                        }}
                      >
                        연결 해제
                      </button>
                    </div>
                  ))}
                <ReservationFiles
                  reservation={row}
                  attachments={data.reservation_attachments.filter(
                    (a) => a.reservation_id === row.id,
                  )}
                  writable={writable}
                  onRefresh={refresh}
                />
              </>
            )}
            {table === "shopping_items" && (
              <button
                disabled={!writable || busy}
                onClick={() => {
                  void mutate(table, row, {
                    ...row,
                    purchased: !row.purchased,
                  }).catch(() => {});
                }}
              >
                {row.purchased ? "✓ 구매 완료 · 취소" : "구매 완료로 표시"}
              </button>
            )}
            {actions(table, row)}
          </article>
        ))}
      </>
    );
  }
  return (
    <div className="shell">
      <header className="top">
        <Link href="/" className="brand">
          둘이, 일본<span style={{ color: "#94a98f" }}> ✳</span>
        </Link>
        <span className="pill">12.22 — 12.27 · 2명</span>
      </header>
      <div className="row between" style={{ marginBottom: 12 }}>
        <small className="muted">
          {offline ? "오프라인 · 저장 불가" : sync}
        </small>
        <button
          onClick={() => {
            setError("");
            void refresh();
          }}
          disabled={busy}
        >
          새로고침
        </button>
      </div>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {busy && (
        <p className="notice" role="status">
          저장 중…
        </p>
      )}
      {offline && (
        <p className="notice">
          마지막으로 불러온 정보를 표시합니다. 연결이 복구되면 다시
          불러와주세요.
        </p>
      )}
      {["today", "schedule", "map"].includes(view) && (
        <div className="dates" aria-label="여행 날짜">
          {data.trip_days.map((d) => (
            <button
              key={d.id}
              className={date === d.date ? "selected" : ""}
              onClick={() => setDate(String(d.date))}
            >
              <small>DAY {d.day_number}</small>
              <br />
              {String(d.date).slice(5).replace("-", "/")}
            </button>
          ))}
        </div>
      )}
      {view === "today" && (
        <>
          <section className="hero">
            <span className="eyebrow">
              Our winter journey · Day {day?.day_number} ·{" "}
              {dday > 0 ? `D-${dday}` : dday === 0 ? "D-Day" : `D+${-dday}`}
            </span>
            <h1>{String(day?.title)}</h1>
            <p>{date.replaceAll("-", ".")} · 일본 현지시간</p>
            <div className="row">
              <span className="pill">
                숙소 · {String(day?.hotel_name ?? "귀국하는 날")}
              </span>
              <button onClick={() => changeView("emergency_contacts")}>
                긴급정보 ↗
              </button>
            </div>
            {preview && (
              <p className="notice">
                오늘은 {today}입니다. 선택한 여행 날짜를 미리 보고 있어요.
              </p>
            )}
          </section>
          <div className="row" style={{ marginBottom: 18 }}>
            <span className="pill">
              해야 할 일 {checklist.filter((r) => r.status === "TODO").length}
            </span>
            <span className="pill">
              준비물 미완료 {packing.filter((r) => !r.checked).length}
            </span>
            <span className="pill">
              확인 필요한 예약{" "}
              {
                reservations.filter((r) =>
                  ["PLANNED", "BOOKED"].includes(String(r.status)),
                ).length
              }
            </span>
            {!preview && minutes != null && minutes <= 30 && (
              <span className="pill">
                {String(next?.title).includes("체크아웃")
                  ? "체크아웃 임박"
                  : "출발 임박"}{" "}
                · {minutes}분
              </span>
            )}
          </div>
          <div className="grid">
            <section className="card">
              <span className="eyebrow">
                {current ? "지금 일정" : preview ? "첫 일정" : "다음 일정"}
              </span>
              <h2 style={{ marginTop: 12 }}>
                {String((current ?? next)?.title ?? "오늘 일정이 끝났어요")}
              </h2>
              <p className="muted">
                {String((current ?? next)?.time_label ?? "")}
                {!preview && minutes != null
                  ? ` · 다음 일정까지 ${minutes}분`
                  : ""}
              </p>
              <button onClick={() => changeView("schedule")}>
                전체 일정 보기 →
              </button>
            </section>
            <section className="card">
              <span className="eyebrow">Today’s budget · 2명</span>
              <p className="stat">
                {yenLabel(
                  Number(day?.estimated_cost_min_yen ?? 0) * 2 + extraEstimate,
                )}
                –
                {yenLabel(
                  Number(day?.estimated_cost_max_yen ?? 0) * 2 + extraEstimate,
                )}
              </p>
              <small className="muted">
                등록된 교통·관광 예상액 · 미입력 비용 제외
              </small>
              <p>
                오늘 교통비 / 1인{" "}
                {yenLabel(Number(day?.estimated_cost_min_yen ?? 0))}–
                {yenLabel(Number(day?.estimated_cost_max_yen ?? 0))}
              </p>
              <p>
                오늘 실제 지출 <b>{yenLabel(totalActual)}</b>
              </p>
              <button onClick={() => changeView("expenses")}>
                지출 / 정산
              </button>{" "}
              {addButton("expenses")}
            </section>
          </div>
          {(preview
            ? data.transport_segments.find((t) => t.date === date)
            : nextTransport) &&
            transport(
              (preview
                ? data.transport_segments.find((t) => t.date === date)
                : nextTransport)!,
            )}
          <div className="grid">
            <section className="card">
              <div className="row between">
                <h2>해야 할 일</h2>
                <span className="pill">
                  미완료 {checklist.filter((r) => r.status === "TODO").length}
                </span>
              </div>
              {checks(
                "checklist_items",
                checklist
                  .filter((r) => r.status === "TODO")
                  .sort((a, b) => Number(b.priority) - Number(a.priority))
                  .slice(0, 5),
              )}
              <button onClick={() => changeView("checklist_items")}>
                체크리스트 전체
              </button>
            </section>
            <section className="card">
              <div className="row between">
                <h2>오늘의 준비물</h2>
                <span className="pill">
                  미완료 {packing.filter((r) => !r.checked).length}
                </span>
              </div>
              {checks(
                "packing_items",
                packing.filter((r) => !r.checked).slice(0, 5),
              )}
              <button onClick={() => changeView("packing_items")}>
                준비물 전체
              </button>
            </section>
          </div>
          <section className="card">
            <h2>오늘 사용할 예약</h2>
            {reservations.length ? (
              reservations.map((r) => (
                <p key={r.id}>
                  {String(r.title)} · {words[String(r.status)]}
                </p>
              ))
            ) : (
              <p className="muted">
                연결된 예약이 없습니다. 예약 허브에서 일정과 연결해보세요.
              </p>
            )}
            <button onClick={() => changeView("reservations")}>
              예약정보 보기
            </button>
          </section>
          <section className="card">
            <h2>오늘의 식사</h2>
            {schedules
              .filter((s) => s.type === "MEAL")
              .map((s) => (
                <div key={s.id}>
                  <h3>
                    {String(s.time_label)} · {String(s.title)}
                  </h3>
                  {data.meal_candidates
                    .filter((c) => c.meal_schedule_id === s.id)
                    .map((c) => (
                      <p key={c.id}>
                        {String(
                          data.places.find((p) => p.id === c.place_id)
                            ?.custom_name,
                        )}
                        {c.visited ? " · ✓ 실제 방문" : ""}
                      </p>
                    ))}
                </div>
              ))}
            <button onClick={() => changeView("places")}>후보 식당 찾기</button>
          </section>
        </>
      )}
      {view === "schedule" && (
        <>
          <div className="row between">
            <h1>우리의 일정</h1>
            <div className="row">
              {addButton("schedule_items")}
              <button
                disabled={!writable || busy || schedules.length < 2}
                onClick={() => setOrdering(true)}
              >
                순서 편집
              </button>
              {addButton("transport_segments")}
            </div>
          </div>
          <p className="muted">
            Day {day?.day_number} · {String(day?.title)}
          </p>
          <label>
            일정 검색
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="일정 또는 메모"
            />
          </label>
          {search ? (
            <div style={{ marginTop: 16 }}>
              {schedules
                .filter((s) => String(s.title + " " + s.note).includes(search))
                .map((s) => (
                  <div className="card" key={s.id}>
                    <h3>{String(s.title)}</h3>
                    <button onClick={() => setDetail(s)}>상세 보기</button>
                  </div>
                ))}
            </div>
          ) : (
            timeline()
          )}
          {data.transport_segments
            .filter((t) => t.date === date && !t.schedule_item_id)
            .map((t) => transport(t))}
          {!schedules.length && (
            <p className="empty">일정이 없습니다. 일정을 추가해보세요.</p>
          )}
        </>
      )}
      {view === "places" && (
        <Places
          data={data}
          writable={writable && !busy}
          edit={edit}
          mutate={mutate}
          refresh={refresh}
          initialPlaceId={placeToConnect}
        />
      )}
      {view === "map" && (
        <TravelMap
          data={data}
          date={date}
          onConnectPlace={(id) => {
            changeView("places");
            setPlaceToConnect(id);
          }}
        />
      )}
      {view === "more" && (
        <>
          <span className="eyebrow">Everything for our trip</span>
          <h1>여행을 준비하는 것들</h1>
          <div className="menu">
            {menu.map((v) => (
              <button key={v} onClick={() => changeView(v)}>
                {labels[v] ?? (v === "info" ? "여행정보" : "설정")}{" "}
                <ArrowUpRight size={16} style={{ float: "right" }} />
              </button>
            ))}
          </div>
        </>
      )}
      {view === "info" && (
        <>
          <h1>여행정보</h1>
          <section className="card">
            <h2>센다이 · 아키우 · 도쿄</h2>
            <p>
              2026.12.22 — 12.27 · 2명
              <br />
              Asia/Tokyo · JPY
              <br />
              대중교통 우선 · 식당 직접 선택
            </p>
            {data.reservations
              .filter((r) =>
                ["HOTEL", "FLIGHT", "INSURANCE"].includes(String(r.type)),
              )
              .map((r) => (
                <p key={r.id}>
                  {String(r.title)} · {words[String(r.status)]}
                </p>
              ))}
            <p>교통 IC카드 및 패스 메모는 메모 / 회고에 등록할 수 있습니다.</p>
          </section>
        </>
      )}
      {view === "settings" && (
        <>
          <h1>설정</h1>
          <div className="card">
            <p>
              {member?.display_name} · {words[String(member?.role)]}
            </p>
            <p>일본 현지시간 · 엔화 · 두 계정 공동 편집</p>
            <p className="muted">
              오프라인 정보는 현재 브라우저 탭에 보관됩니다. 로그아웃하면
              지워집니다.
            </p>
            <button
              className="row"
              onClick={async () => {
                setBusy(true);
                try {
                  const response = await fetch("/api/logout", {
                    method: "POST",
                  });
                  if (!response.ok) throw new Error("로그아웃 실패");
                  sessionStorage.removeItem("senkyo-offline");
                  router.replace("/login");
                  router.refresh();
                } catch {
                  setError("로그아웃하지 못했습니다. 다시 시도해주세요");
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </>
      )}
      {Object.hasOwn(forms, view) &&
        ![
          "places",
          "schedule_items",
          "meal_candidates",
          "reservation_schedule_items",
          "schedule_places",
        ].includes(view) &&
        genericList(view as Table)}
      {editor && (
        <Editor
          key={editor.row.id || editor.table}
          table={editor.table}
          row={editor.row}
          data={data}
          members={members}
          onClose={() => setEditor(null)}
          onSave={(values) => mutate(editor.table, editor.row, values)}
        />
      )}
      {detail && (
        <ScheduleDetail
          item={detail}
          data={data}
          close={() => setDetail(null)}
          edit={() => {
            edit("schedule_items", detail);
            setDetail(null);
          }}
          writable={writable}
          openReservation={openReservation}
          members={members}
          refresh={refresh}
        />
      )}
      {ordering && (
        <ScheduleOrder
          date={date}
          items={schedules}
          close={() => setOrdering(false)}
          refresh={refresh}
        />
      )}
      {reservationDetail && (
        <ReservationDetail
          key={reservationDetail.id}
          reservation={reservationDetail}
          data={data}
          writable={writable}
          close={() => setReservationDetailId(null)}
          refresh={refresh}
          edit={() => {
            edit("reservations", reservationDetail);
            setReservationDetailId(null);
          }}
        />
      )}
      <nav className="nav" aria-label="주요 화면">
        {tabs.map(({ view: v, label, Icon }) => (
          <button
            key={v}
            className={
              view === v ||
              (v === "more" &&
                !["today", "schedule", "map", "places"].includes(view))
                ? "active"
                : ""
            }
            onClick={() => changeView(v)}
            aria-current={view === v ? "page" : undefined}
          >
            <Icon size={21} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
function ScheduleDetail({
  item,
  data,
  close,
  edit,
  writable,
  openReservation,
  members,
  refresh,
}: {
  item: Row;
  data: Data;
  close: () => void;
  edit: () => void;
  writable: boolean;
  openReservation: (id: string) => void;
  members: Member[];
  refresh: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const place = data.places.find((p) => p.id === item.place_id);
  const packing = data.packing_items.filter(
    (p) => p.schedule_item_id === item.id,
  );
  const checklist = data.checklist_items.filter(
    (p) => p.schedule_item_id === item.id,
  );
  return (
    <dialog ref={dialog} onCancel={close}>
      <div className="row between">
        <h2>{String(item.title)}</h2>
        <button onClick={close}>닫기</button>
      </div>
      <p>
        {String(item.date)} · {String(item.time_label)} ·{" "}
        {words[String(item.status)]}
      </p>
      <p>{String(item.description)}</p>
      <p>{String(item.note)}</p>
      {place && (
        <>
          <p>{String(place.custom_name)}</p>
          <a
            className="link"
            href={mapsUrl(
              String(place.custom_name),
              undefined,
              "transit",
              String(place.google_place_id ?? "") || undefined,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps ↗
          </a>
        </>
      )}
      {packing.length > 0 && (
        <section>
          <h3>준비물</h3>
          {packing.map((p) => (
            <p key={p.id}>
              {p.checked ? "✓" : "□"} {String(p.label)}
            </p>
          ))}
        </section>
      )}
      {checklist.length > 0 && (
        <section>
          <h3>체크리스트</h3>
          {checklist.map((p) => (
            <p key={p.id}>
              {p.status === "DONE" ? "✓" : "□"} {String(p.title)}
            </p>
          ))}
        </section>
      )}
      <ScheduleConnections
        item={item}
        data={data}
        members={members}
        writable={writable}
        refresh={refresh}
        openReservation={openReservation}
      />
      {item.estimated_cost_yen != null && (
        <p>1인 예상비용 {yenLabel(Number(item.estimated_cost_yen))}</p>
      )}
      <button disabled={!writable} className="primary" onClick={edit}>
        일정 수정
      </button>
    </dialog>
  );
}
