-- Individual payroll payment recording with state and tenant validation.
create or replace function public.pay_payroll_item(p_item_id uuid,p_reference_no text default null) returns void language plpgsql security invoker set search_path=public as $$
declare i public.payroll_items%rowtype; r public.payroll_runs%rowtype;
begin
 select * into i from public.payroll_items where id=p_item_id for update;
 if i.id is null or not public.has_school_role(i.school_id,array['school_owner','principal','accountant']::public.school_role[]) then raise exception 'Unauthorized payroll item'; end if;
 select * into r from public.payroll_runs where id=i.payroll_run_id for update;
 if r.school_id<>i.school_id or r.status<>'finalized' then raise exception 'Payroll must be finalized before payment'; end if;
 if i.status='paid' then raise exception 'Payroll item is already paid'; end if;
 update public.payroll_items set status='paid',paid_on=current_date,reference_no=nullif(trim(p_reference_no),'') where id=p_item_id;
 if not exists(select 1 from public.payroll_items where payroll_run_id=r.id and status<>'paid') then update public.payroll_runs set status='paid',paid_at=now(),paid_by=(select auth.uid()) where id=r.id; end if;
end;$$;
revoke all on function public.pay_payroll_item(uuid,text) from public,anon;
grant execute on function public.pay_payroll_item(uuid,text) to authenticated;
