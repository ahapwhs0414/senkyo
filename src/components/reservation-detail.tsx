"use client";
import { useEffect, useRef, useState } from "react";
import type { Data, Row } from "@/lib/domain";
import { forms, words } from "@/lib/forms";
import { ReservationFiles } from "./reservation-files";

export function ReservationDetail({
  reservation,
  data,
  writable,
  close,
  edit,
  refresh,
}: {
  reservation: Row;
  data: Data;
  writable: boolean;
  close: () => void;
  edit: () => void;
  refresh: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={close}
      aria-labelledby="reservation-detail-title"
    >
      <div className="row between">
        <h2 id="reservation-detail-title">{String(reservation.title)}</h2>
        <button onClick={close}>닫기</button>
      </div>
      {forms.reservations
        .filter(
          (f) =>
            f.key !== "title" &&
            reservation[f.key] != null &&
            reservation[f.key] !== "",
        )
        .map((f) => {
          const value = String(reservation[f.key]);
          if (f.type === "url")
            return (
              <p key={f.key}>
                <a
                  className="link"
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {f.label} ↗
                </a>
              </p>
            );
          return (
            <p className="attachment-text" key={f.key}>
              {f.label}:{" "}
              {f.type === "datetime"
                ? new Date(value).toLocaleString("ko-KR", {
                    timeZone: "Asia/Tokyo",
                  })
                : (words[value] ?? value)}
            </p>
          );
        })}
      <button
        disabled={!reservation.reservation_number}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              String(reservation.reservation_number),
            );
            setError("");
          } catch {
            setError("예약번호를 복사하지 못했습니다");
          }
        }}
      >
        예약번호 복사
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <ReservationFiles
        reservation={reservation}
        attachments={data.reservation_attachments.filter(
          (a) => a.reservation_id === reservation.id,
        )}
        writable={writable}
        onRefresh={refresh}
      />
      <button className="primary" disabled={!writable} onClick={edit}>
        예약 수정
      </button>
    </dialog>
  );
}
