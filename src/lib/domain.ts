import { z } from "zod";
export const TRIP_ID = "20261222-2026-4222-8222-202612270002";
export const TIMEZONE = "Asia/Tokyo";
export const ownerOptions = ["SHARED", "USER_A", "USER_B"];
const text = z.string().trim().max(2000);
const required = text.min(1, "필수 항목입니다");
const optional = text.nullable().optional();
const uuid = z.uuid().nullable().optional();
const date = z.iso.date().nullable().optional();
const yen = z.number().int().min(0).max(100000000).nullable().optional();
const url = z
  .union([
    z.literal(""),
    z
      .url()
      .refine(
        (v) => ["http:", "https:"].includes(new URL(v).protocol),
        "http 또는 https URL을 입력하세요",
      ),
  ])
  .nullable()
  .optional();
const owner = z.enum(["USER_A", "USER_B", "SHARED"]);
const scope = { date, schedule_item_id: uuid };
export const schemas = {
  packing_items: z.object({
    ...scope,
    label: required,
    category: text,
    owner,
    checked: z.boolean(),
    required: z.boolean(),
    note: text,
    sort_order: z.number().int().min(0),
    repeat_daily: z.boolean().default(false),
  }),
  packing_checks: z.object({
    packing_item_id: z.uuid(),
    date: z.iso.date(),
    owner,
    checked: z.boolean(),
  }),
  checklist_items: z.object({
    ...scope,
    title: required,
    scope: z.enum(["PRE_TRIP", "TRIP", "DATE", "SCHEDULE"]).default("TRIP"),
    description: text,
    owner,
    status: z.enum(["TODO", "DONE"]),
    due_at: z.iso.datetime({ offset: true }).nullable().optional(),
    priority: z.number().int().min(0).max(10),
  }),
  reservations: z
    .object({
      type: z.enum([
        "FLIGHT",
        "HOTEL",
        "TRAIN",
        "BUS",
        "SHUTTLE",
        "ATTRACTION",
        "RESTAURANT",
        "INSURANCE",
        "OTHER",
      ]),
      title: required,
      material_only: z.boolean().default(false),
      provider: optional,
      reservation_number: optional,
      booker_name: optional,
      start_at: z.iso.datetime({ offset: true }).nullable().optional(),
      end_at: z.iso.datetime({ offset: true }).nullable().optional(),
      website_url: url,
      booking_url: url,
      confirmation_url: url,
      contact_phone: optional,
      contact_email: z
        .union([z.literal(""), z.email()])
        .nullable()
        .optional(),
      status: z.enum(["PLANNED", "BOOKED", "CONFIRMED", "USED", "CANCELLED"]),
      seat_number: optional,
      carriage_number: optional,
      flight_number: optional,
      room_info: optional,
      ticket_method: optional,
      qr_note: optional,
      insurance_number: optional,
      note: text,
    })
    .refine(
      (v) =>
        !v.start_at || !v.end_at || new Date(v.end_at) >= new Date(v.start_at),
      { message: "종료시간은 시작시간 이후여야 합니다", path: ["end_at"] },
    ),
  reservation_schedule_items: z.object({
    reservation_id: z.uuid(),
    schedule_item_id: z.uuid(),
  }),
  shopping_items: z.object({
    name: required,
    category: text,
    target_place_id: uuid,
    planned_budget_yen: yen,
    actual_cost_yen: yen,
    buyer: owner,
    purchased: z.boolean(),
    note: text,
  }),
  emergency_contacts: z.object({
    category: required,
    title: required,
    phone: optional,
    url,
    note: text,
  }),
  notes: z.object({ ...scope, title: required, body: text }),
} as const;
export type Table = keyof typeof schemas;
export type Cell = string | number | boolean | null;
export type Row = {
  id: string;
  trip_id?: string;
  updated_at?: string;
  [field: string]: Cell | undefined;
};
export type Data = Record<string, Row[]>;
export type Member = {
  user_id: string;
  slot: "USER_A" | "USER_B";
  role: "OWNER" | "EDITOR" | "VIEWER";
  display_name: string;
};
export function tokyoDate(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function tokyoTime(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}
export function yenLabel(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}
export function mapsUrl(
  destination: string,
  origin?: string,
  mode = "transit",
  placeId?: string,
) {
  const params = new URLSearchParams({
    api: "1",
    destination,
    travelmode: mode,
  });
  if (origin) params.set("origin", origin);
  if (placeId) params.set("destination_place_id", placeId);
  return `https://www.google.com/maps/dir/?${params}`;
}
export function inScope(
  row: Row,
  date: string,
  schedules: Row[],
  links: Row[] = [],
) {
  if (row.archived || row.scope === "PRE_TRIP") return false;
  if (row.schedule_item_id)
    return schedules.some(
      (s) => !s.archived && s.id === row.schedule_item_id && s.date === date,
    );
  const connected = links.filter((l) => l.packing_item_id === row.id);
  if (connected.length && !row.repeat_daily)
    return connected.some((l) =>
      schedules.some(
        (s) => !s.archived && s.id === l.schedule_item_id && s.date === date,
      ),
    );
  return row.date == null || row.date === date;
}
export function packingChecked(row: Row, date: string, checks: Row[]) {
  return row.repeat_daily
    ? Boolean(
        checks.find(
          (c) =>
            c.packing_item_id === row.id &&
            c.date === date &&
            c.owner === row.owner,
        )?.checked,
      )
    : Boolean(row.checked);
}
export function placeMapUrl(place: Row) {
  if (
    typeof place.maps_url === "string" &&
    /^https:\/\/(www\.)?google\.com\/maps\//.test(place.maps_url)
  )
    return place.maps_url;
  const p = new URLSearchParams({ api: "1", query: String(place.custom_name) });
  if (place.google_place_id)
    p.set("query_place_id", String(place.google_place_id));
  return `https://www.google.com/maps/search/?${p}`;
}
export const readTables = [
  "trips",
  "trip_days",
  "trip_members",
  "profiles",
  "places",
  "schedule_items",
  "schedule_places",
  "transport_segments",
  "packing_schedule_items",
  "reservation_attachments",
  ...Object.keys(schemas),
];
export function currentSchedule(items: Row[], date: string, now = new Date()) {
  items = items.filter((s) => !s.archived && s.start_time);
  if (date !== tokyoDate(now))
    return { current: null, next: items[0] ?? null, minutes: null };
  const time = tokyoTime(now);
  const pending = items.filter(
    (s) => !["skipped", "completed"].includes(String(s.status)),
  );
  const current =
    [...pending]
      .reverse()
      .find(
        (s) =>
          s.start_time &&
          String(s.start_time).slice(0, 5) <= time &&
          (!s.end_time || String(s.end_time).slice(0, 5) > time),
      ) ?? null;
  const next =
    pending.find(
      (s) => s.start_time && String(s.start_time).slice(0, 5) > time,
    ) ?? null;
  const minutes = next
    ? Number(String(next.start_time).slice(0, 2)) * 60 +
      Number(String(next.start_time).slice(3, 5)) -
      Number(time.slice(0, 2)) * 60 -
      Number(time.slice(3))
    : null;
  return { current, next, minutes };
}
export function validFile(bytes: Uint8Array, mime: string) {
  if (bytes.length === 0 || bytes.length > 10485760) return false;
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  return mime === "application/pdf"
    ? ascii(0, 5) === "%PDF-"
    : mime === "image/png"
      ? bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
      : mime === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : mime === "image/webp"
          ? ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP"
          : false;
}

export function linkedPlaceIds(data: Data, scheduleIds: string[]): Set<string> {
  const schedules = new Set(scheduleIds);
  const ids = new Set<string>();
  for (const s of data.schedule_items ?? [])
    if (schedules.has(s.id) && s.place_id) ids.add(String(s.place_id));
  for (const l of data.schedule_places ?? [])
    if (!l.archived && schedules.has(String(l.schedule_item_id)))
      ids.add(String(l.place_id));
  for (const t of data.transport_segments ?? [])
    if (!t.archived && schedules.has(String(t.schedule_item_id))) {
      if (t.origin_place_id) ids.add(String(t.origin_place_id));
      if (t.destination_place_id) ids.add(String(t.destination_place_id));
    }
  return ids;
}
