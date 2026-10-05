"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Data } from "@/lib/domain";
import { mapsUrl } from "@/lib/domain";
import { googlePlaceSchema, type GooglePlace } from "@/lib/google";
import { words } from "@/lib/forms";
interface MapInstance {
  fitBounds(bounds: Bounds): void;
}
interface Bounds {
  extend(position: { lat: number; lng: number }): void;
}
interface Marker {
  setMap(map: MapInstance | null): void;
  addListener(name: string, callback: () => void): void;
}
interface GoogleMaps {
  Map: new (
    el: HTMLElement,
    options: { center: { lat: number; lng: number }; zoom: number },
  ) => MapInstance;
  Marker: new (options: {
    position: { lat: number; lng: number };
    map: MapInstance;
    title: string;
  }) => Marker;
  LatLngBounds: new () => Bounds;
}
declare global {
  interface Window {
    google?: { maps: GoogleMaps };
  }
}
let loader: Promise<void> | null = null;
function loadMaps(key: string) {
  if (window.google?.maps) return Promise.resolve();
  if (!loader)
    loader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=ko`;
      script.onload = () => resolve();
      script.onerror = () => {
        loader = null;
        script.remove();
        reject(new Error("지도를 불러오지 못했습니다"));
      };
      document.head.append(script);
    });
  return loader;
}
export function TravelMap({ data, date }: { data: Data; date: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const [allDates, setAllDates] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<GooglePlace[]>([]);
  const dayIds = new Set(
    data.schedule_items.filter((s) => s.date === date).map((s) => s.place_id),
  );
  for (const candidate of data.meal_candidates)
    if (
      data.schedule_items.some(
        (s) => s.id === candidate.meal_schedule_id && s.date === date,
      )
    )
      dayIds.add(candidate.place_id);
  const places = data.places.filter(
    (p) =>
      (allDates || dayIds.has(p.id)) &&
      (filter === "all" || p.category === filter),
  );
  const ids = places
    .map((p) => p.google_place_id)
    .filter(Boolean)
    .join(",");
  useEffect(() => {
    let active = true;
    const markers: Marker[] = [];
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;
    async function run() {
      setLoading(true);
      setError("");
      try {
        await loadMaps(key!);
        const results = await Promise.all(
          ids
            .split(",")
            .filter(Boolean)
            .map(async (id) => {
              const response = await fetch(
                `/api/places?id=${encodeURIComponent(id)}`,
                { cache: "no-store" },
              );
              if (!response.ok)
                throw new Error(
                  "일부 장소 좌표를 불러오지 못했습니다. 장소 목록을 이용해주세요",
                );
              return googlePlaceSchema.parse(await response.json());
            }),
        );
        if (!active || !container.current || !window.google?.maps) return;
        setDetails(results);
        const api = window.google.maps;
        const map = new api.Map(container.current, {
          center: { lat: 35.6812, lng: 139.7671 },
          zoom: 9,
        });
        const bounds = new api.LatLngBounds();
        for (const p of results) {
          if (!p.location) continue;
          const position = {
            lat: p.location.latitude,
            lng: p.location.longitude,
          };
          bounds.extend(position);
          const marker = new api.Marker({
            position,
            map,
            title: p.displayName.text,
          });
          marker.addListener("click", () => setSelected(p.id));
          markers.push(marker);
        }
        if (markers.length) map.fitBounds(bounds);
        else
          setError(
            "Google 장소가 연결된 위치가 없습니다. 장소 목록에서 정확한 지점을 연결해보세요.",
          );
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "지도 로드 실패");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
      markers.forEach((m) => m.setMap(null));
    };
  }, [ids, retry]);
  const selectedDetail = details.find((d) => d.id === selected);
  return (
    <>
      <h1>여행 지도</h1>
      <div className="row">
        <label>
          카테고리
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">전체</option>
            {[
              "HOTEL",
              "RESTAURANT",
              "ATTRACTION",
              "SHOPPING",
              "STATION",
              "AIRPORT",
            ].map((c) => (
              <option key={c} value={c}>
                {words[c]}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setAllDates((v) => !v)}>
          {allDates ? "전체 여행 · 날짜별로 보기" : "선택한 날짜 · 전체 보기"}
        </button>
      </div>
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="notice">
          지도 API 키가 아직 설정되지 않았습니다. 아래 장소 목록과 Google Maps
          링크를 이용할 수 있습니다.
        </p>
      )}
      {loading && <p role="status">지도와 장소 위치를 불러오는 중…</p>}
      {error && (
        <p role="alert" className="error">
          {error} <button onClick={() => setRetry((r) => r + 1)}>재시도</button>
        </p>
      )}
      <div
        ref={container}
        className="map"
        role="region"
        aria-label="저장한 장소 지도"
        hidden={!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      />
      {selectedDetail && (
        <div className="card">
          <h2>{selectedDetail.displayName.text}</h2>
          {selectedDetail.photos?.slice(0, 1).map((photo) => (
            <div key={photo.name}>
              <Image
                unoptimized
                width={600}
                height={400}
                src={`/api/places/photo?name=${encodeURIComponent(photo.name)}`}
                alt={`${selectedDetail.displayName.text} 장소 사진`}
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
          <p>
            {selectedDetail.regularOpeningHours?.weekdayDescriptions?.join(
              " · ",
            ) ?? "영업시간 정보 없음"}
          </p>

          <p>
            {selectedDetail.formattedAddress} · 평점{" "}
            {selectedDetail.rating ?? "없음"}
          </p>
        </div>
      )}
      {!places.length && (
        <p className="empty">
          이 필터에 연결된 장소가 없습니다. 장소를 등록하거나 다른 필터를
          선택해보세요.
        </p>
      )}
      {places.map((p) => (
        <div className="card" key={p.id}>
          <h3>{String(p.custom_name)}</h3>
          <p>{String(p.memo)}</p>
          <p className="muted">
            연결 일정:{" "}
            {data.schedule_items
              .filter(
                (s) =>
                  s.place_id === p.id ||
                  data.meal_candidates.some(
                    (c) => c.place_id === p.id && c.meal_schedule_id === s.id,
                  ),
              )
              .map((s) => `${s.date} ${s.title}`)
              .join(" · ") || "연결 안 됨"}
          </p>

          <p>
            {details.find((d) => d.id === p.google_place_id)
              ?.formattedAddress ?? "주소는 Google 장소 연결 후 조회합니다"}
          </p>
          <a
            className="link"
            href={mapsUrl(
              String(p.custom_name),
              undefined,
              "transit",
              String(p.google_place_id ?? "") || undefined,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps ↗
          </a>
        </div>
      ))}
    </>
  );
}
