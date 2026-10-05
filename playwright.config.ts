import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 320, height: 740 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/e2e-server.mjs",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
