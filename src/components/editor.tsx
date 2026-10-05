"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { forms, labels, words } from "@/lib/forms";
import {
  schemas,
  splitAmount,
  type Table,
  type Row,
  type Data,
  type Member,
} from "@/lib/domain";
export function Editor({
  table,
  row,
  data,
  members,
  onSave,
  onClose,
}: {
  table: Table;
  row: Row;
  data: Data;
  members: Member[];
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="editor-title"
      onCancel={(e) => {
        if (saving) e.preventDefault();
        else onClose();
      }}
    >
      <div className="row between">
        <h2 id="editor-title">
          {labels[table]} {row.id ? "수정" : "추가"}
        </h2>
        <button
          type="button"
          aria-label="닫기"
          disabled={saving}
          onClick={onClose}
        >
          닫기
        </button>
      </div>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError("");
          try {
            const form = new FormData(e.currentTarget);
            const values: Record<string, unknown> = {};
            for (const field of forms[table]) {
              const value = form.get(field.key);
              values[field.key] =
                field.type === "checkbox"
                  ? value === "on"
                  : field.type === "number"
                    ? value === ""
                      ? null
                      : Number(value)
                    : field.type === "datetime"
                      ? value
                        ? `${value}:00+09:00`
                        : null
                      : ["date", "time"].includes(field.type ?? "") || field.ref
                        ? value || null
                        : (value ?? "");
            }
            if (table === "schedule_items")
              values.sort_order = Number(row.sort_order ?? 0);
            if (table === "expenses") {
              const [a, b] = splitAmount(
                Number(values.amount),
                String(values.split_mode),
                Number(values.share_a_yen),
              );
              values.share_a_yen = a;
              values.share_b_yen = b;
            }
            const parsed = schemas[table].parse(values);
            await onSave(parsed);
            onClose();
          } catch (e) {
            setError(
              e instanceof z.ZodError
                ? e.issues.map((i) => i.message).join(" · ")
                : e instanceof Error
                  ? e.message
                  : "저장에 실패했습니다",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        {forms[table].map((field) => {
          let value = row[field.key];
          if (field.type === "datetime" && value)
            value = new Intl.DateTimeFormat("sv-SE", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
              .format(new Date(String(value)))
              .replace(" ", "T");
          const options =
            field.ref === "members"
              ? members.map((m) => ({ id: m.user_id, title: m.display_name }))
              : field.ref
                ? (
                    (field.ref === "meals"
                      ? data.schedule_items.filter((s) => s.type === "MEAL")
                      : data[field.ref]) ?? []
                  ).map((r) => ({
                    id: r.id,
                    title: `${r.date ?? ""} ${r.title ?? r.custom_name ?? r.id}`,
                  }))
                : null;
          return (
            <label key={field.key}>
              {field.label}
              {field.required ? " *" : ""}
              {field.options ? (
                <select
                  name={field.key}
                  defaultValue={String(
                    value ?? field.default ?? field.options[0],
                  )}
                >
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {words[o] ?? o}
                    </option>
                  ))}
                </select>
              ) : options ? (
                <select
                  name={field.key}
                  defaultValue={String(value ?? "")}
                  required={field.required}
                >
                  <option value="">연결 안 함</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.key}
                  defaultValue={String(value ?? "")}
                  maxLength={2000}
                />
              ) : field.type === "checkbox" ? (
                <input
                  name={field.key}
                  type="checkbox"
                  defaultChecked={Boolean(value)}
                  style={{ width: 24 }}
                />
              ) : (
                <input
                  name={field.key}
                  type={
                    field.type === "datetime"
                      ? "datetime-local"
                      : (field.type ?? "text")
                  }
                  defaultValue={String(value ?? "")}
                  required={field.required}
                  min={
                    field.type === "number"
                      ? 0
                      : field.type === "date"
                        ? "2026-12-22"
                        : undefined
                  }
                  max={
                    field.type === "date"
                      ? "2026-12-27"
                      : field.type === "number"
                        ? 100000000
                        : undefined
                  }
                  step={field.type === "number" ? 1 : undefined}
                  maxLength={2000}
                />
              )}
            </label>
          );
        })}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <p className="muted">시간은 일본 현지시간, 금액은 정수 엔입니다.</p>
        <button className="primary" disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </form>
    </dialog>
  );
}
