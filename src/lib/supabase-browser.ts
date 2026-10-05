"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./supabase-config";
export function browserClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase 환경변수를 설정해주세요");
  return createBrowserClient(
    config.url,
    config.key,
  );
}
