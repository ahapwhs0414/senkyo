import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const source = readFileSync("docs/TRIP_PLAN.md", "utf8");
export const tripId = "20261222-2026-4222-8222-202612270002";
const id = (name) => {
  const h = createHash("sha256").update(name).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const data = {
  trips: [
    {
      id: tripId,
      title: "둘이, 일본 · 겨울 여행",
      start_date: "2026-12-22",
      end_date: "2026-12-27",
      timezone: "Asia/Tokyo",
      currency: "JPY",
    },
  ],
  trip_days: [],
  places: [],
  schedule_items: [],
  transport_segments: [],
  reservations: [],
  reservation_schedule_items: [],
  packing_items: [],
  checklist_items: [],
  budget_items: [],
  meal_candidates: [],
  expenses: [],
  expense_splits: [],
  shopping_items: [],
  emergency_contacts: [],
  notes: [],
  reservation_attachments: [],
};
const add = (table, key, fields) => {
  const row = { id: id(`${table}:${key}`), trip_id: tripId, ...fields };
  data[table].push(row);
  return row;
};
const names = [
  ["대구공항", "AIRPORT"],
  ["나리타공항", "AIRPORT"],
  ["도쿄역", "STATION"],
  ["센다이역", "STATION"],
  ["APA 호텔 TKP 센다이 에키기타", "HOTEL"],
  ["사칸", "HOTEL"],
  ["칸데오 호텔 우에노코엔", "HOTEL"],
  ["우마미 타스케", "RESTAURANT"],
  ["조젠지도리", "ATTRACTION"],
  ["이치반초", "SHOPPING"],
  ["아라이역", "STATION"],
  ["아라하마 초등학교", "ATTRACTION"],
  ["아라하마 해안", "ATTRACTION"],
  ["나카노사카에역", "STATION"],
  ["센다이 우미노모리 수족관", "ATTRACTION"],
  ["아키우 대폭포", "ATTRACTION"],
  ["라이라이쿄", "ATTRACTION"],
  ["아키우·사토센터", "ATTRACTION"],
  ["우구이스다니역", "STATION"],
  ["롯폰기", "ATTRACTION"],
  ["시바공원", "ATTRACTION"],
  ["도쿄타워", "ATTRACTION"],
  ["시부야", "SHOPPING"],
  ["마루노우치", "ATTRACTION"],
  ["우에노공원", "ATTRACTION"],
  ["아메요코", "SHOPPING"],
  ["신바시역", "STATION"],
  ["오다이바", "ATTRACTION"],
  ["돈키호테", "SHOPPING"],
  ["고쿄 외원", "ATTRACTION"],
];
for (const [name, category] of names)
  add("places", name, {
    custom_name: name,
    category,
    google_place_id: null,
    memo: "TRIP_PLAN 기준 · 정확한 지점 확인 후 Google 장소 연결",
  });
const place = (text) =>
  data.places.find((p) => text.includes(p.custom_name)) ??
  data.places.find((p) => text.includes(p.custom_name.replace(/역$/, "")));
const costs = [
  [13600, 14400],
  [1600, 1800],
  [12700, 13800],
  [900, 1200],
  [1100, 1400],
  [200, 200],
];
const sections = source.split(/# [3-8]\. ([1-6])일차[^\n]*\n/);
const time = (s) => s.match(/\d{2}:\d{2}/)?.[0] ?? null;
const fixed = (text) => /N'EX|Hayabusa|무료 셔틀|10:23/.test(text);
const actions =
  /확인|등록|가입|캡처|저장|수령|잊지|재확인|놓치지|복귀|맡기|정리|준비$|점검|입력|완료|보관|결정|분리|지정|구매|백업|작성/;
for (let index = 1; index < sections.length; index += 2) {
  const day = Number(sections[index]);
  const body = sections[index + 1];
  const date = `2026-12-${21 + day}`;
  const title = body.match(/^\s*## ([^\n]+)/)?.[1] ?? "";
  const hotel = body.match(/\*\*숙소:\*\* ([^\n]+)/)?.[1] ?? null;
  add("trip_days", date, {
    date,
    day_number: day,
    title,
    hotel_name: hotel,
    estimated_cost_min_yen: costs[day - 1][0],
    estimated_cost_max_yen: costs[day - 1][1],
  });
  let order = 0;
  for (const line of body.split("\n")) {
    if (!/^\| \d{2}:/.test(line)) continue;
    const [, timeLabel, title, note] = line.split("|").map((x) => x.trim());
    const [start, end] = timeLabel.split("~");
    const type = /✈️/.test(note)
      ? "FLIGHT"
      : /🚄|🚆/.test(note)
        ? "TRAIN"
        : /🚌|🚇|🚝/.test(note)
          ? "TRANSIT"
          : /🚶/.test(note)
            ? "WALK"
            : /식사|조식|점심|저녁/.test(title)
              ? "MEAL"
              : /출국수속|출국층/.test(title)
                ? "OTHER"
                : /체크인|체크아웃/.test(title)
                  ? "HOTEL"
                  : /쇼핑|기념품/.test(title)
                    ? "SHOPPING"
                    : /휴식/.test(title)
                      ? "FREE_TIME"
                      : "ATTRACTION";
    const location = place(title);
    const item = add("schedule_items", `${date}:${order}`, {
      date,
      type,
      title,
      time_label: timeLabel,
      start_time: time(start),
      end_time: time(end ?? ""),
      place_id: location?.id ?? null,
      description: note,
      status: "planned",
      sort_order: order++,
      is_fixed: fixed(title + " " + note + " " + timeLabel),
      estimated_cost_yen: title === "센다이 우미노모리 수족관" ? 2400 : null,
      note: "",
    });
    if (
      ["FLIGHT", "TRAIN", "TRANSIT", "WALK"].includes(type) ||
      title.includes(" → ")
    ) {
      const [origin, destination] = title.includes(" → ")
        ? title.split(" → ")
        : [null, null];
      const prev = data.schedule_items
        .filter((s) => s.date === date && s.sort_order < item.sort_order)
        .at(-1);
      const originName =
        origin ??
        (prev?.place_id
          ? data.places.find((p) => p.id === prev.place_id)?.custom_name
          : "출발 위치 확인 필요") ??
        "출발 위치 확인 필요";
      const destinationName = destination ?? title.replace(/ 이동| 복귀/, "");
      const route = note
        .replaceAll("️", "")
        .replace(/[🚆🚄🚌🚇🚝🚶✈]/gu, "")
        .trim();
      const transport_type =
        type === "FLIGHT"
          ? "FLIGHT"
          : /N'EX/.test(note)
            ? "AIRPORT_EXPRESS"
            : /Hayabusa/.test(note)
              ? "SHINKANSEN"
              : /셔틀/.test(note)
                ? "SHUTTLE"
                : /🚇/.test(note)
                  ? "SUBWAY"
                  : /🚌/.test(note)
                    ? "BUS"
                    : type === "WALK"
                      ? "WALK"
                      : "TRAIN";
      const min = /N'EX 30/.test(note)
        ? 2600
        : /N'EX 17/.test(note)
          ? 0
          : /Hayabusa/.test(note)
            ? 11000
            : transport_type === "WALK" || transport_type === "SHUTTLE"
              ? 0
              : null;
      add("transport_segments", item.id, {
        date,
        schedule_item_id: item.id,
        origin_name: originName,
        destination_name: destinationName,
        origin_place_id: place(originName)?.id ?? null,
        destination_place_id: place(destinationName)?.id ?? null,
        departure_time: item.start_time,
        arrival_time: item.end_time,
        time_label: timeLabel,
        transport_type,
        route_name: route || transport_type,
        boarding_point: originName,
        alighting_point: destinationName,
        estimated_duration_minutes:
          item.start_time && item.end_time
            ? Number(item.end_time.slice(0, 2)) * 60 +
              Number(item.end_time.slice(3)) -
              (Number(item.start_time.slice(0, 2)) * 60 +
                Number(item.start_time.slice(3)))
            : null,
        estimated_cost_min_yen: min,
        estimated_cost_max_yen: min === 11000 ? 11500 : min,
        reservation_required: /Hayabusa|셔틀/.test(note),
        reservation_id: null,
        ticket_note: /N'EX 17/.test(note)
          ? "왕복권에 포함 · 날짜별 배분과 총액 중복 합산 주의"
          : "",
        preparation_note: fixed(title + " " + note)
          ? "TRIP_PLAN 시간 보존 · 운행 및 예약 확인 필요"
          : "출발 전 시간표 확인",
        is_fixed: item.is_fixed,
      });
    }
  }
  let n = 0;
  for (const line of body.split("\n")) {
    const label = line.match(/^- \[ \] (.+)/)?.[1];
    if (!label) continue;
    if (actions.test(label))
      add("checklist_items", `${date}:${n++}`, {
        date,
        schedule_item_id: null,
        title: label,
        description: "",
        owner: "SHARED",
        status: "TODO",
        priority: /셔틀|10:23|예약/.test(label) ? 2 : 0,
        due_at: null,
      });
    else
      add("packing_items", `${date}:${n++}`, {
        date,
        schedule_item_id: null,
        label,
        category: "OTHER",
        owner: "SHARED",
        checked: false,
        required: true,
        note: "",
        sort_order: n,
      });
  }
}
const pre = source
  .split("# 1. 여행 전 전체 준비 체크리스트")[1]
  .split("# 2. 예약정보")[0];
let count = 0;
for (const line of pre.split("\n")) {
  const label = line.match(/^- \[ \] (.+)/)?.[1];
  if (!label) continue;
  const table = actions.test(label) ? "checklist_items" : "packing_items";
  add(
    table,
    `trip:${count++}`,
    table === "packing_items"
      ? {
          date: null,
          schedule_item_id: null,
          label,
          category: "OTHER",
          owner: "SHARED",
          checked: false,
          required: true,
          note: "",
          sort_order: count,
        }
      : {
          date: null,
          schedule_item_id: null,
          title: label,
          description: "",
          owner: "SHARED",
          status: "TODO",
          due_at: null,
          priority: 1,
        },
  );
}
const waterfall = data.schedule_items.find(
  (s) => s.title === "아키우 대폭포 관람",
);
for (const label of [
  "방한복",
  "장갑",
  "미끄럽지 않은 신발",
  "교통 IC카드 또는 현금",
])
  add("packing_items", `waterfall:${label}`, {
    date: "2026-12-24",
    schedule_item_id: waterfall.id,
    label,
    category: "OTHER",
    owner: "SHARED",
    checked: false,
    required: true,
    note: "TRIP_PLAN 3일차 준비정보에서 일정별로 연결",
    sort_order: 0,
  });
const end = source.split("# 12. 여행 종료 체크리스트")[1];
for (const label of [...end.matchAll(/^- \[ \] (.+)/gm)].map((m) => m[1]))
  add("checklist_items", `end:${label}`, {
    date: "2026-12-27",
    schedule_item_id: null,
    title: label,
    description: "여행 종료",
    owner: "SHARED",
    status: "TODO",
    priority: 0,
    due_at: null,
  });
const reservationDefs = [
  ["FLIGHT", "대구 → 나리타", "2026-12-22", "11:10", "13:20"],
  ["FLIGHT", "나리타 → 대구", "2026-12-27", "14:20", "16:50"],
  ["HOTEL", "APA 호텔 TKP 센다이 에키기타", "2026-12-22", null, null],
  ["HOTEL", "사칸", "2026-12-23", null, null],
  ["HOTEL", "칸데오 호텔 우에노코엔", "2026-12-24", null, null],
  ["TRAIN", "N'EX 30", "2026-12-22", "14:45", "15:45"],
  ["TRAIN", "N'EX 17", "2026-12-27", "10:33", "11:27"],
  ["TRAIN", "Hayabusa 33", "2026-12-22", "16:20", "17:51"],
  ["TRAIN", "Hayabusa 26", "2026-12-24", "15:57", "17:32"],
  ["SHUTTLE", "센다이 → 사칸 셔틀", "2026-12-23", "15:30", "16:15"],
  ["SHUTTLE", "사칸 → 센다이 셔틀", "2026-12-24", "14:30", "15:15"],
  ["INSURANCE", "여행자보험", null, null, null],
];
for (const [type, title, date, start, end] of reservationDefs) {
  const r = add("reservations", title, {
    type,
    title,
    provider: null,
    reservation_number: null,
    booker_name: null,
    start_at: date && start ? `${date}T${start}:00+09:00` : null,
    end_at: date && end ? `${date}T${end}:00+09:00` : null,
    website_url: null,
    booking_url: null,
    confirmation_url: null,
    contact_phone: null,
    contact_email: null,
    status: "PLANNED",
    seat_number: null,
    carriage_number: null,
    flight_number: null,
    room_info: null,
    ticket_method: null,
    qr_note: null,
    insurance_number: null,
    note: date
      ? `사용자 예약정보 입력 필요 · ${date}`
      : "사용자 보험정보 입력 필요",
  });
  for (const segment of data.transport_segments) {
    if (
      segment.date === date &&
      ((type === "TRAIN" && segment.route_name.includes(title)) ||
        (type === "FLIGHT" && segment.transport_type === "FLIGHT") ||
        (type === "SHUTTLE" && segment.transport_type === "SHUTTLE"))
    ) {
      segment.reservation_id = r.id;
      add("reservation_schedule_items", `${r.id}:${segment.schedule_item_id}`, {
        reservation_id: r.id,
        schedule_item_id: segment.schedule_item_id,
      });
    }
  }
  if (type === "FLIGHT")
    for (const s of data.schedule_items) {
      if (s.date === date && s.type === "OTHER" && s.title.includes("체크인")) {
        s.place_id =
          place(date === "2026-12-22" ? "대구공항" : "나리타공항")?.id ?? null;
        add("reservation_schedule_items", `${r.id}:${s.id}`, {
          reservation_id: r.id,
          schedule_item_id: s.id,
        });
      }
    }
  if (type === "HOTEL")
    for (const s of data.schedule_items) {
      if (
        s.type === "HOTEL" &&
        ((s.title.includes("체크인") && s.date === date) ||
          (s.title.includes("체크아웃") &&
            ((title === "APA 호텔 TKP 센다이 에키기타" &&
              s.date === "2026-12-23") ||
              (title === "사칸" && s.date === "2026-12-24") ||
              (title === "칸데오 호텔 우에노코엔" && s.date === "2026-12-27"))))
      ) {
        s.place_id = place(title)?.id ?? null;
        add("reservation_schedule_items", `${r.id}:${s.id}`, {
          reservation_id: r.id,
          schedule_item_id: s.id,
        });
      }
    }
}
for (const t of data.transport_segments) {
  if (t.date === "2026-12-24" && t.departure_time === "10:23") {
    t.origin_name = "아키우 대폭포";
    t.destination_name = "아키우 온천권";
    t.origin_place_id = place("아키우 대폭포").id;
    t.destination_place_id = null;
    t.boarding_point = "아키우 대폭포";
    t.alighting_point = "아키우 온천권";
    t.time_label = "10:23 → 10:45~10:50 전후";
    t.route_name = "아키우 대폭포 복귀 버스";
    t.preparation_note = "10:23 복귀 버스 시간 재확인 · 놓치지 않기";
  }
  if (t.date === "2026-12-23" && t.transport_type === "SHUTTLE")
    t.boarding_point = "센다이역 동쪽 출구 · 정확한 집합 위치 확인";
}
for (const [title, min, max] of [
  ["N'EX 왕복권", 5200, 5200],
  ["도쿄 → 센다이 신칸센", 11000, 11500],
  ["센다이 → 도쿄 신칸센", 11000, 11500],
  ["2일차 센다이권 교통", 1600, 1800],
  ["3일차 아키우 버스", 1000, 1400],
  ["도쿄 시내 교통", 2500, 3000],
  ["사칸 셔틀 왕복", 0, 0],
])
  add("budget_items", title, {
    title,
    category: "교통",
    estimated_amount_yen: min * 2,
    estimated_max_yen: max * 2,
    actual_amount_yen: null,
    note: "2인 총액 · TRIP_PLAN 교통비 요약 기준. 날짜별 예상액과 중복 합산하지 않음",
  });
writeFileSync("src/lib/seed.json", JSON.stringify(data, null, 2) + "\n");
const quote = (v) =>
  v === null
    ? "null"
    : typeof v === "number" || typeof v === "boolean"
      ? String(v)
      : `'${String(v).replaceAll("'", "''")}'`;
let sql =
  "-- Generated from docs/TRIP_PLAN.md; rerunning preserves user edits.\nbegin;\n";
for (const table of [
  "trips",
  "trip_days",
  "places",
  "schedule_items",
  "reservations",
  "transport_segments",
  "reservation_schedule_items",
  "packing_items",
  "checklist_items",
  "budget_items",
  "meal_candidates",
  "expenses",
  "expense_splits",
  "shopping_items",
  "emergency_contacts",
  "notes",
  "reservation_attachments",
])
  for (const row of data[table])
    sql += `insert into public.${table} (${Object.keys(row).join(",")}) values (${Object.values(row).map(quote).join(",")}) on conflict(id) do nothing;\n`;
sql += "commit;\n";
writeFileSync("supabase/seed.sql", sql);
console.log(
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
);
