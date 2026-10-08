"use client";
import { useState } from "react";
import { Snowflake } from "lucide-react";
import { useRouter } from "next/navigation";
export function Login({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  return (
    <main className="login">
      <div className="card">
        <span className="winter-badge">
          <Snowflake size={18} /> OUR WINTER JOURNEY
        </span>
        <span className="eyebrow">Sendai · Akiu · Tokyo</span>
        <h1>둘이, 일본</h1>
        <p className="muted">
          12월 22일부터 27일까지
          <br />
          함께 준비하는 우리의 겨울 여행.
        </p>
        {!configured && (
          <p className="notice">
            아직 서비스 연결 전입니다. Supabase 설정 후 사전 등록된 두 계정으로
            로그인할 수 있습니다.
          </p>
        )}
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError("");
            const form = new FormData(e.currentTarget);
            try {
              const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.fromEntries(form)),
              });
              const result: { error?: string } = await response.json();
              if (!response.ok) throw new Error(result.error);
              router.replace("/");
              router.refresh();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "로그인에 실패했습니다",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <label>
            아이디
            <input
              name="username"
              autoComplete="username"
              required
              maxLength={32}
            />
          </label>
          <label>
            비밀번호
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="primary" disabled={saving || !configured}>
            {saving ? "로그인 중…" : "로그인"}
          </button>
        </form>
        <p className="muted">두 사람만을 위한 공간 · 회원가입 없음</p>
      </div>
    </main>
  );
}
