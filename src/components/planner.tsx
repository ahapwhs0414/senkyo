"use client";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  MapPin,
  LayoutGrid,
  Sun,
  ClipboardCheck,
  Snowflake,
  TrainFront,
  Utensils,
  ArrowUpRight,
  Plus,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type Data,
  type Row,
  type Table,
  type Member,
  TRIP_ID,
  tokyoDate,
  inScope,
  packingChecked,
  currentSchedule,
  placeMapUrl,
} from "@/lib/domain";
import { defaults, labels, words, forms } from "@/lib/forms";
import { browserClient } from "@/lib/supabase-browser";
import { Editor } from "./editor";
import { TravelMap } from "./travel-map";
import { Sheet } from "./sheet";
import { ReservationFiles } from "./reservation-files";

type View =
  | "today"
  | "schedule"
  | "map"
  | "preparation"
  | "more"
  | "reservations"
  | "shopping_items"
  | "emergency_contacts"
  | "notes"
  | "settings"
  | "info"
  | "archive";
type PreparationTable = "packing_items" | "checklist_items";
const tabs = [
  { view: "today", label: "오늘", Icon: Sun },
  { view: "schedule", label: "일정", Icon: CalendarDays },
  { view: "map", label: "지도", Icon: MapPin },
  { view: "preparation", label: "준비", Icon: ClipboardCheck },
  { view: "more", label: "더보기", Icon: LayoutGrid },
] as const;
const menu: { view: View; label: string }[] = [
  { view: "reservations", label: "예약자료" },
  { view: "shopping_items", label: "쇼핑" },
  { view: "emergency_contacts", label: "긴급정보" },
  { view: "notes", label: "메모 / 회고" },
  { view: "archive", label: "보관된 자료" },
  { view: "info", label: "여행정보" },
  { view: "settings", label: "설정" },
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
  const [date, setDate] = useState(() =>
    initial.trip_days.some((d) => d.date === tokyoDate())
      ? tokyoDate()
      : "2026-12-22",
  );
  const [clock, setClock] = useState(() => new Date());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [sync, setSync] = useState("연결 중");
  const [editor, setEditor] = useState<{ table: Table; row: Row } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [daily, setDaily] = useState<PreparationTable | null>(null);
  const [preTrip, setPreTrip] = useState(true);
  const member = members.find((m) => m.user_id === userId);
  const writable = !offline && member?.role !== "VIEWER";
  const refresh = useCallback(async () => {
    const response = await fetch("/api/data", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "새로고침 실패");
    setData(result);
    setOffline(false);
  }, []);
  useEffect(() => {
    const reload = () => {
      void refresh().catch((e) => {
        setError(e.message);
        setOffline(!navigator.onLine);
      });
    };
    const timer = setInterval(() => {
      setClock(new Date());
      if (navigator.onLine) reload();
    }, 30000);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", reload);
    window.addEventListener("offline", onOffline);
    const client = browserClient();
    const channel = client
      .channel(`trip-${TRIP_ID}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", filter: `trip_id=eq.${TRIP_ID}` },
        reload,
      )
      .subscribe((status) =>
        setSync(
          status === "SUBSCRIBED"
            ? "함께 동기화 중"
            : ["CHANNEL_ERROR", "TIMED_OUT"].includes(status)
              ? "실시간 연결 끊김 · 주기적으로 갱신"
              : "연결 중",
        ),
      );
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", reload);
      window.removeEventListener("offline", onOffline);
      void client.removeChannel(channel);
    };
  }, [refresh]);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "senkyo-offline",
        JSON.stringify({
          userId,
          savedAt: new Date().toISOString(),
          data: Object.fromEntries(
            Object.entries(data).filter(
              ([k]) =>
                ![
                  "reservation_attachments",
                  "profiles",
                  "trip_members",
                ].includes(k),
            ),
          ),
        }),
      );
    } catch {
      /* Online usage remains available. */
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
      const result = await response.json();
      if (!response.ok) {
        // Preserve the open form's input, but let reopening use the latest row.
        const refreshed =
          response.status === 409
            ? await refresh()
                .then(() => true)
                .catch(() => false)
            : false;
        throw Object.assign(new Error(result.error), { refreshed });
      }
      await refresh();
      return result as Row;
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했습니다");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const active = (data.schedule_items ?? []).filter((s) => !s.archived);
  const schedules = active
    .filter((s) => s.date === date)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  const day = data.trip_days.find((d) => d.date === date);
  const detail = data.schedule_items.find((s) => s.id === detailId);
  const reservation = data.reservations.find((r) => r.id === reservationId);
  const checks = data.packing_checks ?? [];
  const packing = data.packing_items.filter((p) =>
    inScope(p, date, active, data.packing_schedule_items ?? []),
  );
  const checklist = data.checklist_items.filter((p) =>
    inScope(p, date, active),
  );
  const before = data.checklist_items
    .filter((p) => !p.archived && p.scope === "PRE_TRIP")
    .sort((a, b) =>
      String(a.due_at ?? "").localeCompare(String(b.due_at ?? "")),
    );
  const today = tokyoDate(clock),
    preview = today !== date;
  const daysLeft = Math.ceil(
    (Date.parse("2026-12-22T00:00:00Z") - Date.parse(`${today}T00:00:00Z`)) /
      86400000,
  );
  const featured = currentSchedule(schedules, date, clock);
  const next = featured.current ?? featured.next;
  const completed = (table: PreparationTable, row: Row) =>
    table === "packing_items"
      ? packingChecked(row, date, checks)
      : row.status === "DONE";
  const ownerName = (owner: unknown) =>
    owner === "SHARED"
      ? "공동"
      : (members.find((m) => m.slot === owner)?.display_name ??
        words[String(owner)] ??
        String(owner));
  const changeView = (target: View) => {
    setView(target);
    setDetailId(null);
    setReservationId(null);
    setEditor(null);
    setDaily(null);
  };
  function edit(table: Table, row?: Row, extra: Partial<Row> = {}) {
    setEditor({ table, row: row ?? { ...defaults(table, date), ...extra } });
  }
  function openSchedule(s: Row) {
    setDetailId(s.id);
    setReservationId(null);
    setEditor(null);
  }
  async function toggle(table: PreparationTable, row: Row, checked: boolean) {
    const target: Table =
      table === "packing_items" && row.repeat_daily ? "packing_checks" : table;
    const existing =
      target === "packing_checks"
        ? checks.find(
            (c) =>
              c.packing_item_id === row.id &&
              c.date === date &&
              c.owner === row.owner,
          )
        : row;
    const record: Row = existing ?? {
      id: "",
      trip_id: TRIP_ID,
      packing_item_id: row.id,
      date,
      owner: row.owner,
    };
    const values =
      target === "packing_checks"
        ? { ...record, checked }
        : {
            ...row,
            [table === "packing_items" ? "checked" : "status"]:
              table === "packing_items" ? checked : checked ? "DONE" : "TODO",
          };
    setData((d) => ({
      ...d,
      [target]: existing
        ? (d[target] ?? []).map((r) =>
            r.id === record.id ? { ...r, ...values } : r,
          )
        : [...(d[target] ?? []), { ...record, ...values }],
    }));
    try {
      await mutate(target, record, values);
    } catch (e) {
      // A conflict refresh already contains the other user's current check.
      if (e instanceof Error && "refreshed" in e && e.refreshed) return;
      setData((d) => ({
        ...d,
        [target]: existing
          ? (d[target] ?? []).map((r) => (r.id === record.id ? record : r))
          : (d[target] ?? []).filter(
              (r) =>
                !(
                  r.packing_item_id === row.id &&
                  r.date === date &&
                  r.owner === row.owner
                ),
            ),
      }));
    }
  }
  function preparationRows(
    table: PreparationTable,
    rows: Row[],
    editable = false,
  ) {
    return rows.map((row) => (
      <div className="preparation-row" key={row.id}>
        <label
          className={`check ${completed(table, row) ? "is-complete" : ""}`}
        >
          <input
            type="checkbox"
            checked={completed(table, row)}
            disabled={!writable || busy}
            onChange={(e) => {
              void toggle(table, row, e.target.checked);
            }}
          />
          <span>
            <strong>{String(row.label ?? row.title)}</strong>
            <small>
              {ownerName(row.owner)} ·{" "}
              {row.scope === "PRE_TRIP"
                ? "출발 전"
                : row.schedule_item_id
                  ? String(
                      active.find((s) => s.id === row.schedule_item_id)
                        ?.title ?? "보관 일정",
                    )
                  : row.repeat_daily
                    ? "오늘 휴대함"
                    : row.date
                      ? "날짜별"
                      : "공통 · 짐 싸기 완료"}
              {completed(table, row) ? " · 완료" : " · 미완료"}
            </small>
            {row.due_at && (
              <small>확인일 {String(row.due_at).slice(0, 10)}</small>
            )}
            {!row.schedule_item_id &&
              (data.packing_schedule_items ?? []).some(
                (l) => l.packing_item_id === row.id,
              ) && (
                <small>
                  관련 일정:{" "}
                  {schedules
                    .filter((s) =>
                      (data.packing_schedule_items ?? []).some(
                        (l) =>
                          l.packing_item_id === row.id &&
                          l.schedule_item_id === s.id,
                      ),
                    )
                    .map((s) => String(s.title))
                    .join(" · ")}
                </small>
              )}
          </span>
        </label>
        {editable && (
          <div className="row">
            <button
              disabled={!writable || busy}
              onClick={() => edit(table, row)}
            >
              수정
            </button>
            <button
              disabled={!writable || busy}
              onClick={() => {
                if (confirm("이 준비 항목을 삭제할까요?"))
                  void mutate(table, row, {}, true).catch(() => {});
              }}
            >
              삭제
            </button>
          </div>
        )}
      </div>
    ));
  }
  const mapLink = (p: Row) => (
    <a
      className="link"
      href={placeMapUrl(p)}
      target="_blank"
      rel="noopener noreferrer"
    >
      지도 보기 <ArrowUpRight size={16} />
    </a>
  );
  function schedulePlaces(s: Row) {
    const links = (data.schedule_places ?? [])
      .filter((l) => !l.archived && l.schedule_item_id === s.id)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    const ids = links.map((l) => l.place_id);
    if (s.place_id && !ids.includes(s.place_id)) ids.unshift(s.place_id);
    return ids
      .map((id) => data.places.find((p) => p.id === id && !p.archived))
      .filter((p): p is Row => Boolean(p));
  }
  function timeline(rows = schedules) {
    return (
      <div className="timeline-list">
        {rows.map((s) => (
          <article key={s.id} className="timeline">
            <span className="time">
              {String(s.start_time ?? "미정").slice(0, 5)}
            </span>
            <div className="card">
              <div className="row">
                <span className="pill">{words[String(s.type)]}</span>
                {s.is_fixed && (
                  <span className="pill">계획 시간 고정 · 예약 별도</span>
                )}
              </div>
              <h3>{String(s.title)}</h3>
              <p className="muted">{String(s.time_label)}</p>
              <button onClick={() => openSchedule(s)}>
                {["FLIGHT", "TRAIN", "TRANSIT"].includes(String(s.type))
                  ? "예약자료 보기"
                  : s.type === "MEAL"
                    ? "식당 보기"
                    : "일정 상세"}
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }
  async function addMaterial(
    scheduleId: string,
    reservationId?: string,
    title?: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: scheduleId,
          reservation_id: reservationId,
          title,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await refresh();
      setReservationId(result.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "자료 연결 실패");
    } finally {
      setBusy(false);
    }
  }
  function reservationPanel(r: Row) {
    return (
      <section className="stack">
        {detail && (
          <button
            onClick={() => {
              setReservationId(null);
              setEditor(null);
            }}
          >
            일정으로 돌아가기
          </button>
        )}
        <h3>{String(r.title)}</h3>
        <span className="pill">
          {r.material_only ? "비예약 이동자료" : words[String(r.status)]}
        </span>
        {forms.reservations
          .filter(
            (f) =>
              !["title", "material_only"].includes(f.key) &&
              r[f.key] != null &&
              r[f.key] !== "",
          )
          .map((f) => (
            <p className="attachment-text" key={f.key}>
              <strong>{f.label}</strong>
              <br />
              {f.type === "url" ? (
                <a
                  className="link"
                  href={String(r[f.key])}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  열기 ↗
                </a>
              ) : f.type === "datetime" ? (
                new Date(String(r[f.key])).toLocaleString("ko-KR", {
                  timeZone: "Asia/Tokyo",
                })
              ) : (
                (words[String(r[f.key])] ?? String(r[f.key]))
              )}
            </p>
          ))}
        {r.reservation_number && (
          <CopyButton value={String(r.reservation_number)} />
        )}
        <button
          className="primary"
          disabled={!writable || busy}
          onClick={() => edit("reservations", r)}
        >
          예약 수정
        </button>
        <ReservationFiles
          reservation={r}
          attachments={(data.reservation_attachments ?? []).filter(
            (a) => a.reservation_id === r.id,
          )}
          writable={writable}
          onRefresh={refresh}
        />
        <p className="muted">
          사업자의 원본 앱·갱신되는 QR이 필요할 수 있습니다. 필요한 파일은 미리
          다운로드해주세요. 첨부는 오프라인으로 캐시하지 않습니다.
        </p>
      </section>
    );
  }
  function detailPanel(s: Row) {
    const ps = schedulePlaces(s),
      transport = data.transport_segments.find(
        (t) => !t.archived && t.schedule_item_id === s.id,
      );
    const relatedIds = data.reservation_schedule_items
      .filter((l) => l.schedule_item_id === s.id)
      .map((l) => l.reservation_id);
    const materials = data.reservations.filter(
      (r) => !r.archived && relatedIds.includes(r.id),
    );
    const pRows = packing.filter(
      (p) =>
        p.schedule_item_id === s.id ||
        (data.packing_schedule_items ?? []).some(
          (l) => l.packing_item_id === p.id && l.schedule_item_id === s.id,
        ),
    );
    const cRows = checklist.filter((c) => c.schedule_item_id === s.id);
    return (
      <section className="stack">
        <span className="pill">
          {words[String(s.type)]} · {String(s.date)}
        </span>
        <p className="departure-time">{String(s.time_label)}</p>
        <p>{String(s.description)}</p>
        {transport && (
          <section className="notice">
            <TrainFront size={20} />
            <p>
              {String(transport.origin_name)} →{" "}
              {String(transport.destination_name)}
            </p>
            {transport.estimated_duration_minutes != null && (
              <p>
                계획 소요시간 {Number(transport.estimated_duration_minutes)}분 ·
                운행 확인 필요
              </p>
            )}
          </section>
        )}
        <h3>{s.type === "MEAL" ? "고정 식당" : "연결 장소"}</h3>
        {ps.length ? (
          ps.map((p) => (
            <section className="place-row" key={p.id}>
              {s.type === "MEAL" && <Utensils size={20} />}
              <strong>{String(p.custom_name)}</strong>
              <p className="muted">{String(p.memo)}</p>
              {mapLink(p)}
            </section>
          ))
        ) : (
          <p className="notice">
            {s.type === "MEAL"
              ? "식당 지점 또는 식사 위치 확인 필요 · 임의 지점을 표시하지 않습니다."
              : "정확한 장소 확인 필요"}
          </p>
        )}
        <h3>예약자료</h3>
        {materials.map((r) => (
          <button key={r.id} onClick={() => setReservationId(r.id)}>
            {String(r.title)} ·{" "}
            {r.material_only ? "이동자료" : words[String(r.status)]}
          </button>
        ))}
        {!materials.length && (
          <p className="empty">
            등록된 예약자료가 없습니다. 안내 텍스트나 파일을 추가해보세요.
          </p>
        )}
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void addMaterial(s.id, undefined, String(form.get("title")));
          }}
        >
          <label>
            새 이동자료 제목
            <input
              name="title"
              required
              maxLength={200}
              disabled={!writable || busy}
              placeholder="시각표·환승 안내 등"
            />
          </label>
          <button disabled={!writable || busy}>자료 추가하기</button>
        </form>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void addMaterial(s.id, String(form.get("reservation_id")));
          }}
        >
          <label>
            기존 예약 연결
            <select name="reservation_id" required disabled={!writable || busy}>
              <option value="">예약 선택</option>
              {data.reservations
                .filter((r) => !r.archived && !relatedIds.includes(r.id))
                .map((r) => (
                  <option value={r.id} key={r.id}>
                    {String(r.title)}
                  </option>
                ))}
            </select>
          </label>
          <button disabled={!writable || busy}>기존 자료 연결</button>
        </form>
        <h3>일정별 준비물</h3>
        {preparationRows("packing_items", pRows, true)}
        <button
          disabled={!writable || busy}
          onClick={() =>
            edit("packing_items", undefined, {
              date: s.date,
              schedule_item_id: s.id,
              sort_order: 0,
            })
          }
        >
          <Plus size={16} /> 준비물 추가
        </button>
        <h3>일정별 할 일</h3>
        {preparationRows("checklist_items", cRows, true)}
        <button
          disabled={!writable || busy}
          onClick={() =>
            edit("checklist_items", undefined, {
              date: s.date,
              schedule_item_id: s.id,
              scope: "SCHEDULE",
              priority: 1,
            })
          }
        >
          <Plus size={16} /> 할 일 추가
        </button>
      </section>
    );
  }
  const closeDetail = () => {
    setDetailId(null);
    setReservationId(null);
    setEditor(null);
  };
  const saveEditor = async (values: Record<string, unknown>) => {
    if (editor) await mutate(editor.table, editor.row, values);
  };
  const archivedPreparations = (table: PreparationTable) =>
    data[table].filter(
      (p) =>
        p.archived ||
        (p.schedule_item_id &&
          data.schedule_items.some(
            (s) => s.id === p.schedule_item_id && s.archived,
          )),
    );
  return (
    <main className="shell">
      <header className="top">
        <div>
          <span className="brand">둘이, 일본</span>
          <small className="muted">Sendai · Akiu · Tokyo</small>
        </div>
        <span className="winter-badge">
          <Snowflake size={16} /> Winter 2026
        </span>
      </header>
      <div className="row between">
        <span className="muted sync">{sync}</span>
        <button
          onClick={() => {
            void refresh().catch((e) => setError(e.message));
          }}
        >
          새로고침
        </button>
      </div>
      {offline && (
        <p className="notice" role="status">
          오프라인 · 이전에 조회한 정보를 읽기 전용으로 표시합니다.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!["more", "settings", "info", "archive"].includes(view) && (
        <div className="dates" aria-label="여행 날짜">
          {data.trip_days.map((d) => (
            <button
              key={d.id}
              className={date === d.date ? "selected" : ""}
              aria-pressed={date === d.date}
              onClick={() => setDate(String(d.date))}
            >
              <small>DAY {Number(d.day_number)}</small>
              <strong>{String(d.date).slice(5).replace("-", "/")}</strong>
            </button>
          ))}
        </div>
      )}
      {view === "today" && (
        <>
          <section className="hero">
            <span className="eyebrow">
              <Snowflake size={16} /> OUR WINTER JOURNEY
            </span>
            <p>
              {preview
                ? `${date} 일정 미리보기`
                : "일본 현지시간 · 오늘의 여행"}
            </p>
            <h1>{String(day?.title ?? "겨울 여행")}</h1>
            <p>
              {daysLeft > 0
                ? `여행까지 D-${daysLeft} · 함께 준비하는 겨울`
                : today > "2026-12-27"
                  ? "여행을 마쳤어요. 함께한 일정을 돌아보세요."
                  : "우리의 겨울 여행, 한 걸음씩."}
            </p>
          </section>
          {(daysLeft > 0 || before.some((c) => c.status !== "DONE")) && (
            <section className="card">
              <h2>{daysLeft > 0 ? "출발 전 준비" : "출발 전 미완료"}</h2>
              <p>미완료 {before.filter((c) => c.status !== "DONE").length}개</p>
              {preparationRows(
                "checklist_items",
                before.filter((c) => c.status !== "DONE").slice(0, 3),
              )}
              <button
                onClick={() => {
                  setPreTrip(true);
                  changeView("preparation");
                }}
              >
                여행 전 체크리스트
              </button>
            </section>
          )}
          {next && (
            <section className="card next-card">
              <span className="pill">
                {preview
                  ? "미리보기"
                  : featured.current
                    ? "지금 일정"
                    : "다음 일정"}
              </span>
              <p className="departure-time">
                {String(next.start_time).slice(0, 5)}
              </p>
              <h2>{String(next.title)}</h2>
              <p className="muted">
                {String(next.time_label)} · {String(next.description)}
              </p>
              <button className="primary" onClick={() => openSchedule(next)}>
                {["FLIGHT", "TRAIN", "TRANSIT"].includes(String(next.type))
                  ? "예약자료 보기"
                  : next.type === "MEAL"
                    ? "식당 보기"
                    : "지도 보기"}
              </button>
            </section>
          )}
          <div className="grid">
            {(["packing_items", "checklist_items"] as const).map((table) => {
              const rows = table === "packing_items" ? packing : checklist;
              const pending = rows.filter((r) => !completed(table, r));
              return (
                <section className="card" key={table}>
                  <div className="row between">
                    <h2>
                      {table === "packing_items"
                        ? "오늘의 준비물"
                        : "오늘의 할 일"}
                    </h2>
                    <span className="pill">
                      {rows.length - pending.length}/{rows.length} 완료
                    </span>
                  </div>
                  {preparationRows(table, pending.slice(0, 3))}
                  {!pending.length && (
                    <p className="muted">준비를 모두 마쳤어요.</p>
                  )}
                  <button onClick={() => setDaily(table)}>
                    {table === "packing_items"
                      ? "준비물 전체"
                      : "체크리스트 전체"}
                  </button>
                </section>
              );
            })}
          </div>
          <h2>이후 일정</h2>
          {timeline(
            schedules
              .filter(
                (s) =>
                  s.start_time &&
                  (!next || Number(s.sort_order) > Number(next.sort_order)),
              )
              .slice(0, 3),
          )}
          <button onClick={() => changeView("schedule")}>전체 일정 보기</button>
          <section className="card hotel">
            <h2>오늘의 숙소</h2>
            <p>{String(day?.hotel_name)}</p>
          </section>
        </>
      )}
      {view === "schedule" && (
        <>
          <h1>전체 일정</h1>
          <p className="muted">
            {date} · 계획서 {String(data.trips[0]?.plan_version ?? "")}
          </p>
          {timeline()}
        </>
      )}
      {view === "map" && <TravelMap data={data} date={date} />}
      {view === "preparation" && (
        <>
          <h1>여행 준비</h1>
          <div className="row">
            <button
              aria-pressed={preTrip}
              className={preTrip ? "selected" : ""}
              onClick={() => setPreTrip(true)}
            >
              여행 전
            </button>
            <button
              aria-pressed={!preTrip}
              className={!preTrip ? "selected" : ""}
              onClick={() => setPreTrip(false)}
            >
              여행 중
            </button>
          </div>
          {preTrip ? (
            <section className="card">
              <h2>여행 전 체크리스트</h2>
              {preparationRows("checklist_items", before, true)}
              <button
                disabled={!writable || busy}
                onClick={() =>
                  edit("checklist_items", undefined, {
                    date: null,
                    scope: "PRE_TRIP",
                    priority: 1,
                  })
                }
              >
                여행 전 할 일 추가
              </button>
            </section>
          ) : (
            <>
              <h2>{date} 준비</h2>
              <section className="card">
                <h3>준비물</h3>
                {preparationRows("packing_items", packing, true)}
                <button
                  disabled={!writable || busy}
                  onClick={() =>
                    edit("packing_items", undefined, { sort_order: 0 })
                  }
                >
                  준비물 추가
                </button>
              </section>
              <section className="card">
                <h3>할 일</h3>
                {preparationRows("checklist_items", checklist, true)}
                <button
                  disabled={!writable || busy}
                  onClick={() =>
                    edit("checklist_items", undefined, {
                      scope: "DATE",
                      priority: 1,
                    })
                  }
                >
                  할 일 추가
                </button>
              </section>
            </>
          )}
        </>
      )}
      {view === "more" && (
        <>
          <h1>더보기</h1>
          <div className="menu">
            {menu.map((m) => (
              <button key={m.view} onClick={() => changeView(m.view)}>
                {m.label} <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </>
      )}
      {view === "reservations" && (
        <>
          <h1>예약자료</h1>
          <p className="muted">여행 일정에서 연결한 텍스트와 파일을 한곳에.</p>
          {data.reservations
            .filter((r) => !r.archived)
            .map((r) => (
              <article className="card" key={r.id}>
                <h2>{String(r.title)}</h2>
                <span className="pill">
                  {r.material_only
                    ? "비예약 이동자료"
                    : words[String(r.status)]}
                </span>
                <button
                  onClick={() => {
                    setReservationId(r.id);
                    setEditor(null);
                  }}
                >
                  자료 보기
                </button>
              </article>
            ))}
          <button
            disabled={!writable || busy}
            onClick={() => edit("reservations")}
          >
            예약 추가
          </button>
        </>
      )}
      {(["shopping_items", "emergency_contacts", "notes"] as const).map(
        (table) =>
          view === table && (
            <section key={table}>
              <h1>{labels[table]}</h1>
              <button
                className="primary"
                disabled={!writable || busy}
                onClick={() => edit(table)}
              >
                {labels[table]} 추가
              </button>
              {!(data[table] ?? []).length && (
                <p className="empty">아직 등록한 항목이 없습니다.</p>
              )}
              {(data[table] ?? []).map((r) => (
                <article className="card" key={r.id}>
                  <h2>{String(r.title ?? r.name)}</h2>
                  <p className="attachment-text">
                    {String(r.body ?? r.note ?? "")}
                  </p>
                  {r.phone && (
                    <a className="link" href={`tel:${r.phone}`}>
                      {String(r.phone)}
                    </a>
                  )}
                  {r.url && (
                    <a
                      className="link"
                      href={String(r.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      참고 링크
                    </a>
                  )}
                  {table === "shopping_items" && (
                    <p>
                      {r.purchased ? "구매 완료" : "구매 전"} ·{" "}
                      {ownerName(r.buyer)}
                    </p>
                  )}
                  <div className="row">
                    <button
                      disabled={!writable || busy}
                      onClick={() => edit(table, r)}
                    >
                      수정
                    </button>
                    <button
                      disabled={!writable || busy}
                      onClick={() => {
                        if (confirm("삭제할까요?"))
                          void mutate(table, r, {}, true).catch(() => {});
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ),
      )}
      {view === "archive" && (
        <>
          <h1>보관된 자료</h1>
          <p className="notice">
            과거 일정과 호텔의 자료를 보존합니다. 현재 숙소 예약으로 자동
            변경하지 않습니다.
          </p>
          {data.reservations
            .filter(
              (r) =>
                r.archived ||
                data.reservation_schedule_items.some(
                  (l) =>
                    l.reservation_id === r.id &&
                    data.schedule_items.some(
                      (s) => s.id === l.schedule_item_id && s.archived,
                    ),
                ),
            )
            .map((r) => (
              <section className="card" key={r.id}>
                <h2>{String(r.title)}</h2>
                <button onClick={() => setReservationId(r.id)}>
                  보관 예약자료 보기
                </button>
              </section>
            ))}
          {(["packing_items", "checklist_items"] as const).map((t) => (
            <section className="card" key={t}>
              <h2>보관 {labels[t]}</h2>
              {preparationRows(t, archivedPreparations(t), true)}
            </section>
          ))}
        </>
      )}
      {view === "info" && (
        <section className="card">
          <h1>여행정보</h1>
          <p>2026.12.22 — 12.27 · 2명 · Asia/Tokyo</p>
          <p>계획 버전 {String(data.trips[0]?.plan_version)}</p>
          <p>
            장소 검색 링크는 정확한 지점·여행일 영업 검증을 대신하지 않습니다.
            열차·셔틀 시간은 계획값이며 예약자료를 확인해주세요.
          </p>
        </section>
      )}
      {view === "settings" && (
        <section className="card">
          <h1>설정</h1>
          <p>
            {member?.display_name} · {words[String(member?.role)]}
          </p>
          <button
            onClick={async () => {
              const response = await fetch("/api/logout", { method: "POST" });
              if (response.ok) {
                sessionStorage.removeItem("senkyo-offline");
                router.replace("/login");
                router.refresh();
              } else setError("로그아웃하지 못했습니다");
            }}
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </section>
      )}
      <nav className="nav" aria-label="주요 메뉴">
        {tabs.map(({ view: target, label, Icon }) => (
          <button
            key={target}
            aria-current={view === target ? "page" : undefined}
            className={view === target ? "active" : ""}
            onClick={() => changeView(target)}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </nav>
      {daily && (
        <Sheet
          title={`${date} · 오늘의 준비 전체보기`}
          close={() => {
            setDaily(null);
            setEditor(null);
          }}
        >
          <DailyPreparation
            initial={daily}
            packing={packing}
            checklist={checklist}
            schedules={schedules}
            completed={completed}
            renderRows={preparationRows}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </Sheet>
      )}
      {!daily && detail && (
        <Sheet title={String(detail.title)} close={closeDetail}>
          {editor ? (
            <Editor
              inline
              {...editor}
              data={data}
              members={members}
              onSave={saveEditor}
              onClose={() => setEditor(null)}
            />
          ) : reservation ? (
            reservationPanel(reservation)
          ) : (
            detailPanel(detail)
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </Sheet>
      )}
      {!daily && !detail && reservation && (
        <Sheet
          title={String(reservation.title)}
          close={() => {
            setReservationId(null);
            setEditor(null);
          }}
        >
          {editor ? (
            <Editor
              inline
              {...editor}
              data={data}
              members={members}
              onSave={saveEditor}
              onClose={() => setEditor(null)}
            />
          ) : (
            reservationPanel(reservation)
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </Sheet>
      )}
      {!daily && !detail && !reservation && editor && (
        <Editor
          {...editor}
          data={data}
          members={members}
          onSave={saveEditor}
          onClose={() => setEditor(null)}
        />
      )}
    </main>
  );
}
function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState("");
  return (
    <div>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus("예약번호를 복사했습니다");
          } catch {
            setStatus("예약번호를 복사하지 못했습니다");
          }
        }}
      >
        예약번호 복사
      </button>
      <span role="status">{status}</span>
    </div>
  );
}
function DailyPreparation({
  initial,
  packing,
  checklist,
  schedules,
  completed,
  renderRows,
}: {
  initial: PreparationTable;
  packing: Row[];
  checklist: Row[];
  schedules: Row[];
  completed: (table: PreparationTable, row: Row) => boolean;
  renderRows: (table: PreparationTable, rows: Row[]) => React.ReactNode;
}) {
  const [table, setTable] = useState(initial);
  const [onlyPending, setOnlyPending] = useState(false);
  const [visible, setVisible] = useState<string[]>([]);
  const [order] = useState(() => [...packing, ...checklist].map((r) => r.id));
  const rows = [...(table === "packing_items" ? packing : checklist)].sort(
    (a, b) => {
      const aIndex = order.indexOf(a.id),
        bIndex = order.indexOf(b.id);
      return (
        (aIndex < 0 ? order.length : aIndex) -
        (bIndex < 0 ? order.length : bIndex)
      );
    },
  );
  const groups = [
    {
      id: "common",
      title: "공통·날짜별 준비",
      rows: rows.filter((r) => !r.schedule_item_id),
    },
    ...schedules.map((s) => ({
      id: s.id,
      title: `${String(s.time_label)} · ${String(s.title)}`,
      rows: rows.filter((r) => r.schedule_item_id === s.id),
    })),
  ];
  function changeFilter(pending: boolean, nextTable = table) {
    setOnlyPending(pending);
    setVisible(
      (nextTable === "packing_items" ? packing : checklist)
        .filter((r) => !completed(nextTable, r))
        .map((r) => r.id),
    );
  }
  return (
    <>
      <div className="row">
        <button
          aria-pressed={table === "packing_items"}
          onClick={() => {
            setTable("packing_items");
            changeFilter(onlyPending, "packing_items");
          }}
        >
          준비물
        </button>
        <button
          aria-pressed={table === "checklist_items"}
          onClick={() => {
            setTable("checklist_items");
            changeFilter(onlyPending, "checklist_items");
          }}
        >
          할 일
        </button>
      </div>
      <p>
        {rows.filter((r) => completed(table, r)).length}/{rows.length} 완료
      </p>
      <div className="row">
        <button aria-pressed={!onlyPending} onClick={() => changeFilter(false)}>
          전체
        </button>
        <button aria-pressed={onlyPending} onClick={() => changeFilter(true)}>
          미완료
        </button>
      </div>
      {groups
        .filter((g) => g.rows.length)
        .map((g) => (
          <section key={g.id}>
            <h3>{g.title}</h3>
            {renderRows(
              table,
              g.rows.filter((r) => !onlyPending || visible.includes(r.id)),
            )}
          </section>
        ))}
    </>
  );
}
