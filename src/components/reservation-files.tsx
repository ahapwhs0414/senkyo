"use client";
import { useState } from "react";
import type { Row } from "@/lib/domain";
export function ReservationFiles({
  reservation,
  attachments,
  writable,
  onRefresh,
}: {
  reservation: Row;
  attachments: Row[];
  writable: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="stack">
      <h3>예약 첨부</h3>
      {attachments.map((a) => (
        <button
          key={a.id}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            const tab = window.open("about:blank", "_blank");
            if (tab) tab.opener = null;
            try {
              const response = await fetch(`/api/attachments?id=${a.id}`, {
                cache: "no-store",
              });
              const result: { url?: string; error?: string } =
                await response.json();
              if (!response.ok || !result.url) throw new Error(result.error);
              if (tab) tab.location.href = result.url;
              else
                throw new Error(
                  "팝업이 차단되었습니다. 팝업 허용 후 다시 열어주세요",
                );
            } catch (e) {
              tab?.close();
              setError(
                e instanceof Error ? e.message : "첨부를 열지 못했습니다",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {String(a.file_name)} ↗
        </button>
      ))}
      {writable &&
        attachments.map((a) => (
          <button
            key={`delete-${a.id}`}
            disabled={busy}
            onClick={async () => {
              if (!confirm(`${a.file_name} 첨부를 삭제할까요?`)) return;
              setBusy(true);
              setError("");
              try {
                const response = await fetch("/api/attachments", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: a.id }),
                });
                const result: { error?: string } = await response.json();
                if (!response.ok) throw new Error(result.error);
                await onRefresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "첨부 삭제 실패");
              } finally {
                setBusy(false);
              }
            }}
          >
            {String(a.file_name)} 삭제
          </button>
        ))}
      {!attachments.length && (
        <p className="muted">
          첨부된 확인서가 없습니다. PDF 또는 이미지를 등록해보세요.
        </p>
      )}
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const formNode = e.currentTarget;
          setBusy(true);
          setError("");
          try {
            const form = new FormData(formNode);
            form.set("reservation_id", reservation.id);
            const response = await fetch("/api/attachments", {
              method: "POST",
              body: form,
            });
            const result: { error?: string } = await response.json();
            if (!response.ok) throw new Error(result.error);
            await onRefresh();
            formNode.reset();
          } catch (e) {
            setError(e instanceof Error ? e.message : "첨부 업로드 실패");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          확인서 파일 (최대 10MB)
          <input
            name="file"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            required
            disabled={!writable || busy}
          />
        </label>
        <button disabled={!writable || busy}>
          {busy ? "처리 중…" : "첨부 업로드"}
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
