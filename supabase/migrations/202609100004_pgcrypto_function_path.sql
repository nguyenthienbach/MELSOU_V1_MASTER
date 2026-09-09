-- Supabase installs pgcrypto in the extensions schema. Keep the security-definer
-- function path explicit so checkout can hash its tracking verifier reliably.
alter function public.melsou_create_order_v2(uuid,uuid,text,jsonb,jsonb,jsonb,text,text)
  set search_path = public, extensions;
