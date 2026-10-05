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
  schedule_items: z.object({
    date: z.iso.date(),
    title: required,
    type: z.enum([
      "FLIGHT",
      "TRAIN",
      "TRANSIT",
      "HOTEL",
      "ATTRACTION",
      "MEAL",
      "SHOPPING",
      "WALK",
      "FREE_TIME",
      "OTHER",
    ]),
    time_label: text,
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
      .nullable()
      .optional(),
    end_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
      .nullable()
      .optional(),
    place_id: uuid,
    description: text,
    status: z.enum(["planned", "confirmed", "completed", "skipped"]),
    sort_order: z.number().int().min(0),
    is_fixed: z.boolean(),
    estimated_cost_yen: yen,
    note: text,
  }),
  transport_segments: z
    .object({
      date: z.iso.date(),
      schedule_item_id: uuid,
      origin_name: required,
      destination_name: required,
      origin_place_id: uuid,
      destination_place_id: uuid,
      departure_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
        .nullable()
        .optional(),
      arrival_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
        .nullable()
        .optional(),
      time_label: text,
      transport_type: z.enum([
        "WALK",
        "TRAIN",
        "SUBWAY",
        "BUS",
        "SHINKANSEN",
        "AIRPORT_EXPRESS",
        "FLIGHT",
        "SHUTTLE",
        "TAXI",
        "OTHER",
      ]),
      route_name: text,
      operator: optional,
      boarding_point: optional,
      alighting_point: optional,
      estimated_duration_minutes: yen,
      estimated_cost_min_yen: yen,
      estimated_cost_max_yen: yen,
      reservation_required: z.boolean(),
      reservation_id: uuid,
      ticket_note: text,
      preparation_note: text,
      is_fixed: z.boolean(),
    })
    .refine(
      (v) =>
        v.estimated_cost_min_yen == null ||
        v.estimated_cost_max_yen == null ||
        v.estimated_cost_max_yen >= v.estimated_cost_min_yen,
      { message: "최대 금액을 확인해주세요", path: ["estimated_cost_max_yen"] },
    ),
  places: z.object({
    google_place_id: optional,
    custom_name: required,
    category: z.enum([
      "RESTAURANT",
      "CAFE",
      "ATTRACTION",
      "HOTEL",
      "SHOPPING",
      "STATION",
      "AIRPORT",
      "OTHER",
    ]),
    memo: text,
  }),
  meal_candidates: z
    .object({
      place_id: z.uuid(),
      meal_schedule_id: uuid,
      memo: text,
      priority: z.number().int().min(0).max(10),
      tags: text,
      favorite: z.boolean(),
      visited: z.boolean(),
    })
    .refine((v) => !v.visited || Boolean(v.meal_schedule_id), {
      message: "방문 선택은 식사 일정에 연결해야 합니다",
      path: ["meal_schedule_id"],
    }),
  packing_items: z.object({
    ...scope,
    label: required,
    category: text,
    owner,
    checked: z.boolean(),
    required: z.boolean(),
    note: text,
    sort_order: z.number().int().min(0),
  }),
  checklist_items: z.object({
    ...scope,
    title: required,
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
  budget_items: z
    .object({
      category: required,
      title: required,
      estimated_amount_yen: z.number().int().min(0).max(100000000),
      estimated_max_yen: yen,
      actual_amount_yen: yen,
      note: text,
    })
    .refine(
      (v) =>
        v.estimated_max_yen == null ||
        v.estimated_max_yen >= v.estimated_amount_yen,
      { message: "최대 금액을 확인하세요", path: ["estimated_max_yen"] },
    ),
  expenses: z
    .object({
      date: z.iso.date(),
      category: required,
      title: required,
      amount: z.number().int().positive().max(100000000),
      currency: z.literal("JPY"),
      payer_user_id: z.uuid(),
      split_mode: z.enum(["EQUAL", "USER_A_ONLY", "USER_B_ONLY", "CUSTOM"]),
      share_a_yen: z.number().int().min(0),
      share_b_yen: z.number().int().min(0),
      place_id: uuid,
      note: text,
    })
    .refine((v) => v.share_a_yen + v.share_b_yen === v.amount, {
      message: "분담액 합계가 지출액과 같아야 합니다",
      path: ["share_a_yen"],
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
  trip_id: string;
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
export function splitAmount(
  amount: number,
  mode: string,
  custom = 0,
): [number, number] {
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new Error("정수 엔 금액을 입력하세요");
  const a =
    mode === "EQUAL"
      ? Math.ceil(amount / 2)
      : mode === "USER_A_ONLY"
        ? amount
        : mode === "USER_B_ONLY"
          ? 0
          : custom;
  if (!Number.isSafeInteger(a) || a < 0 || a > amount)
    throw new Error("분담액을 확인하세요");
  return [a, amount - a];
}
export function settlement(expenses: Row[], members: Member[]) {
  return members.map((m) => {
    const paid = expenses
      .filter((e) => e.payer_user_id === m.user_id)
      .reduce((s, e) => s + Number(e.amount), 0);
    const share = expenses.reduce(
      (s, e) =>
        s + Number(e[m.slot === "USER_A" ? "share_a_yen" : "share_b_yen"]),
      0,
    );
    return { ...m, paid, share, balance: paid - share };
  });
}
export function inScope(row: Row, date: string, schedules: Row[]) {
  if (row.schedule_item_id)
    return schedules.some(
      (s) => s.id === row.schedule_item_id && s.date === date,
    );
  return row.date == null || row.date === date;
}
export function currentSchedule(items: Row[], date: string, now = new Date()) {
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
