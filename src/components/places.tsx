"use client";
/* Google detail responses live only in component memory; user-owned annotations remain in the DB. */
import Image from "next/image";
import { useState } from "react";
import { type Data, type Table, type Row, mapsUrl } from "@/lib/domain";
import { type GooglePlace, googlePlaceSchema } from "@/lib/google";
import { defaults, words } from "@/lib/forms";
export function Places({
  data,
  writable,
  edit,
  mutate,
  refresh,
}: {
  data: Data;
  writable: boolean;
  edit: (table: Table, row?: Row) => void;
  mutate: (
    table: Table,
    row: Row,
    values: Record<string, unknown>,
    remove?: boolean,
  ) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GooglePlace[]>([]);
  const [detail, setDetail] = useState<GooglePlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Row | null>(null);
  const [onlyCandidates, setOnlyCandidates] = useState(false);
  async function search() {
    setBusy(true);
    setError("");
    setResults([]);
    try {
      const response = await fetch(
        `/api/places?q=${encodeURIComponent(query)}`,
      );
      const result: { places?: unknown[]; error?: string } =
        await response.json();
      if (!response.ok) throw new Error(result.error);
      setResults((result.places ?? []).map((p) => googlePlaceSchema.parse(p)));
      if (!result.places?.length)
        setError("검색 결과가 없습니다. 지역이나 지점명을 함께 입력해보세요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setBusy(false);
    }
  }
  async function open(place: Row) {
    setSelected(place);
    setDetail(null);
    setError("");
    if (!place.google_place_id) {
      setError(
        "Google 장소가 아직 연결되지 않았습니다. 검색에서 정확한 지점을 선택해주세요.",
      );
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        `/api/places?id=${encodeURIComponent(String(place.google_place_id))}`,
      );
      const result: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          (typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Google 장소 정보를 불러오지 못했습니다.") +
            " 저장된 이름과 메모는 계속 확인할 수 있습니다.",
        );
      setDetail(googlePlaceSchema.parse(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="row between">
        <h1>가고 싶은 곳</h1>
        <button disabled={!writable || busy} onClick={() => edit("places")}>
          장소 직접 등록
        </button>
      </div>
      <section className="card">
        <span className="eyebrow">Find on Google</span>
        <h2>정확한 지점을 찾아 저장해요</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <label style={{ flex: 1, minWidth: 150 }}>
            장소 또는 식당 검색
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
              minLength={2}
              maxLength={200}
              placeholder="예: 센다이 우마미 타스케"
            />
          </label>
          <button className="primary" disabled={busy}>
            {busy ? "검색 중…" : "검색"}
          </button>
        </form>
        <small className="muted">
          식당 후보는 직접 선택합니다. Google Maps 제공
        </small>
        {results.map((p) => (
          <div className="card" key={p.id} style={{ marginTop: 14 }}>
            <h3>{p.displayName.text}</h3>
            <p>{p.formattedAddress}</p>
            <button
              disabled={!writable || busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const response = await fetch("/api/data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      table: "places",
                      id: selected?.id,
                      updated_at: selected?.updated_at,
                      values: {
                        google_place_id: p.id,
                        custom_name:
                          selected?.custom_name ?? p.displayName.text,
                        category: selected?.category ?? "RESTAURANT",
                        memo: selected?.memo ?? "",
                      },
                    }),
                  });
                  const result: Row & { error?: string } =
                    await response.json();
                  if (!response.ok) throw new Error(result.error);
                  if (!selected)
                    await mutate(
                      "meal_candidates",
                      defaults("meal_candidates", "2026-12-22"),
                      {
                        place_id: result.id,
                        meal_schedule_id: null,
                        memo: "",
                        priority: 0,
                        tags: "",
                        favorite: false,
                        visited: false,
                      },
                    );
                  await refresh();
                  setResults([]);
                  setSelected(null);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "추가 실패");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {selected
                ? "선택한 장소에 Google 지점 연결"
                : "후보 식당으로 저장"}
            </button>
          </div>
        ))}
      </section>
      {error && (
        <p role="alert" className="error">
          {error}{" "}
          <button
            disabled={busy}
            onClick={() => {
              if (selected) void open(selected);
              else void search();
            }}
          >
            재시도
          </button>
        </p>
      )}
      {selected && (
        <section className="card">
          <div className="row between">
            <h2>{String(selected.custom_name)}</h2>
            <button
              onClick={() => {
                setSelected(null);
                setDetail(null);
                setError("");
              }}
            >
              상세 닫기
            </button>
          </div>
          <p>{String(selected.memo)}</p>
          {busy && <p role="status">Google 장소 정보 로딩 중…</p>}
          {detail && (
            <>
              <p>{detail.formattedAddress}</p>
              <p>
                평점 {detail.rating ?? "정보 없음"} · 리뷰{" "}
                {detail.userRatingCount ?? "정보 없음"} · 가격 수준{" "}
                {(
                  {
                    PRICE_LEVEL_FREE: "무료",
                    PRICE_LEVEL_INEXPENSIVE: "저렴",
                    PRICE_LEVEL_MODERATE: "보통",
                    PRICE_LEVEL_EXPENSIVE: "비쌈",
                    PRICE_LEVEL_VERY_EXPENSIVE: "매우 비쌈",
                  } as Record<string, string>
                )[detail.priceLevel ?? ""] ?? "정보 없음"}
              </p>
              {detail.priceRange && (
                <p>
                  가격 범위 {detail.priceRange.startPrice?.units ?? "?"}–
                  {detail.priceRange.endPrice?.units ?? "?"}{" "}
                  {detail.priceRange.startPrice?.currencyCode ?? ""}
                </p>
              )}
              <p>
                {detail.regularOpeningHours?.weekdayDescriptions?.join(" · ") ??
                  "영업시간 정보 없음"}
              </p>
              <p>{detail.nationalPhoneNumber ?? "전화번호 정보 없음"}</p>
              {detail.websiteUri && (
                <a
                  className="link"
                  href={detail.websiteUri}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  공식 홈페이지 ↗
                </a>
              )}
              {detail.photos?.slice(0, 1).map((photo) => (
                <div key={photo.name}>
                  <Image
                    unoptimized
                    width={600}
                    height={400}
                    src={`/api/places/photo?name=${encodeURIComponent(photo.name)}`}
                    alt={`${detail.displayName.text} 장소 사진`}
                    style={{ width: "100%", height: "auto", borderRadius: 12 }}
                  />
                  {photo.authorAttributions?.map((a, i) => (
                    <a
                      className="link"
                      key={i}
                      href={a.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      사진: {a.displayName ?? "Google Maps"}
                    </a>
                  ))}
                </div>
              ))}
            </>
          )}
          <a
            className="link"
            href={mapsUrl(
              String(selected.custom_name),
              undefined,
              "transit",
              String(selected.google_place_id ?? "") || undefined,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps ↗
          </a>
          <p className="muted">
            메뉴 전체나 개별 메뉴 가격은 제공되지 않을 수 있습니다.
          </p>
          <button
            disabled={!writable || busy}
            onClick={() => edit("places", selected)}
          >
            메모 / 장소 수정
          </button>
        </section>
      )}
      <div className="row">
        <button
          className={!onlyCandidates ? "selected" : ""}
          onClick={() => setOnlyCandidates(false)}
        >
          전체 장소
        </button>
        <button
          className={onlyCandidates ? "selected" : ""}
          onClick={() => setOnlyCandidates(true)}
        >
          후보 식당
        </button>
        <label>
          카테고리
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체</option>
            {[...new Set(data.places.map((p) => String(p.category)))].map(
              (c) => (
                <option key={c} value={c}>
                  {words[c] ?? c}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      {onlyCandidates && !data.meal_candidates.length && (
        <p className="card empty">
          아직 저장한 후보 식당이 없습니다. Google 검색에서 후보를 추가해보세요.
        </p>
      )}
      <div className="grid" style={{ marginTop: 16 }}>
        {data.places
          .filter(
            (p) =>
              (filter === "all" || p.category === filter) &&
              (!onlyCandidates ||
                data.meal_candidates.some((c) => c.place_id === p.id)),
          )
          .map((p) => {
            const candidates = data.meal_candidates.filter(
              (c) => c.place_id === p.id,
            );
            return (
              <article className="card" key={p.id}>
                <span className="pill">{words[String(p.category)]}</span>
                <h3 style={{ marginTop: 12 }}>{String(p.custom_name)}</h3>
                <p className="muted">{String(p.memo)}</p>
                <div className="row">
                  <button disabled={busy} onClick={() => void open(p)}>
                    장소 상세
                  </button>
                  <button
                    disabled={!writable || busy}
                    onClick={() =>
                      edit("schedule_places", {
                        ...defaults("schedule_places", "2026-12-22"),
                        place_id: p.id,
                      })
                    }
                  >
                    장소 일정 연결
                  </button>
                </div>
                {candidates.map((c) => (
                  <div key={c.id}>
                    <p>
                      {c.favorite ? "♥ " : ""}
                      {c.visited ? "✓ 실제 방문 · " : ""}우선순위 {c.priority} ·{" "}
                      {String(c.tags)}
                      <br />
                      {String(c.memo)}
                      <br />
                      {String(
                        data.schedule_items.find(
                          (s) => s.id === c.meal_schedule_id,
                        )?.title ?? "식사 일정 미연결",
                      )}
                    </p>
                    <div className="row">
                      <button
                        disabled={!writable || busy}
                        onClick={() => edit("meal_candidates", c)}
                      >
                        후보 수정 / 방문 선택
                      </button>
                      <button
                        disabled={!writable || busy}
                        onClick={() => {
                          if (
                            confirm(
                              "후보 연결을 제거할까요? 장소는 보존됩니다.",
                            )
                          )
                            void mutate("meal_candidates", c, {}, true).catch(
                              (e) =>
                                setError(
                                  e instanceof Error ? e.message : "제거 실패",
                                ),
                            );
                        }}
                      >
                        후보 제거
                      </button>
                    </div>
                  </div>
                ))}
              </article>
            );
          })}
      </div>
    </>
  );
}
