-- Preserve existing file attachments while supporting private text attachments.
alter table public.reservation_attachments add column text_content text;
alter table public.reservation_attachments alter column storage_path drop not null;
alter table public.reservation_attachments alter column mime_type drop not null;
alter table public.reservation_attachments alter column size_bytes drop not null;
alter table public.reservation_attachments add constraint attachment_content check (
  (text_content is null and storage_path is not null and mime_type is not null and size_bytes is not null)
  or
  (text_content is not null and length(btrim(text_content)) between 1 and 10000
    and storage_path is null and mime_type is null and size_bytes is null)
);
