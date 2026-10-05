import { describe, it, expect } from "vitest";
import {
  tokyoDate,
  splitAmount,
  settlement,
  mapsUrl,
  inScope,
  currentSchedule,
  schemas,
  validFile,
} from "../src/lib/domain";
import seed from "../src/lib/seed.json";
describe("travel invariants", () => {
  it("uses Japanese date across UTC midnight", () => {
    expect(tokyoDate(new Date("2026-12-21T15:01:00Z"))).toBe("2026-12-22");
  });
  it("preserves every source schedule and all six days", () => {
    expect(seed.trip_days).toHaveLength(6);
    expect(seed.schedule_items).toHaveLength(113);
    expect(
      seed.reservations.every(
        (r) =>
          r.reservation_number === null &&
          r.confirmation_url === null &&
          r.seat_number === null,
      ),
    ).toBe(true);
    expect(
      seed.schedule_items.find((s) => s.description.includes("Hayabusa 26"))
        ?.start_time,
    ).toBe("15:57");
  });
  it("keeps integer yen for odd equal splits and custom splits", () => {
    expect(splitAmount(101, "EQUAL")).toEqual([51, 50]);
    expect(splitAmount(100, "CUSTOM", 70)).toEqual([70, 30]);
    expect(() => splitAmount(100, "CUSTOM", 101)).toThrow();
    expect(() => splitAmount(1.5, "EQUAL")).toThrow();
    expect(splitAmount(100, "USER_A_ONLY")).toEqual([100, 0]);
    expect(splitAmount(100, "USER_B_ONLY")).toEqual([0, 100]);
  });
  it("settles both payers and custom burdens", () => {
    const result = settlement(
      [
        {
          id: "1",
          trip_id: "t",
          payer_user_id: "a",
          amount: 100,
          share_a_yen: 70,
          share_b_yen: 30,
        },
        {
          id: "2",
          trip_id: "t",
          payer_user_id: "b",
          amount: 50,
          share_a_yen: 25,
          share_b_yen: 25,
        },
      ],
      [
        { user_id: "a", slot: "USER_A", role: "EDITOR", display_name: "A" },
        { user_id: "b", slot: "USER_B", role: "EDITOR", display_name: "B" },
      ],
    );
    expect(result.map((r) => r.balance)).toEqual([5, -5]);
  });
  it("encodes Google Maps origins and destination Place ID", () => {
    const url = new URL(mapsUrl("東京駅", "成田空港", "transit", "place"));
    expect(url.searchParams.get("origin")).toBe("成田空港");
    expect(url.searchParams.get("destination_place_id")).toBe("place");
  });
  it("aggregates trip, date and schedule scopes", () => {
    const schedules = [{ id: "s", trip_id: "t", date: "2026-12-24" }];
    expect(
      inScope({ id: "p", trip_id: "t", date: null }, "2026-12-24", schedules),
    ).toBe(true);
    expect(
      inScope(
        { id: "p", trip_id: "t", date: null, schedule_item_id: "s" },
        "2026-12-25",
        schedules,
      ),
    ).toBe(false);
  });
  it("computes current and next using Tokyo time", () => {
    const rows = [
      {
        id: "1",
        trip_id: "t",
        start_time: "14:30",
        end_time: "15:15",
        status: "planned",
      },
      {
        id: "2",
        trip_id: "t",
        start_time: "15:57",
        end_time: "17:32",
        status: "planned",
      },
    ];
    const result = currentSchedule(
      rows,
      "2026-12-24",
      new Date("2026-12-24T06:00:00Z"),
    );
    expect(result.current?.id).toBe("1");
    expect(result.minutes).toBe(57);
  });
  it("rejects unsafe URLs and fractional yen", () => {
    expect(
      schemas.emergency_contacts.safeParse({
        title: "test",
        category: "OTHER",
        url: "javascript:alert(1)",
        note: "",
      }).success,
    ).toBe(false);
    expect(
      schemas.budget_items.safeParse({
        title: "x",
        category: "x",
        estimated_amount_yen: 1.1,
        note: "",
      }).success,
    ).toBe(false);
  });
  it("checks attachment signatures, not just declared MIME", () => {
    expect(
      validFile(new TextEncoder().encode("%PDF-test"), "application/pdf"),
    ).toBe(true);
    expect(validFile(new TextEncoder().encode("<script>"), "image/png")).toBe(
      false,
    );
  });
});

describe("time and seed edge cases", () => {
  it("prefers the most recent current item over an earlier open-ended arrival", () => {
    const rows = [
      {
        id: "old",
        trip_id: "t",
        start_time: "08:50:00",
        end_time: null,
        status: "planned",
      },
      {
        id: "now",
        trip_id: "t",
        start_time: "11:10:00",
        end_time: "13:20:00",
        status: "planned",
      },
    ];
    expect(
      currentSchedule(rows, "2026-12-22", new Date("2026-12-22T03:00:00Z"))
        .current?.id,
    ).toBe("now");
    expect(
      currentSchedule(rows, "2026-12-22", new Date("2026-12-22T04:20:00Z"))
        .current?.id,
    ).not.toBe("now");
  });
  it("links APA checkout and Sakan checkin to their own hotel", () => {
    const apa = seed.reservations.find(
      (r) => r.title === "APA 호텔 TKP 센다이 에키기타",
    )!;
    const sakan = seed.reservations.find((r) => r.title === "사칸")!;
    const checkout = seed.schedule_items.find(
      (s) => s.date === "2026-12-23" && s.title.includes("체크아웃"),
    )!;
    expect(
      seed.reservation_schedule_items.some(
        (l) =>
          l.reservation_id === apa.id && l.schedule_item_id === checkout.id,
      ),
    ).toBe(true);
    expect(
      seed.reservation_schedule_items.some(
        (l) =>
          l.reservation_id === sakan.id && l.schedule_item_id === checkout.id,
      ),
    ).toBe(false);
  });
  it("airport check-in belongs to the flight reservation, not the hotel", () => {
    const checkin = seed.schedule_items.find(
      (s) => s.title === "체크인 및 출국수속",
    )!;
    expect(checkin.type).toBe("OTHER");
    const linked = seed.reservation_schedule_items
      .filter((l) => l.schedule_item_id === checkin.id)
      .map(
        (l) => seed.reservations.find((r) => r.id === l.reservation_id)?.type,
      );
    expect(linked).toEqual(["FLIGHT"]);
  });
});

describe("map schedule connections", () => {
  it("includes all linked places only for selected schedules", async () => {
    const { linkedPlaceIds } = await import("../src/lib/domain");
    const data = {
      schedule_items: [
        { id: "s1", trip_id: "t", place_id: "main" },
        { id: "s2", trip_id: "t", place_id: "other-day" },
      ],
      schedule_places: [
        { id: "l", trip_id: "t", schedule_item_id: "s1", place_id: "extra" },
      ],
      meal_candidates: [
        { id: "c", trip_id: "t", meal_schedule_id: "s1", place_id: "meal" },
      ],
      transport_segments: [
        {
          id: "x",
          trip_id: "t",
          schedule_item_id: "s1",
          origin_place_id: "start",
          destination_place_id: "end",
        },
      ],
    };
    expect([...linkedPlaceIds(data, ["s1"])].sort()).toEqual([
      "end",
      "extra",
      "main",
      "meal",
      "start",
    ]);
  });
});
