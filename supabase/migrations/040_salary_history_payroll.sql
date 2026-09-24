-- Salary history and effective-date-aware payroll generation.
alter table public.salary_structures drop constraint if exists salary_structures_staff_id_key;
create unique index if not exists salary_structures_staff_effective_key on public.salary_structures(staff_id,effective_from);
alter table public.payroll_items drop constraint if exists payroll_items_net_pay_check;
alter table public.payroll_items add constraint payroll_items_net_pay_check check(net_pay>=0);

create or replace function public.generate_payroll_run(p_school_id uuid,p_pay_month date,p_created_by uuid default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare rid uuid; rs text; cnt integer:=0; month_start date:=date_trunc('month',p_pay_month)::date; month_end date:=(date_trunc('month',p_pay_month)+interval '1 month - 1 day')::date;
begin
 if not public.has_school_role(p_school_id,array['school_owner','principal','accountant']::public.school_role[]) then raise exception 'Unauthorized payroll generation'; end if;
 if p_created_by is not null and p_created_by<>(select auth.uid()) then raise exception 'Invalid payroll creator'; end if;
 select id,status into rid,rs from public.payroll_runs where school_id=p_school_id and pay_month=month_start for update;
 if rid is not null and rs<>'draft' then raise exception 'Finalized or paid payroll cannot be regenerated'; end if;
 if rid is null then insert into public.payroll_runs(school_id,pay_month,status,created_by) values(p_school_id,month_start,'draft',(select auth.uid())) returning id into rid; end if;
 delete from public.payroll_items where payroll_run_id=rid;
 insert into public.payroll_items(school_id,payroll_run_id,staff_id,basic,allowances,deductions,net_pay,status)
 select p_school_id,rid,st.id,ss.basic,ss.allowances,ss.deductions,ss.basic+ss.allowances-ss.deductions,'pending'
 from public.staff st join lateral(
  select x.* from public.salary_structures x where x.school_id=p_school_id and x.staff_id=st.id and x.effective_from<=month_end order by x.effective_from desc,x.updated_at desc limit 1
 ) ss on true
 where st.school_id=p_school_id and st.active and ss.basic+ss.allowances-ss.deductions>=0;
 get diagnostics cnt=row_count;
 if cnt=0 then raise exception 'No active staff with valid salary structures for this payroll month'; end if;
 return rid;
end;$$;
revoke all on function public.generate_payroll_run(uuid,date,uuid) from public,anon;
grant execute on function public.generate_payroll_run(uuid,date,uuid) to authenticated;
