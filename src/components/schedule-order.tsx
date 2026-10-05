"use client";
import { useEffect, useRef, useState } from "react";
import type { Row } from "@/lib/domain";
export function ScheduleOrder({
  items,
  date,
  close,
  refresh,
}: {
  items: Row[];
  date: string;
  close: () => void;
  refresh: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dragged = useRef<string | null>(null);
  const [rows, setRows] = useState(items);
  const [active, setActive] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function move(id: string, target: string) {
    setRows((previous) => {
      const from = previous.findIndex((r) => r.id === id),
        to = previous.findIndex((r) => r.id === target);
      if (from < 0 || to < 0 || from === to) return previous;
      const next = [...previous];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="order-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else close();
      }}
    >
      <div className="row between">
        <h2 id="order-title">일정 순서 편집</h2>
        <button disabled={busy} onClick={close}>
          닫기
        </button>
      </div>
      <p>손잡이를 끌어 원하는 위치로 옮긴 뒤 저장하세요.</p>
      <ol className="stack" style={{ padding: 0, listStyle: "none" }}>
        {rows.map((r, index) => (
          <li
            className="card row"
            key={r.id}
            data-order-id={r.id}
            style={{
              outline: active === r.id ? "2px solid var(--accent)" : undefined,
            }}
          >
            <button
              aria-label={`${r.title} 이동 손잡이`}
              disabled={busy}
              style={{ touchAction: "none", cursor: "grab", flexShrink: 0 }}
              onPointerDown={(e) => {
                dragged.current = r.id;
                setActive(r.id);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!dragged.current) return;
                const target = document
                  .elementFromPoint(e.clientX, e.clientY)
                  ?.closest<HTMLElement>("[data-order-id]")?.dataset.orderId;
                if (target) move(dragged.current, target);
                const bounds = dialog.current?.getBoundingClientRect();
                if (bounds && e.clientY > bounds.bottom - 50)
                  dialog.current?.scrollBy(0, 12);
                else if (bounds && e.clientY < bounds.top + 50)
                  dialog.current?.scrollBy(0, -12);
              }}
              onPointerUp={() => {
                dragged.current = null;
                setActive(null);
              }}
              onPointerCancel={() => {
                dragged.current = null;
                setActive(null);
              }}
            >
              ☰
            </button>
            <span style={{ flex: 1 }}>{String(r.title)}</span>
            <button
              aria-label={`${r.title} 위로`}
              disabled={busy || index === 0}
              onClick={() => move(r.id, rows[index - 1].id)}
            >
              ↑
            </button>
            <button
              aria-label={`${r.title} 아래로`}
              disabled={busy || index === rows.length - 1}
              onClick={() => move(r.id, rows[index + 1].id)}
            >
              ↓
            </button>
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button
        className="primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/schedule-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date,
                items: rows.map((r) => ({
                  id: r.id,
                  updated_at: r.updated_at,
                })),
              }),
            });
            const d: { error?: string } = await r.json();
            if (!r.ok) throw Error(d.error);
            await refresh();
            close();
          } catch (e) {
            setError(e instanceof Error ? e.message : "저장 실패");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "저장 중…" : "순서 저장"}
      </button>
    </dialog>
  );
}
