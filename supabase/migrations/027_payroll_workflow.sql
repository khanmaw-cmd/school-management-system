-- Payroll state transitions and tenant integrity.
alter table public.payroll_runs add column if not exists finalized_at timestamptz;
alter table public.payroll_runs add column if not exists paid_at timestamptz;
alter table public.payroll_runs add column if not exists finalized_by uuid references auth.users(id);
alter table public.payroll_runs add column if not exists paid_by uuid references auth.users(id);

create or replace function public.set_payroll_status(p_run_id uuid,p_status text) returns void language plpgsql security invoker set search_path=public as $$
declare r public.payroll_runs%rowtype;
begin
 select * into r from public.payroll_runs where id=p_run_id for update;
 if r.id is null or not public.has_school_role(r.school_id,array['school_owner','principal','accountant']::public.school_role[]) then raise exception 'Unauthorized payroll'; end if;
 if p_status='finalized' then
   if r.status<>'draft' then raise exception 'Only draft payroll can be finalized'; end if;
   update public.payroll_runs set status='finalized',finalized_at=now(),finalized_by=(select auth.uid()) where id=p_run_id;
 elsif p_status='paid' then
   if r.status<>'finalized' then raise exception 'Only finalized payroll can be marked paid'; end if;
   update public.payroll_items set status='paid',paid_on=current_date where payroll_run_id=p_run_id and status='pending';
   update public.payroll_runs set status='paid',paid_at=now(),paid_by=(select auth.uid()) where id=p_run_id;
 else raise exception 'Invalid payroll status'; end if;
end;$$;
revoke all on function public.set_payroll_status(uuid,text) from public,anon;
grant execute on function public.set_payroll_status(uuid,text) to authenticated;
