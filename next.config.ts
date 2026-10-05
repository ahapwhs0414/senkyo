import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.SENKYO_TEST_BUILD === "1" ? ".next-e2e" : ".next",
  devIndicators: false,
};
export default config;
