import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "둘이, 일본 · 여행 플래너",
  description: "2026 겨울, 두 사람의 일본 여행",
  manifest: "/manifest.webmanifest",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
