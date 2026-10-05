import { afterEach, describe, expect, it, vi } from "vitest";
import { supabaseConfig } from "../src/lib/supabase-config";

afterEach(() => vi.unstubAllEnvs());

describe("Supabase public configuration", () => {
  it("uses the publishable key when both key types are present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-fixture");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-fixture");
    expect(supabaseConfig()?.key).toBe("publishable-fixture");
  });

  it("supports projects still using a legacy anon key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-fixture");
    expect(supabaseConfig()?.key).toBe("anon-fixture");
  });

  it("requires a URL and a public key, even when a service key exists", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-fixture");
    expect(supabaseConfig()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-fixture");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(supabaseConfig()).toBeNull();
  });
});
