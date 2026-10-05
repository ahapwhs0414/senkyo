"use client";
import { useRef, useState } from "react";
import {
  type Data,
  type Row,
  type Table,
  type Member,
  linkedPlaceIds,
} from "@/lib/domain";
import { defaults } from "@/lib/forms";
import { googlePlaceSchema, type GooglePlace } from "@/lib/google";
import { Editor } from "./editor";
export function ScheduleConnections({
  item,
  data,
  members,
  writable,
  refresh,
  openReservation,
}: {
  item: Row;
  data: Data;
  members: Member[];
  writable: boolean;
  refresh: () => Promise<void>;
  openReservation: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GooglePlace[]>([]);
  const [placeId, setPlaceId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [editor, setEditor] = useState<"places" | "reservations" | null>(null);
  const saved = useRef<string | null>(null);
  const placeIds = linkedPlaceIds(data, [item.id]);
  const reservationIds = new Set(
    data.reservation_schedule_items
      .filter((l) => l.schedule_item_id === item.id)
      .map((l) => String(l.reservation_id)),
  );
  for (const t of data.transport_segments.filter(
    (t) => t.schedule_item_id === item.id && t.reservation_id,
  ))
    reservationIds.add(String(t.reservation_id));
  async function save(table: Table, values: Record<string, unknown>) {
    const r = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, values }),
    });
    const d: Row & { error?: string } = await r.json();
    if (!r.ok) throw Error(d.error);
    return d;
  }
  async function link(kind: "place" | "reservation", id: string) {
    if (
      (kind === "place" && placeIds.has(id)) ||
      (kind === "reservation" && reservationIds.has(id))
    )
      return;
    await save(
      kind === "place" ? "schedule_places" : "reservation_schedule_items",
      {
        schedule_item_id: item.id,
        [kind === "place" ? "place_id" : "reservation_id"]: id,
      },
    );
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "연결하지 못했습니다");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="stack">
      <h3>연결된 장소</h3>
      {data.places
        .filter((p) => placeIds.has(p.id))
        .map((p) => (
          <p key={p.id}>{String(p.custom_name)}</p>
        ))}
      {!placeIds.size && (
        <p className="muted">
          연결된 장소가 없습니다. 이 일정에서 바로 추가해보세요.
        </p>
      )}
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const r = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
            const d: { places?: unknown[]; error?: string } = await r.json();
            if (!r.ok) throw Error(d.error);
            setResults((d.places ?? []).map((p) => googlePlaceSchema.parse(p)));
            if (!d.places?.length)
              setError(
                "검색 결과가 없습니다. 지역이나 지점명을 함께 입력해주세요.",
              );
          });
        }}
      >
        <label>
          이 일정의 장소 검색
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            minLength={2}
            maxLength={200}
            disabled={!writable || busy}
          />
        </label>
        <button disabled={!writable || busy}>
          {busy ? "처리 중…" : "Google 장소 검색"}
        </button>
      </form>
      {results.map((p) => (
        <div className="card" key={p.id}>
          <strong>{p.displayName.text}</strong>
          <p>{p.formattedAddress}</p>
          <button
            disabled={!writable || busy}
            onClick={() =>
              void run(async () => {
                const existing = data.places.find(
                  (r) => r.google_place_id === p.id,
                );
                const place =
                  existing ??
                  (await save("places", {
                    custom_name: p.displayName.text,
                    google_place_id: p.id,
                    category: item.type === "MEAL" ? "RESTAURANT" : "OTHER",
                    memo: "",
                  }));
                await link("place", place.id);
                setResults([]);
              })
            }
          >
            이 일정에 장소 추가
          </button>
        </div>
      ))}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await link("place", placeId);
            setPlaceId("");
          });
        }}
      >
        <label>
          저장된 장소
          <select
            required
            value={placeId}
            disabled={!writable || busy}
            onChange={(e) => setPlaceId(e.target.value)}
          >
            <option value="">장소 선택</option>
            {data.places
              .filter((p) => !placeIds.has(p.id))
              .map((p) => (
                <option value={p.id} key={p.id}>
                  {String(p.custom_name)}
                </option>
              ))}
          </select>
        </label>
        <button disabled={!writable || busy}>장소 연결</button>
      </form>
      <button
        disabled={!writable || busy}
        onClick={() => {
          saved.current = null;
          setEditor("places");
        }}
      >
        새 장소 직접 추가
      </button>
      <h3>연결된 예약</h3>
      {data.reservations
        .filter((r) => reservationIds.has(r.id))
        .map((r) => (
          <button key={r.id} onClick={() => openReservation(r.id)}>
            {String(r.title)}
          </button>
        ))}
      {!reservationIds.size && (
        <p className="muted">
          연결된 예약이 없습니다. 이 일정에서 바로 추가해보세요.
        </p>
      )}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await link("reservation", reservationId);
            setReservationId("");
          });
        }}
      >
        <label>
          저장된 예약
          <select
            required
            value={reservationId}
            disabled={!writable || busy}
            onChange={(e) => setReservationId(e.target.value)}
          >
            <option value="">예약 선택</option>
            {data.reservations
              .filter((r) => !reservationIds.has(r.id))
              .map((r) => (
                <option value={r.id} key={r.id}>
                  {String(r.title)}
                </option>
              ))}
          </select>
        </label>
        <button disabled={!writable || busy}>예약 연결</button>
      </form>
      <button
        disabled={!writable || busy}
        onClick={() => {
          saved.current = null;
          setEditor("reservations");
        }}
      >
        새 예약 추가
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {editor && (
        <Editor
          table={editor}
          row={defaults(editor, String(item.date))}
          data={data}
          members={members}
          onClose={() => setEditor(null)}
          onSave={async (values) => {
            setBusy(true);
            try {
              const id = saved.current ?? (await save(editor, values)).id;
              saved.current = id;
              await link(editor === "places" ? "place" : "reservation", id);
              await refresh();
              saved.current = null;
            } catch (e) {
              await refresh();
              throw e;
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </section>
  );
}
