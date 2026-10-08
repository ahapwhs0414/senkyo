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
        <section className="attachment-row" key={a.id}>
          <h4>{String(a.file_name)}</h4>
          {a.description && (
            <p className="attachment-text">{String(a.description)}</p>
          )}
          {a.text_content != null && (
            <p className="attachment-text">{String(a.text_content)}</p>
          )}
          {a.storage_path && (
            <>
              <small className="muted">
                {String(a.mime_type)} · {Math.ceil(Number(a.size_bytes) / 1024)}{" "}
                KB
              </small>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  const tab = window.open("about:blank", "_blank");
                  if (tab) tab.opener = null;
                  try {
                    const response = await fetch(
                      `/api/attachments?id=${a.id}`,
                      { cache: "no-store" },
                    );
                    const result = await response.json();
                    if (!response.ok || !result.url)
                      throw new Error(result.error);
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
                파일 보기·다운로드 ↗
              </button>
            </>
          )}
        </section>
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
          첨부된 확인서가 없습니다. 파일 또는 텍스트를 등록해보세요.
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
            if (!String(form.get("text_content") ?? "").trim())
              form.delete("text_content");
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
          파일 제목
          <input name="title" maxLength={200} disabled={!writable || busy} />
        </label>
        <label>
          파일 설명
          <textarea
            name="description"
            maxLength={2000}
            disabled={!writable || busy}
          />
        </label>
        <label>
          파일과 함께 저장할 텍스트
          <textarea
            name="text_content"
            maxLength={10000}
            disabled={!writable || busy}
          />
        </label>
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
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const node = e.currentTarget;
          setBusy(true);
          setError("");
          try {
            const form = new FormData(node);
            form.set("reservation_id", reservation.id);
            if (!String(form.get("text_content") ?? "").trim())
              form.delete("text_content");
            const response = await fetch("/api/attachments", {
              method: "POST",
              body: form,
            });
            const result: { error?: string } = await response.json();
            if (!response.ok) throw new Error(result.error);
            await onRefresh();
            node.reset();
          } catch (e) {
            setError(e instanceof Error ? e.message : "텍스트 저장 실패");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          텍스트 제목
          <input
            name="title"
            required
            maxLength={200}
            disabled={!writable || busy}
          />
        </label>
        <label>
          첨부 텍스트
          <textarea
            name="text_content"
            required
            maxLength={10000}
            rows={5}
            disabled={!writable || busy}
            placeholder="예약 안내, 확인 메시지 등을 입력하세요"
          />
        </label>
        <button disabled={!writable || busy}>
          {busy ? "처리 중…" : "텍스트 첨부 저장"}
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
