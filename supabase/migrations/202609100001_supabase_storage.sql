-- Private canonical object bucket used by the Worker through the service role.
-- No public/browser storage policies are created intentionally.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'melsou-assets', 'melsou-assets', false, 8388608,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
