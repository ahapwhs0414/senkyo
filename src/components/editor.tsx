"use client";
import { useState } from "react";
import { z } from "zod";
import { Sheet } from "./sheet";
import { forms, labels, words } from "@/lib/forms";
import {
  schemas,
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
  inline = false,
}: {
  table: Table;
  row: Row;
  data: Data;
  members: Member[];
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  inline?: boolean;
}) {
  const preparation = table === "packing_items" || table === "checklist_items";
  const [selectedDate, setSelectedDate] = useState(String(row.date ?? ""));
  const [scheduleId, setScheduleId] = useState(
    String(row.schedule_item_id ?? ""),
  );
  const [scopeValue, setScopeValue] = useState(String(row.scope ?? "PRE_TRIP"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const content = (
    <>
      {inline && (
        <div className="row between">
          <h2 id="editor-title">
            {labels[table]} {row.id ? "수정" : "추가"}
          </h2>
          <button
            type="button"
            aria-label="작성 취소"
            disabled={saving}
            onClick={onClose}
          >
            뒤로
          </button>
        </div>
      )}
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError("");
          try {
            const form = new FormData(e.currentTarget);
            const values: Record<string, unknown> = { ...row };
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
            if (table === "checklist_items") {
              // Date and schedule choices determine the scope; no invisible
              // PRE_TRIP value can silently hide an item from its selected day.
              values.scope = scheduleId
                ? "SCHEDULE"
                : selectedDate
                  ? "DATE"
                  : scopeValue === "PRE_TRIP"
                    ? "PRE_TRIP"
                    : "TRIP";
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
                      ? data.schedule_items.filter(
                          (s) => !s.archived && s.type === "MEAL",
                        )
                      : data[field.ref]?.filter(
                          (r) =>
                            !r.archived &&
                            (!preparation ||
                              field.ref !== "schedule_items" ||
                              (selectedDate && r.date === selectedDate)),
                        )) ?? []
                  ).map((r) => ({
                    id: r.id,
                    title: `${r.date ?? ""} ${r.title ?? r.custom_name ?? r.id}`,
                  }))
                : null;
          return (
            <label
              key={field.key}
              className={
                table === "packing_items" && field.key === "date"
                  ? "optional-link-start"
                  : undefined
              }
            >
              {field.label}
              {field.required ? " *" : ""}
              {preparation && field.key === "date" ? (
                <input
                  name="date"
                  type="date"
                  value={selectedDate}
                  min="2026-12-22"
                  max="2026-12-27"
                  onChange={(e) => {
                    const next = e.target.value;
                    setSelectedDate(next);
                    if (
                      !data.schedule_items.some(
                        (s) =>
                          s.id === scheduleId && !s.archived && s.date === next,
                      )
                    )
                      setScheduleId("");
                    setScopeValue(next ? "DATE" : "TRIP");
                  }}
                />
              ) : preparation && field.key === "schedule_item_id" ? (
                <select
                  name="schedule_item_id"
                  value={scheduleId}
                  disabled={!selectedDate}
                  onChange={(e) => {
                    setScheduleId(e.target.value);
                    setScopeValue(
                      e.target.value
                        ? "SCHEDULE"
                        : selectedDate
                          ? "DATE"
                          : "TRIP",
                    );
                  }}
                >
                  <option value="">
                    {selectedDate ? "연결 안 함" : "날짜를 먼저 선택하세요"}
                  </option>
                  {options?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              ) : table === "checklist_items" && field.key === "scope" ? (
                <select
                  name="scope"
                  value={scopeValue}
                  onChange={(e) => {
                    setScopeValue(e.target.value);
                    if (["PRE_TRIP", "TRIP"].includes(e.target.value)) {
                      setSelectedDate("");
                      setScheduleId("");
                    }
                  }}
                >
                  {(selectedDate
                    ? [scheduleId ? "SCHEDULE" : "DATE", "PRE_TRIP", "TRIP"]
                    : ["PRE_TRIP", "TRIP"]
                  ).map((v) => (
                    <option key={v} value={v}>
                      {words[v]}
                    </option>
                  ))}
                </select>
              ) : field.options ? (
                <select
                  name={field.key}
                  defaultValue={String(
                    value ?? field.default ?? field.options[0],
                  )}
                >
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {["owner", "buyer"].includes(field.key)
                        ? (members.find((m) => m.slot === o)?.display_name ??
                          words[o] ??
                          o)
                        : (words[o] ?? o)}
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
        <p className="muted">
          {preparation
            ? "날짜와 일정 연결은 선택 사항입니다. 날짜를 바꾸면 다른 날짜의 일정 연결은 해제됩니다."
            : "시간은 일본 현지시간, 금액은 정수 엔입니다."}
        </p>
        <button className="primary" disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </form>
    </>
  );
  return inline ? (
    <section>{content}</section>
  ) : (
    <Sheet
      title={`${labels[table]} ${row.id ? "수정" : "추가"}`}
      close={onClose}
    >
      {content}
    </Sheet>
  );
}
