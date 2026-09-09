-- The Worker is the only public write surface and authenticates to PostgREST as
-- service_role. RLS/public client permissions remain unchanged.
grant usage on schema public to service_role;
grant select, insert, update, delete on table
  public.profiles, public.projects, public.project_assets, public.pricing_versions,
  public.production_snapshots, public.orders, public.payment_events, public.audit_logs,
  public.order_sequences, public.print_profiles, public.render_jobs, public.shipments,
  public.archive_jobs, public.project_duo_invites, public.project_duo_members,
  public.reporting_outbox, public.project_slot_locks, public.blog_posts, public.cart_items,
  public.carts, public.customer_addresses, public.guest_claimed_projects,
  public.guest_sessions, public.order_events, public.order_lines, public.payment_attempts,
  public.project_checkpoints, public.quotes, public.template_versions, public.app_users,
  public.auth_email_challenges, public.native_credentials, public.native_sessions,
  public.order_voice_selections, public.voice_assets, public.voice_cleanup_jobs
to service_role;
