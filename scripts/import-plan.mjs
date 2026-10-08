// Explicit Markdown table fields, stable keys, and reviewed legacy UUID mapping.
import { readFileSync as read, writeFileSync as write } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const trip = "20261222-2026-4222-8222-202612270002",
  version = "2026-10-06-r3";
const source = read("docs/TRIP_PLAN.md", "utf8");
assert.ok(source.includes(`계획 버전: ${version}`));
const legacy = JSON.parse(read("scripts/plan/legacy-seed.json"));
const mapping = JSON.parse(read("scripts/plan/legacy-ids.json"));
function id(table, key) {
  if (mapping[table]?.[key]) return mapping[table][key];
  const h = createHash("sha256").update(`senkyo:${table}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const section = (start, end) =>
  source.slice(source.indexOf(start), end ? source.indexOf(end) : undefined);
const rows = (text) =>
  text
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim().replaceAll("`", "")),
    )
    .filter((c) => /^[a-z][a-z0-9-]+$/.test(c[0]));
const keyed = (table, key, fields) => ({
  id: id(table, key),
  trip_id: trip,
  plan_key: key,
  archived: false,
  ...fields,
});
const data = Object.fromEntries(Object.keys(legacy).map((t) => [t, []]));
for (const t of ["schedule_places", "packing_checks", "packing_schedule_items"])
  data[t] = [];
data.trips = [{ ...legacy.trips[0], plan_version: version }];
data.places = rows(section("## 3.", "## 4.")).map(
  ([key, name, category, link]) => {
    const url = link.match(/\]\((https:\/\/[^)]+)\)/)?.[1];
    assert.ok(url, key);
    return keyed("places", key, {
      custom_name: name,
      category,
      maps_url: url,
      google_place_id: null,
      verified_on: null,
      memo: "장소명 검색 링크 · 정확한 지점·여행일 영업 확인 필요",
    });
  },
);
function place(key) {
  const p = data.places.find((p) => p.plan_key === key);
  assert.ok(p, key);
  return p;
}
for (let n = 1; n <= 6; n++) {
  const text = section(`### ${n}일차`, n < 6 ? `### ${n + 1}일차` : "## 5.");
  const header = text.split("\n")[0].split(" · "),
    date = header[1],
    hotel = text.match(/숙소: (.+)/)[1];
  data.trip_days.push({
    ...legacy.trip_days[n - 1],
    date,
    title: header.slice(2).join(" · "),
    hotel_name: hotel,
    estimated_cost_min_yen: null,
    estimated_cost_max_yen: null,
  });
  for (const [key, time, type, title, keys, note] of rows(text)) {
    const ps = keys === "—" ? [] : keys.split(",").map((k) => k.trim()),
      times = [...time.matchAll(/\d{2}:\d{2}/g)].map((m) => m[0]);
    const s = keyed("schedule_items", key, {
      date,
      type: ["BUS", "SHUTTLE"].includes(type) ? "TRANSIT" : type,
      title,
      time_label: time,
      start_time: times[0] ?? null,
      end_time: times[1] ?? null,
      place_id: ps.length ? place(ps[0]).id : null,
      description: note === "—" ? "" : note,
      status: "planned",
      sort_order: data.schedule_items.filter((s) => s.date === date).length,
      is_fixed: ["FLIGHT", "TRAIN", "BUS", "SHUTTLE"].includes(type),
      estimated_cost_yen: null,
      note: "",
    });
    data.schedule_items.push(s);
    ps.forEach((k, i) =>
      data.schedule_places.push({
        id: id("schedule_places", `${key}:${k}`),
        trip_id: trip,
        schedule_item_id: s.id,
        place_id: place(k).id,
        sort_order: i,
        archived: false,
      }),
    );
    if (["FLIGHT", "TRAIN", "TRANSIT", "BUS", "SHUTTLE"].includes(type)) {
      const from = ps.length >= 2 ? place(ps[0]) : null,
        to = ps.length ? place(ps.at(-1)) : null,
        mins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
      data.transport_segments.push(
        keyed("transport_segments", key, {
          date,
          schedule_item_id: s.id,
          origin_name: from?.custom_name ?? "출발지 확인 필요",
          destination_name: to?.custom_name ?? "도착지 확인 필요",
          origin_place_id: from?.id ?? null,
          destination_place_id: to?.id ?? null,
          departure_time: s.start_time,
          arrival_time: s.end_time,
          time_label: time,
          transport_type: type === "TRANSIT" ? "OTHER" : type,
          route_name: title,
          estimated_duration_minutes:
            times.length === 2 ? mins(times[1]) - mins(times[0]) : null,
          estimated_cost_min_yen: null,
          estimated_cost_max_yen: null,
          reservation_required:
            ["FLIGHT", "SHUTTLE"].includes(type) ||
            key.includes("hayabusa") ||
            key.includes("nex-"),
          reservation_id: null,
          ticket_note: "실제 예약·운행 정보는 예약자료에서 확인해주세요",
          preparation_note: s.description,
          is_fixed: s.is_fixed,
        }),
      );
    }
  }
}
function schedule(key) {
  const s = data.schedule_items.find((s) => s.plan_key === key);
  assert.ok(s, key);
  return s;
}
data.reservations.push({
  ...legacy.reservations.find((r) => r.type === "INSURANCE"),
  plan_key: "res-insurance",
  archived: false,
  material_only: false,
});
for (const [key, title, keys] of rows(section("## 7.", "## 8."))) {
  const type = key.includes("flight")
    ? "FLIGHT"
    : key.includes("hotel")
      ? "HOTEL"
      : key.includes("shuttle")
        ? "SHUTTLE"
        : key.includes("aquarium")
          ? "ATTRACTION"
          : "TRAIN";
  const old = legacy.reservations.find(
    (r) => r.id === mapping.reservations[key],
  );
  const r = keyed("reservations", key, {
    ...(old ?? {}),
    type,
    title: old?.title ?? title,
    provider: null,
    reservation_number: null,
    booker_name: null,
    confirmation_url: null,
    seat_number: null,
    carriage_number: null,
    flight_number: null,
    start_at: null,
    end_at: null,
    status: "PLANNED",
    note: "",
    material_only: false,
  });
  data.reservations.push(r);
  for (const k of keys.split(",").map((k) => k.trim()))
    data.reservation_schedule_items.push({
      id: id("reservation_schedule_items", `${key}:${k}`),
      trip_id: trip,
      reservation_id: r.id,
      schedule_item_id: schedule(k).id,
    });
}
for (const [key, due, title] of rows(section("## 6.", "공통 준비물 정의:"))) {
  const md = due.match(/(\d{2})\/(\d{2})/);
  data.checklist_items.push(
    keyed("checklist_items", key, {
      title,
      description: due,
      date: null,
      schedule_item_id: null,
      scope: "PRE_TRIP",
      owner: "SHARED",
      status: "TODO",
      due_at: md ? `2026-${md[1]}-${md[2]}T23:59:00+09:00` : null,
      priority: 1,
    }),
  );
}
for (const [key, label, ownership] of rows(
  section("공통 준비물 정의:", "## 7."),
)) {
  for (const owner of ownership.startsWith("개인별")
    ? ["USER_A", "USER_B"]
    : ["SHARED"])
    data.packing_items.push(
      keyed("packing_items", `${key}:${owner}`, {
        label,
        category: "OTHER",
        owner,
        repeat_daily: ownership.includes("일별"),
        checked: false,
        required: true,
        note: ownership,
        date: null,
        schedule_item_id: null,
        sort_order: data.packing_items.length,
      }),
    );
}
// This explicit dictionary only links documented common definitions.
const definitions = {
  여권: "pack-passport",
  휴대전화: "pack-phone",
  "휴대 수하물": "pack-luggage",
  캐리어: "pack-luggage",
  결제수단: "pack-wallet",
  방한용품: "pack-coat",
  "편한 신발": "pack-shoes",
  "미끄럽지 않은 신발": "pack-shoes",
  장갑: "pack-coat",
};
for (const [key, packing, task] of rows(section("## 5.", "## 6."))) {
  const s = schedule(key);
  if (key === "d1-yoshinoya") continue;
  if (task !== "—")
    data.checklist_items.push(
      keyed("checklist_items", `${key}:task`, {
        title: task,
        description: "",
        date: s.date,
        schedule_item_id: s.id,
        scope: "SCHEDULE",
        owner: "SHARED",
        status: "TODO",
        due_at: null,
        priority: 1,
      }),
    );
  if (["—", "공통 준비물"].includes(packing)) continue;
  const remaining = [];
  for (const token of packing.split("·")) {
    const common = definitions[token];
    if (!common) {
      remaining.push(token);
      continue;
    }
    for (const p of data.packing_items.filter((p) =>
      p.plan_key.startsWith(common + ":"),
    )) {
      if (
        !data.packing_schedule_items.some(
          (l) => l.packing_item_id === p.id && l.schedule_item_id === s.id,
        )
      )
        data.packing_schedule_items.push({
          id: id("packing_schedule_items", `${p.plan_key}:${key}`),
          trip_id: trip,
          packing_item_id: p.id,
          schedule_item_id: s.id,
        });
    }
  }
  if (remaining.length)
    data.packing_items.push(
      keyed("packing_items", `${key}:materials`, {
        label: remaining.join("·"),
        category: "RESERVATION",
        owner: "SHARED",
        repeat_daily: false,
        checked: false,
        required: true,
        note: "계획서 준비 제안 · 실제 자료 확인 필요",
        date: s.date,
        schedule_item_id: s.id,
        sort_order: 0,
      }),
    );
}
for (const t of ["emergency_contacts", "notes", "shopping_items"])
  data[t] = legacy[t];
for (const [t, rs] of Object.entries(data))
  assert.equal(
    new Set(rs.map((r) => r.id)).size,
    rs.length,
    `Duplicate IDs: ${t}`,
  );
const quote = (v) =>
  v == null
    ? "null"
    : typeof v === "number" || typeof v === "boolean"
      ? String(v)
      : `'${String(v).replaceAll("'", "''")}'`;
const owned = [
  "trip_days",
  "places",
  "schedule_items",
  "transport_segments",
  "schedule_places",
];
let sql = `-- Generated from explicit ${version} tables; apply as administrator after backup.\nbegin;\nselect pg_advisory_xact_lock(hashtextextended('${trip}:plan',0));\n`;
const backups = [
  "trips",
  ...owned,
  "reservations",
  "reservation_schedule_items",
  "packing_items",
  "checklist_items",
  "reservation_attachments",
  "meal_candidates",
];
sql += `insert into public.plan_revision_backups(trip_id,plan_version,snapshot) select '${trip}','${version}',jsonb_build_object(${backups.map((t) => `'${t}',coalesce((select jsonb_agg(to_jsonb(t)) from public.${t} t where ${t === "trips" ? "id" : "trip_id"}='${trip}'),'[]'::jsonb)`).join(",")}) on conflict do nothing;\n`;
for (const t of ["schedule_items", "places", "transport_segments"]) {
  const retired = legacy[t].filter((r) => !data[t].some((p) => p.id === r.id));
  if (retired.length)
    sql += `update public.${t} set archived=true where trip_id='${trip}' and id in (${retired.map((r) => quote(r.id)).join(",")}) and archived=false;\n`;
}
const obsoleteLabels = new Set([
  "칸데오 호텔 예약정보",
  "칸데오 호텔 예약번호 / 사이트",
  "원하는 후보 식당",
  "후보 점심 식당 저장",
  "후보 저녁 식당 저장",
  "남은 쇼핑 예산",
  "쇼핑 예산 확인",
  "일본에서 발생한 공동 지출 최종 입력",
  "모든 지출 입력",
  "공동 정산 완료",
  "사용하지 않은 후보 장소 보관",
]);
for (const t of ["packing_items", "checklist_items"]) {
  const retired = legacy[t].filter(
    (r) =>
      obsoleteLabels.has(r.label ?? r.title) ||
      (r.schedule_item_id &&
        !data.schedule_items.some((s) => s.id === r.schedule_item_id)),
  );
  if (retired.length)
    sql += `update public.${t} set archived=true where trip_id='${trip}' and id in (${retired.map((r) => quote(r.id)).join(",")}) and archived=false;\n`;
}
sql += `update public.schedule_places set archived=true where trip_id='${trip}' and archived=false;\n`;
sql += `update public.reservations set archived=true where trip_id='${trip}' and id='${legacy.reservations.find((r) => r.title.includes("칸데오")).id}' and archived=false;\n`;
for (const [t, rs] of Object.entries(data))
  for (const r of rs) {
    const cols = Object.keys(r);
    const update =
      t === "trips"
        ? [
            "title",
            "start_date",
            "end_date",
            "timezone",
            "currency",
            "plan_version",
          ]
        : owned.includes(t)
          ? cols.filter(
              (c) =>
                ![
                  "id",
                  "trip_id",
                  "google_place_id",
                  "note",
                  "status",
                  "reservation_id",
                  "ticket_note",
                  "created_at",
                  "updated_at",
                ].includes(c),
            )
          : ["packing_items", "checklist_items"].includes(t)
            ? ["plan_key", "archived"]
            : [];
    const conflict =
      t === "reservation_schedule_items"
        ? "(trip_id,reservation_id,schedule_item_id)"
        : t === "schedule_places"
          ? "(trip_id,schedule_item_id,place_id)"
          : t === "packing_schedule_items"
            ? "(trip_id,packing_item_id,schedule_item_id)"
            : "(id)";
    sql += `insert into public.${t}(${cols.join(",")}) values(${cols.map((c) => quote(r[c])).join(",")}) on conflict ${conflict} ${update.length ? "do update set " + update.map((c) => `${c}=excluded.${c}`).join(",") + " where " + update.map((c) => `${t}.${c} is distinct from excluded.${c}`).join(" or ") : "do nothing"};\n`;
  }
sql += "commit;\n";
const files = {
  "src/lib/seed.json": JSON.stringify(data, null, 2) + "\n",
  "supabase/seed.sql": sql,
  "supabase/migrations/202610060006_plan_r3.sql": sql,
};
if (process.argv.includes("--check")) {
  for (const [path, text] of Object.entries(files))
    assert.equal(read(path, "utf8"), text, path);
} else {
  for (const [path, text] of Object.entries(files)) write(path, text);
}
console.log(
  `${version}: ${data.schedule_items.length} schedules, ${data.places.length} source place names; deterministic outputs ${process.argv.includes("--check") ? "checked" : "written"}. No operating database contacted.`,
);
