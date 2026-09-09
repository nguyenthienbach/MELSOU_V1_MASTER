-- Product Owner-approved FB90 package pricing. Existing orders retain their
-- immutable version-1 price snapshots; only new quotes/orders use version 2.
begin;

update public.pricing_versions set active = false where active = true;

insert into public.pricing_versions(version, rules, active)
values (
  2,
  '{"currency":"VND","packages":{"MELODY":119000,"VOICE":159000,"SIGNATURE":199000},"sizes":{"A5_PORTRAIT":0,"SQUARE":20000,"A6":-20000,"A5_LANDSCAPE":10000},"pages":{"12":0,"16":30000,"24":60000},"twin_second_copy_ratio":0.75,"shipping_per_shipment":30000}'::jsonb,
  true
);

commit;
