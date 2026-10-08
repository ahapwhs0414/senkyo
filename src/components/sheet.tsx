"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Sheet({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const position = { x: window.scrollX, y: window.scrollY };
    const node = dialog.current;
    document.body.style.overflow = "hidden";
    node?.showModal();
    return () => {
      node?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
      // Summary cards can shrink after checking items; restore the caller's
      // position after native focus restoration and the updated layout.
      window.scrollTo(position.x, position.y);
      requestAnimationFrame(() => window.scrollTo(position.x, position.y));
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          (e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom)
        )
          close();
      }}
    >
      <header className="sheet-header">
        <h2>{title}</h2>
        <button aria-label="닫기" onClick={close}>
          <X size={20} />
        </button>
      </header>
      <div className="sheet-body">{children}</div>
    </dialog>
  );
}
