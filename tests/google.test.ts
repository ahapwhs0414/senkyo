import { describe, expect, it } from "vitest";
import { googleErrorMessage } from "../src/lib/google";
describe("Google API errors", () => {
  it("distinguishes website restrictions from API activation", () => {
    expect(
      googleErrorMessage({
        error: { details: [{ reason: "API_KEY_HTTP_REFERRER_BLOCKED" }] },
      }),
    ).toContain("웹사이트 제한");
    expect(
      googleErrorMessage({
        error: { details: [{ reason: "SERVICE_DISABLED" }] },
      }),
    ).toContain("Places API (New)");
  });
  it("never returns raw provider messages or unknown fields", () => {
    expect(
      googleErrorMessage({
        error: {
          message: "private provider diagnostic",
          details: [{ reason: "UNKNOWN" }],
        },
      }),
    ).not.toContain("private provider diagnostic");
    expect(googleErrorMessage(null)).toContain("다시 시도");
  });
});

describe("deployment Google diagnostics", () => {
  it("identifies invalid keys even when Google omits ErrorInfo details", async () => {
    const { googleErrorInfo } = await import("../src/lib/google");
    expect(
      googleErrorInfo({
        error: {
          status: "INVALID_ARGUMENT",
          message: "API key not valid. Please pass a valid API key.",
        },
      }).code,
    ).toBe("API_KEY_INVALID");
    expect(
      googleErrorInfo({ error: { status: "PERMISSION_DENIED" } }).message,
    ).toContain("서버용 키");
    expect(
      googleErrorInfo({ error: { status: "RESOURCE_EXHAUSTED" } }).message,
    ).toContain("요청 한도");
  });
});

import { afterEach, vi } from "vitest";
import { lookupPlanPlace, planSearchQuery } from "../src/lib/google-lookup";
afterEach(() => vi.unstubAllGlobals());
describe("stored plan location lookup", () => {
  it("uses the source branch query when Google ID is missing", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          places: [
            {
              id: "real-id",
              displayName: { text: "Google result" },
              location: { latitude: 35, longitude: 139 },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    const result = await lookupPlanPlace("server-secret", {
      maps_url:
        "https://www.google.com/maps/search/?api=1&query=スシロー+渋谷駅前店",
    });
    expect(result.id).toBe("real-id");
    expect(fetcher.mock.calls[0][0]).toContain("places:searchText");
    const options = fetcher.mock.calls[0][1];
    expect(JSON.parse(options.body).textQuery).toBe("スシロー 渋谷駅前店");
    expect(options.cache).toBe("no-store");
    expect(options.headers["X-Goog-FieldMask"]).not.toContain("rating");
  });
  it("rejects non-plan URLs and empty results without inventing coordinates", async () => {
    expect(() =>
      planSearchQuery("https://evil.invalid/?query=somewhere"),
    ).toThrow();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ places: [] })),
    );
    await expect(
      lookupPlanPlace("key", {
        maps_url: "https://www.google.com/maps/search/?query=東京駅",
      }),
    ).rejects.toThrow("찾지 못했습니다");
  });
  it("keeps verified IDs and translates provider failures without leaking raw messages", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          {
            error: {
              status: "PERMISSION_DENIED",
              message: "private diagnostic",
            },
          },
          { status: 403 },
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(
      lookupPlanPlace("key", { google_place_id: "known-id" }),
    ).rejects.toThrow("접근 권한");
    expect(fetcher.mock.calls[0][0]).toContain("places/known-id");
  });
});
