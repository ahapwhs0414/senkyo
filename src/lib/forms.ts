import type { Table, Row } from "./domain";
export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "datetime"
    | "time"
    | "checkbox"
    | "url"
    | "email";
  options?: string[];
  ref?: "places" | "schedule_items" | "meals" | "reservations" | "members";
  required?: boolean;
  default?: string | number | boolean | null;
};
const f = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const title = f("title", "제목", "text", { required: true });
const note = f("note", "메모", "textarea");
const date = f("date", "날짜", "date");
const scope = [
  date,
  f("schedule_item_id", "연결 일정", "text", { ref: "schedule_items" }),
];
const owner = f("owner", "담당자", "text", {
  options: ["SHARED", "USER_A", "USER_B"],
  default: "SHARED",
});
const category = f("category", "카테고리", "text", {
  default: "OTHER",
  required: true,
});
const yen = (key: string, label: string, required = false) =>
  f(key, label, "number", { required });
export const forms: Record<Table, Field[]> = {
  packing_checks: [],
  packing_items: [
    ...scope,
    f("label", "준비물", "text", { required: true }),
    category,
    owner,
    f("checked", "짐 싸기 / 준비 완료", "checkbox"),
    f("repeat_daily", "매일 휴대 여부를 따로 체크", "checkbox"),
    f("required", "필수", "checkbox", { default: true }),
    note,
    yen("sort_order", "정렬 순서", true),
  ],
  checklist_items: [
    ...scope,
    f("scope", "범위", "text", {
      options: ["PRE_TRIP", "TRIP", "DATE", "SCHEDULE"],
      default: "PRE_TRIP",
    }),
    title,
    f("description", "설명", "textarea"),
    owner,
    f("status", "상태", "text", { options: ["TODO", "DONE"], default: "TODO" }),
    f("due_at", "기한 (일본시간)", "datetime"),
    yen("priority", "우선순위 (0–10)", true),
  ],
  reservations: [
    title,
    f("material_only", "비예약 이동자료", "checkbox"),
    f("type", "유형", "text", {
      options: [
        "FLIGHT",
        "HOTEL",
        "TRAIN",
        "BUS",
        "SHUTTLE",
        "ATTRACTION",
        "RESTAURANT",
        "INSURANCE",
        "OTHER",
      ],
      default: "OTHER",
    }),
    f("provider", "예약 사이트 / 제공사"),
    f("reservation_number", "예약번호"),
    f("booker_name", "예약자명"),
    f("start_at", "시작 (일본시간)", "datetime"),
    f("end_at", "종료 (일본시간)", "datetime"),
    f("website_url", "공식 웹사이트", "url"),
    f("booking_url", "예약 사이트 URL", "url"),
    f("confirmation_url", "예약 확인 URL", "url"),
    f("contact_phone", "연락처"),
    f("contact_email", "이메일", "email"),
    f("status", "상태", "text", {
      options: ["PLANNED", "BOOKED", "CONFIRMED", "USED", "CANCELLED"],
      default: "PLANNED",
    }),
    f("seat_number", "좌석번호"),
    f("carriage_number", "차량번호"),
    f("flight_number", "항공편 번호"),
    f("room_info", "객실정보"),
    f("ticket_method", "티켓 수령 방법"),
    f("qr_note", "QR 메모"),
    f("insurance_number", "보험 증권번호"),
    note,
  ],
  reservation_schedule_items: [
    f("reservation_id", "예약", "text", {
      ref: "reservations",
      required: true,
    }),
    f("schedule_item_id", "일정", "text", {
      ref: "schedule_items",
      required: true,
    }),
  ],
  shopping_items: [
    f("name", "구매할 물건", "text", { required: true }),
    category,
    f("target_place_id", "구매 장소", "text", { ref: "places" }),
    yen("planned_budget_yen", "예상 예산 (엔)"),
    yen("actual_cost_yen", "실제비용 (엔)"),
    f("buyer", "구매자", "text", {
      options: ["SHARED", "USER_A", "USER_B"],
      default: "SHARED",
    }),
    f("purchased", "구매 완료", "checkbox"),
    note,
  ],
  emergency_contacts: [
    title,
    category,
    f("phone", "전화번호"),
    f("url", "참고 URL", "url"),
    note,
  ],
  notes: [...scope, title, f("body", "메모 / 회고", "textarea")],
};
export const labels: Record<string, string> = {
  schedule_items: "일정",
  transport_segments: "이동 구간",
  places: "장소",
  packing_items: "준비물",
  checklist_items: "체크리스트",
  reservations: "예약",
  reservation_schedule_items: "예약과 일정 연결",
  schedule_places: "일정 장소 연결",
  shopping_items: "쇼핑",
  emergency_contacts: "긴급정보",
  notes: "메모 / 회고",
};
export const words: Record<string, string> = {
  PRE_TRIP: "여행 전",
  TRIP: "공통",
  DATE: "날짜별",
  SCHEDULE: "일정별",
  SHARED: "공동",
  SHINKANSEN: "신칸센",
  AIRPORT_EXPRESS: "공항 특급",
  SUBWAY: "지하철",
  TAXI: "택시",
  OWNER: "소유자",
  EDITOR: "편집자",
  VIEWER: "조회 전용",
  USER_A: "A",
  USER_B: "B",
  planned: "예정",
  confirmed: "확정",
  completed: "완료",
  skipped: "건너뜀",
  TODO: "미완료",
  DONE: "완료",
  PLANNED: "예약 필요",
  BOOKED: "예약함",
  CONFIRMED: "확인 완료",
  USED: "사용 완료",
  CANCELLED: "취소",
  MEAL: "식사",
  FLIGHT: "항공",
  TRAIN: "열차",
  TRANSIT: "대중교통",
  HOTEL: "숙소",
  ATTRACTION: "관광",
  SHOPPING: "쇼핑",
  WALK: "도보",
  FREE_TIME: "자유시간",
  OTHER: "기타",
  SHUTTLE: "셔틀",
  BUS: "버스",
  INSURANCE: "보험",
  RESTAURANT: "식당",
  CAFE: "카페",
  STATION: "역",
  AIRPORT: "공항",
};
export function defaults(table: Table, date: string): Row {
  const row: Row = { id: "", trip_id: "" };
  for (const field of forms[table])
    row[field.key] =
      field.default ??
      (field.type === "checkbox"
        ? false
        : field.type === "number" && field.required
          ? 0
          : field.key === "date"
            ? date
            : field.ref
              ? null
              : "");
  return row;
}
