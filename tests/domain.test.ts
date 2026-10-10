import { describe, it, expect } from "vitest";
import {
  tokyoDate,
  mapsUrl,
  placeMapUrl,
  inScope,
  currentSchedule,
  schemas,
  validFile,
  linkedPlaceIds,
  packingChecked,
  readTables,
  type Data,
  type Row,
} from "../src/lib/domain";
import rawSeed from "../src/lib/seed.json";
const seed: Data = rawSeed;
describe("r4 travel contracts", () => {
  it("uses Japanese date across UTC midnight", () =>
    expect(tokyoDate(new Date("2026-12-21T15:01:00Z"))).toBe("2026-12-22"));
  it("imports all explicit keys, preserves approximate times and leaves booking details unset", () => {
    expect(seed.trip_days).toHaveLength(6);
    expect(seed.schedule_items).toHaveLength(113);
    expect(seed.trips[0].plan_version).toBe("2026-10-10-r4");
    expect(seed.reservations.length).toBeGreaterThan(10);
    expect(
      seed.reservations.every(
        (r) =>
          r.reservation_number === null &&
          r.confirmation_url === null &&
          r.seat_number === null &&
          r.status === "PLANNED",
      ),
    ).toBe(true);
    expect(
      seed.schedule_items.find((s) => s.plan_key === "d3-bus-falls")
        ?.time_label,
    ).toBe("09:20 전후");
  });
  it("removes Arahama, updates the aquarium/shuttle/hotel and keeps unresolved meals without invented places", () => {
    expect(
      seed.schedule_items.some((s) => String(s.title).includes("아라하마")),
    ).toBe(false);
    expect(
      seed.schedule_items.find((s) => s.plan_key === "d2-aquarium"),
    ).toMatchObject({ start_time: "10:00", end_time: "13:00" });
    expect(
      seed.schedule_items.find((s) => s.plan_key === "d2-shuttle"),
    ).toMatchObject({
      start_time: "15:30",
      end_time: "16:15",
      type: "TRANSIT",
    });
    expect(
      seed.trip_days
        .slice(2, 5)
        .every((d) => d.hotel_name === "APA Hotel Ueno Ekikita"),
    ).toBe(true);
    expect(
      seed.schedule_items.find((s) => s.plan_key === "d4-breakfast")?.place_id,
    ).toBeNull();
    expect(
      seed.schedule_items.find((s) => s.plan_key === "d1-yoshinoya"),
    ).toMatchObject({ start_time: null, place_id: null });
    expect(seed.places.every((p) => p.google_place_id === null)).toBe(true);
  });
  it("links each fixed restaurant in explicit order, without creating candidates", () => {
    for (const [skey, pkey] of [
      ["d2-lunch", "oyama-sendai"],
      ["d3-lunch", "kaichi-honten"],
      ["d3-dinner", "tsujihan-ark"],
      ["d5-sushiro-lunch", "sushiro-yurakucho"],
      ["d4-dinner", "hajime"],
      ["d5-lunch", "unatoto-ueno"],
      ["d5-dinner", "moheji-ueno"],
    ]) {
      const s = seed.schedule_items.find((s) => s.plan_key === skey)!,
        p = seed.places.find((p) => p.plan_key === pkey)!;
      expect(
        seed.schedule_places.some(
          (l) => l.schedule_item_id === s.id && l.place_id === p.id,
        ),
      ).toBe(true);
      expect(new URL(placeMapUrl(p)).searchParams.get("api")).toBe("1");
    }
    expect(readTables).not.toContain("meal_candidates");
    expect(readTables).not.toContain("expenses");
    expect(readTables).not.toContain("expense_splits");
  });
  it("keeps PRE_TRIP and archived items out of daily aggregates", () => {
    const schedules: Row[] = [
      { id: "s", trip_id: "t", date: "2026-12-24" },
      { id: "old", trip_id: "t", date: "2026-12-24", archived: true },
    ];
    expect(
      inScope(
        { id: "p", trip_id: "t", scope: "PRE_TRIP" },
        "2026-12-24",
        schedules,
      ),
    ).toBe(false);
    expect(
      inScope(
        { id: "p", trip_id: "t", schedule_item_id: "old" },
        "2026-12-24",
        schedules,
      ),
    ).toBe(false);
    expect(
      inScope({ id: "p", trip_id: "t", date: null }, "2026-12-24", schedules),
    ).toBe(true);
    expect(
      inScope(
        { id: "p", trip_id: "t", schedule_item_id: "s" },
        "2026-12-25",
        schedules,
      ),
    ).toBe(false);
  });
  it("separates daily carry state, packing completion and personal owners", () => {
    const p: Row = {
      id: "p",
      trip_id: "t",
      owner: "USER_A",
      repeat_daily: true,
      checked: true,
    };
    const checks: Row[] = [
      {
        id: "c",
        trip_id: "t",
        packing_item_id: "p",
        owner: "USER_A",
        date: "2026-12-24",
        checked: true,
      },
    ];
    expect(packingChecked(p, "2026-12-24", checks)).toBe(true);
    expect(packingChecked(p, "2026-12-25", checks)).toBe(false);
    expect(
      packingChecked({ ...p, owner: "USER_B" }, "2026-12-24", checks),
    ).toBe(false);
    expect(
      packingChecked({ ...p, repeat_daily: false }, "2026-12-25", checks),
    ).toBe(true);
  });
  it("excludes untimed meals from preview/current schedule computation", () => {
    const rows: Row[] = [
      { id: "untimed", trip_id: "t", start_time: null },
      { id: "bus", trip_id: "t", start_time: "14:30", end_time: "15:15" },
      { id: "train", trip_id: "t", start_time: "15:57", end_time: "17:32" },
    ];
    expect(
      currentSchedule(rows, "2026-12-24", new Date("2026-10-06T00:00:00Z")).next
        ?.id,
    ).toBe("bus");
    const current = currentSchedule(
      rows,
      "2026-12-24",
      new Date("2026-12-24T06:00:00Z"),
    );
    expect(current.current?.id).toBe("bus");
    expect(current.minutes).toBe(57);
  });
  it("uses the most recent current item", () => {
    const rows: Row[] = [
      { id: "old", trip_id: "t", start_time: "08:50", end_time: null },
      { id: "now", trip_id: "t", start_time: "11:10", end_time: "13:20" },
    ];
    expect(
      currentSchedule(rows, "2026-12-22", new Date("2026-12-22T03:00:00Z"))
        .current?.id,
    ).toBe("now");
  });
  it("protects schema writes and URLs and verifies file signatures", () => {
    expect(Object.keys(schemas)).not.toContain("schedule_items");
    expect(Object.keys(schemas)).not.toContain("expenses");
    expect(
      schemas.emergency_contacts.safeParse({
        title: "test",
        category: "OTHER",
        url: "javascript:alert(1)",
        note: "",
      }).success,
    ).toBe(false);
    expect(
      validFile(new TextEncoder().encode("%PDF-test"), "application/pdf"),
    ).toBe(true);
    expect(validFile(new TextEncoder().encode("<script>"), "image/png")).toBe(
      false,
    );
    const url = new URL(mapsUrl("東京駅", "成田空港", "transit", "place"));
    expect(url.searchParams.get("origin")).toBe("成田空港");
    expect(url.searchParams.get("destination_place_id")).toBe("place");
  });
  it("does not leak archived or candidate places into the current map", () => {
    const data: Data = {
      schedule_items: [{ id: "s", trip_id: "t", place_id: "main" }],
      schedule_places: [
        { id: "l", trip_id: "t", schedule_item_id: "s", place_id: "extra" },
        {
          id: "old",
          trip_id: "t",
          schedule_item_id: "s",
          place_id: "retired",
          archived: true,
        },
      ],
      meal_candidates: [
        { id: "c", trip_id: "t", meal_schedule_id: "s", place_id: "candidate" },
      ],
      transport_segments: [
        {
          id: "t",
          trip_id: "t",
          schedule_item_id: "s",
          origin_place_id: "start",
          destination_place_id: "end",
        },
      ],
    };
    expect([...linkedPlaceIds(data, ["s"])].sort()).toEqual([
      "end",
      "extra",
      "main",
      "start",
    ]);
  });
  it("uses the same common preparation identity across schedules", () => {
    const item = seed.packing_items.find(
      (p) => p.plan_key === "pack-phone:USER_A",
    )!;
    expect(
      seed.packing_schedule_items.filter((l) => l.packing_item_id === item.id)
        .length,
    ).toBeGreaterThan(2);
    expect(
      seed.packing_items.find((p) => p.plan_key === "pack-phone:USER_B")?.id,
    ).not.toBe(item.id);
    expect(
      seed.checklist_items.filter((c) => c.scope === "PRE_TRIP"),
    ).toHaveLength(18);
  });
});

describe("latest user itinerary", () => {
  it("keeps the revised meals, moved visits and train times exactly", () => {
    for (const [key, date, start, end] of [
      ["d5-ameyoko", "2026-12-25", "10:30", "11:30"],
      ["d5-lunch", "2026-12-25", "11:40", "12:40"],
      ["d6-kokyo", "2026-12-26", "09:15", "10:15"],
      ["d5-sushiro-lunch", "2026-12-26", "10:45", "11:45"],
      ["d4-tower", "2026-12-26", "13:30", "15:00"],
      ["d5-park", "2026-12-27", "08:10", "09:20"],
      ["d1-skyliner-out", "2026-12-22", "14:42", "15:23"],
      ["d1-shinkansen-out", "2026-12-22", "16:06", "18:06"],
      ["d3-shinkansen-return", "2026-12-24", "15:44", "17:42"],
      ["d6-skyliner-return", "2026-12-27", "10:37", "11:25"],
    ])
      expect(seed.schedule_items.find((s) => s.plan_key === key)).toMatchObject(
        { date, start_time: start, end_time: end },
      );
    expect(
      seed.schedule_items.some((s) =>
        /N.EX|Hayabusa|스시로 시부야/.test(String(s.title)),
      ),
    ).toBe(false);
    expect(
      seed.schedule_items.filter((s) => s.date === "2026-12-25"),
    ).toHaveLength(15);
    expect(
      seed.schedule_items.find((s) => s.plan_key === "d6-flight-return")
        ?.place_id,
    ).toBe(seed.places.find((p) => p.plan_key === "narita-t2")?.id);
  });
});
