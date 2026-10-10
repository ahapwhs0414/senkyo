"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Data } from "@/lib/domain";
import { placeMapUrl, linkedPlaceIds } from "@/lib/domain";
import { googlePlaceSchema, type GooglePlace } from "@/lib/google";
import { words } from "@/lib/forms";
interface MapInstance {
  fitBounds(bounds: Bounds): void;
  panTo(position: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
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
    label: string;
  }) => Marker;
  LatLngBounds: new () => Bounds;
}
declare global {
  interface Window {
    google?: { maps: GoogleMaps };
    gm_authFailure?: () => void;
  }
}
let loader: Promise<void> | null = null;
function loadMaps(key: string) {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (!loader)
    loader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      let settled = false;
      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener("senkyo-maps-auth-error", authFailure);
      };
      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        cleanup();
        loader = null;
        script.remove();
        reject(new Error(message));
      };
      const authFailure = () =>
        fail(
          "Google 지도 인증에 실패했습니다. 브라우저 키의 API·도메인·결제 설정을 확인해주세요. 외부 지도 링크는 계속 사용할 수 있습니다.",
        );
      const timeout = setTimeout(
        () =>
          fail(
            "지도 로딩 시간이 초과되었습니다. 아래 지도 링크를 이용하거나 재시도해주세요.",
          ),
        10000,
      );
      window.gm_authFailure = () =>
        window.dispatchEvent(new Event("senkyo-maps-auth-error"));
      window.addEventListener("senkyo-maps-auth-error", authFailure);
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=ko`;
      script.onload = () => {
        if (!window.google?.maps?.Map) {
          fail("지도 스크립트를 초기화하지 못했습니다");
          return;
        }
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      script.onerror = () =>
        fail("지도를 불러오지 못했습니다. 아래 외부 지도 링크를 이용해주세요");
      document.head.append(script);
    });
  return loader;
}
export function TravelMap({ data, date }: { data: Data; date: string }) {
  const mapRef = useRef<MapInstance | null>(null);
  const cache = useRef(new Map<string, GooglePlace>());
  const container = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const [allDates, setAllDates] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<
    { planId: string; place: GooglePlace }[]
  >([]);
  const selectedSchedules = data.schedule_items
    .filter((s) => !s.archived && (allDates || s.date === date))
    .sort(
      (a, b) =>
        String(a.date).localeCompare(String(b.date)) ||
        Number(a.sort_order) - Number(b.sort_order),
    );
  const orderedIds = [
    ...new Set(
      selectedSchedules.flatMap((s) => [
        ...linkedPlaceIds(
          {
            ...data,
            schedule_places: [...(data.schedule_places ?? [])].sort(
              (a, b) => Number(a.sort_order) - Number(b.sort_order),
            ),
          },
          [s.id],
        ),
      ]),
    ),
  ];
  const places = data.places
    .filter(
      (p) =>
        !p.archived &&
        orderedIds.includes(p.id) &&
        (filter === "all" || p.category === filter),
    )
    .sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
  const ids = places.map((p) => p.id).join(",");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const markers: Marker[] = [];
    const authFailure = () => {
      loader = null;
      setError(
        "Google 지도 인증 실패 · API 활성화, 허용 도메인과 결제 설정을 확인해주세요. 아래 지도 링크는 계속 사용할 수 있습니다.",
      );
    };
    window.addEventListener("senkyo-maps-auth-error", authFailure);
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key)
      return () =>
        window.removeEventListener("senkyo-maps-auth-error", authFailure);
    async function run() {
      setLoading(true);
      setSelected(null);
      setDetails([]);
      setError("");
      try {
        await loadMaps(key!);
        // Four workers limit requests when viewing the whole trip. Successful
        // lookups live only in this mounted map; they are never persisted.
        const pending = ids.split(",").filter(Boolean);
        const fetched: PromiseSettledResult<{
          planId: string;
          place: GooglePlace;
        }>[] = [];
        let cursor = 0;
        await Promise.all(
          Array.from({ length: Math.min(4, pending.length) }, async () => {
            while (active && cursor < pending.length) {
              const id = pending[cursor++];
              try {
                let place = cache.current.get(id);
                if (!place) {
                  const response = await fetch(
                    `/api/places?place=${encodeURIComponent(id)}`,
                    { cache: "no-store", signal: controller.signal },
                  );
                  const body = await response.json();
                  if (!response.ok)
                    throw new Error(
                      body.error ?? "장소 위치를 불러오지 못했습니다",
                    );
                  place = googlePlaceSchema.parse(body);
                  cache.current.set(id, place);
                }
                fetched.push({
                  status: "fulfilled",
                  value: { planId: id, place },
                });
              } catch (reason) {
                fetched.push({ status: "rejected", reason });
              }
            }
          }),
        );
        const results = fetched.flatMap((r) =>
          r.status === "fulfilled" ? [r.value] : [],
        );
        const failed = fetched.find((r) => r.status === "rejected");
        if (!active || !container.current || !window.google?.maps) return;
        setDetails(results);
        const api = window.google.maps;
        const map = new api.Map(container.current, {
          center: { lat: 35.6812, lng: 139.7671 },
          zoom: 9,
        });
        mapRef.current = map;
        const bounds = new api.LatLngBounds();
        for (const { place: p, planId } of results) {
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
            label: String(pending.indexOf(planId) + 1),
          });
          marker.addListener("click", () => setSelected(planId));
          markers.push(marker);
        }
        if (markers.length) map.fitBounds(bounds);
        if (markers.length === 1) map.setZoom(15);
        if (failed?.status === "rejected")
          setError(
            failed.reason instanceof Error
              ? failed.reason.message
              : "일부 장소 정보를 불러오지 못했습니다. 표시된 장소는 계속 확인할 수 있습니다.",
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
      controller.abort();
      window.removeEventListener("senkyo-maps-auth-error", authFailure);
      markers.forEach((m) => m.setMap(null));
    };
  }, [ids, retry]);
  const selectedDetail = details.find((d) => d.planId === selected)?.place;
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
        <button aria-pressed={allDates} onClick={() => setAllDates((v) => !v)}>
          {allDates ? "선택한 날짜만 보기" : "6일 전체 장소 보기"}
        </button>
      </div>
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="notice">
          지도 API 키가 아직 설정되지 않았습니다. 아래 장소 목록과 Google Maps
          링크를 이용할 수 있습니다.
        </p>
      )}
      <p className="muted">
        일정 순서대로 {places.length}곳 · 숫자가 같은 지도 핀과 장소를 함께
        확인하세요.
      </p>
      {!loading && details.length > 0 && (
        <p role="status" className="notice">
          위치 {details.length}/{places.length}곳 표시 · Google 검색 결과입니다.
          방문 전 지점명과 주소를 확인해주세요.
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
          <p>{selectedDetail.formattedAddress}</p>
        </div>
      )}
      {!places.length && (
        <p className="empty">
          이 필터에 연결된 장소가 없습니다. 다른 날짜나 필터를 선택해보세요.
        </p>
      )}
      {places.map((p, index) => (
        <div
          className={`card map-place ${selected === p.id ? "is-selected" : ""}`}
          key={p.id}
        >
          <h3>
            <span className="map-number">{index + 1}</span>{" "}
            {String(p.custom_name)}
          </h3>
          {details.some((d) => d.planId === p.id) && (
            <button
              aria-pressed={selected === p.id}
              onClick={() => {
                setSelected(p.id);
                const position = details.find((d) => d.planId === p.id)?.place
                  .location;
                if (position) {
                  mapRef.current?.panTo({
                    lat: position.latitude,
                    lng: position.longitude,
                  });
                  mapRef.current?.setZoom(15);
                }
                container.current?.scrollIntoView({
                  behavior: "instant",
                  block: "center",
                });
              }}
            >
              지도에서 위치 보기
            </button>
          )}
          <p>{String(p.memo)}</p>
          <a
            className="link"
            href={placeMapUrl(p)}
            target="_blank"
            rel="noopener noreferrer"
          >
            지도 보기 ↗
          </a>
        </div>
      ))}
    </>
  );
}
