import { googlePlaceSchema, googleErrorInfo } from "./google";

export function planSearchQuery(mapsUrl: string): string {
  const url = new URL(mapsUrl);
  if (
    url.protocol !== "https:" ||
    !["google.com", "www.google.com"].includes(url.hostname) ||
    !url.pathname.startsWith("/maps/")
  )
    throw new Error("계획서의 지도 검색 링크를 확인해주세요");
  const query = url.searchParams.get("query")?.trim();
  if (!query || query.length > 300)
    throw new Error(
      "이 장소에는 검색어가 없습니다. 외부 지도 링크를 이용해주세요",
    );
  return query;
}

export async function lookupPlanPlace(
  key: string,
  place: { google_place_id?: string | null; maps_url?: string | null },
) {
  const id = place.google_place_id;
  if (id && !/^[\w-]{1,200}$/.test(id))
    throw new Error("장소 ID를 확인해주세요");
  const fields = "id,displayName,formattedAddress,location,googleMapsUri";
  const response = await fetch(
    id
      ? `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=ko`
      : "https://places.googleapis.com/v1/places:searchText",
    {
      method: id ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": id
          ? fields
          : fields
              .split(",")
              .map((f) => `places.${f}`)
              .join(","),
      },
      ...(id
        ? {}
        : {
            body: JSON.stringify({
              textQuery: planSearchQuery(place.maps_url ?? ""),
              languageCode: "ko",
              pageSize: 1,
            }),
          }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(googleErrorInfo(body, response.status).message);
  const result = googlePlaceSchema.safeParse(id ? body : body?.places?.[0]);
  if (!result.success || !result.data.location)
    throw new Error(
      "이 장소의 위치를 찾지 못했습니다. 외부 지도 링크를 이용해주세요",
    );
  return result.data;
}
