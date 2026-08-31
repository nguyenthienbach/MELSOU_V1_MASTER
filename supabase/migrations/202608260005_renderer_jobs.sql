-- The renderer receives only immutable snapshots and advances state through explicit, auditable RPCs.
create or replace function public.melsou_claim_render_job()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_job public.render_jobs;
begin
  select * into v_job from public.render_jobs where status in ('QUEUED','FAILED') order by created_at asc for update skip locked limit 1;
  if not found then return null; end if;
  update public.render_jobs set status='RUNNING',attempts=attempts+1,error_code=null,updated_at=now() where id=v_job.id returning * into v_job;
  update public.orders set status='RENDERING',updated_at=now() where id=v_job.order_id and status in ('PAID','RENDER_FAILED');
  insert into public.audit_logs(action,resource_type,resource_id,after_state) values('RENDER_STARTED','order',v_job.order_id::text,jsonb_build_object('render_job_id',v_job.id,'attempt',v_job.attempts));
  return jsonb_build_object('id',v_job.id,'order_id',v_job.order_id,'attempts',v_job.attempts);
end $$;
revoke all on function public.melsou_claim_render_job() from public;

create or replace function public.melsou_fail_render(p_render_job_id uuid, p_error_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_job public.render_jobs;
begin
  select * into v_job from public.render_jobs where id=p_render_job_id for update;
  if not found then raise exception 'RENDER_JOB_NOT_FOUND'; end if;
  if v_job.status='SUCCESS' then return jsonb_build_object('id',v_job.id,'status','SUCCESS','duplicate',true); end if;
  update public.render_jobs set status='FAILED',error_code=left(coalesce(p_error_code,'RENDER_FAILED'),120),updated_at=now() where id=v_job.id;
  update public.orders set status='RENDER_FAILED',updated_at=now() where id=v_job.order_id and status='RENDERING';
  insert into public.audit_logs(action,resource_type,resource_id,after_state,note) values('RENDER_FAILED','order',v_job.order_id::text,jsonb_build_object('status','RENDER_FAILED'),left(coalesce(p_error_code,'RENDER_FAILED'),120));
  return jsonb_build_object('id',v_job.id,'status','FAILED');
end $$;
revoke all on function public.melsou_fail_render(uuid,text) from public;
