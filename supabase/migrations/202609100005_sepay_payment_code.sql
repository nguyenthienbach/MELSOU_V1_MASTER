-- SePay Test Mode extracts payment references matching MEL followed by exactly
-- eight digits. Keep the human-facing order_code unchanged and assign this
-- provider-compatible payment_code only when a new order is inserted.
create table if not exists public.melsou_payment_code_sequences (
  yymm text primary key check (yymm ~ '^[0-9]{4}$'),
  next_value integer not null default 1 check (next_value between 1 and 10000)
);

revoke all on table public.melsou_payment_code_sequences from public, anon, authenticated;

create or replace function public.melsou_assign_sepay_payment_code()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_yymm text := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMM');
  v_sequence integer;
begin
  insert into public.melsou_payment_code_sequences(yymm, next_value)
  values (v_yymm, 2)
  on conflict (yymm) do update
    set next_value = public.melsou_payment_code_sequences.next_value + 1
  where public.melsou_payment_code_sequences.next_value <= 9999
  returning next_value - 1 into v_sequence;

  if v_sequence is null or v_sequence not between 1 and 9999 then
    raise exception 'PAYMENT_CODE_SEQUENCE_EXHAUSTED';
  end if;

  new.payment_code := 'MEL' || v_yymm || lpad(v_sequence::text, 4, '0');
  return new;
end $$;

drop trigger if exists assign_sepay_payment_code on public.orders;
create trigger assign_sepay_payment_code
before insert on public.orders
for each row execute procedure public.melsou_assign_sepay_payment_code();

revoke all on function public.melsou_assign_sepay_payment_code() from public, anon, authenticated;
