-- Atomic payroll generation with tenant safety, stale-draft cleanup, and negative-net prevention.

create or replace function public.generate_payroll_run(
  p_school_id uuid,
  p_pay_month date,
  p_created_by uuid default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_run_id uuid;
  v_status text;
  v_count integer := 0;
begin
  -- Authorization
  if not public.has_school_role(
    p_school_id,
    array['school_owner','principal','accountant']::public.school_role[]
  ) then
    raise exception 'Unauthorized payroll generation';
  end if;

  -- Normalize to first of month
  p_pay_month := date_trunc('month', p_pay_month)::date;

  -- Lock existing run if present
  select id, status into v_run_id, v_status
  from public.payroll_runs
  where school_id = p_school_id and pay_month = p_pay_month
  for update;

  if v_run_id is not null and v_status is distinct from 'draft' then
    raise exception 'Finalized or paid payroll cannot be regenerated';
  end if;

  if v_run_id is null then
    insert into public.payroll_runs (school_id, pay_month, status, created_by)
    values (p_school_id, p_pay_month, 'draft', coalesce(p_created_by, auth.uid()))
    returning id into v_run_id;
  else
    -- Remove any previous draft items so regeneration is clean
    delete from public.payroll_items
    where payroll_run_id = v_run_id and status = 'pending';
  end if;

  -- Insert items from current salary structures; reject negative net
  insert into public.payroll_items (
    school_id, payroll_run_id, staff_id,
    basic, allowances, deductions, net_pay, status
  )
  select
    ss.school_id,
    v_run_id,
    ss.staff_id,
    ss.basic,
    ss.allowances,
    ss.deductions,
    (ss.basic + ss.allowances - ss.deductions),
    'pending'
  from public.salary_structures ss
  join public.staff st on st.id = ss.staff_id and st.school_id = ss.school_id and st.active = true
  where ss.school_id = p_school_id
    and (ss.basic + ss.allowances - ss.deductions) >= 0
  on conflict (payroll_run_id, staff_id) do update set
    basic = excluded.basic,
    allowances = excluded.allowances,
    deductions = excluded.deductions,
    net_pay = excluded.net_pay,
    status = 'pending',
    paid_on = null,
    reference_no = null;

  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'No active staff with valid (non-negative) salary structures found';
  end if;

  return v_run_id;
end;
$$;

revoke all on function public.generate_payroll_run(uuid, date, uuid) from public, anon;
grant execute on function public.generate_payroll_run(uuid, date, uuid) to authenticated;
