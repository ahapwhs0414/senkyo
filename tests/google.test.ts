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
