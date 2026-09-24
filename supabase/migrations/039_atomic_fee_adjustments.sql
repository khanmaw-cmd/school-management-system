-- Transactional fee adjustments with balance protection.
create or replace function public.record_fee_adjustment(p_school_id uuid,p_student_id uuid,p_charge_id uuid,p_type text,p_amount numeric,p_reason text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare c public.student_fee_charges%rowtype; paid numeric:=0; aid uuid; net numeric;
begin
 if not public.can_manage_finance(p_school_id) then raise exception 'Not authorized'; end if;
 if p_amount<=0 or trim(coalesce(p_reason,''))='' then raise exception 'Invalid adjustment'; end if;
 if p_type not in('discount','waiver','refund','credit','debit') then raise exception 'Invalid adjustment type'; end if;
 if not exists(select 1 from public.students where id=p_student_id and school_id=p_school_id) then raise exception 'Student not found'; end if;
 if p_charge_id is not null then
  select * into c from public.student_fee_charges where id=p_charge_id and school_id=p_school_id and student_id=p_student_id for update;
  if c.id is null then raise exception 'Charge not found'; end if;
  select coalesce(sum(amount),0) into paid from public.fee_payment_allocations where charge_id=c.id;
  if p_type in('discount','waiver','credit') and p_amount>greatest(0,c.amount-c.discount_amount-paid) then raise exception 'Adjustment exceeds outstanding balance'; end if;
 end if;
 insert into public.fee_adjustments(school_id,student_id,charge_id,adjustment_type,amount,reason,created_by)
 values(p_school_id,p_student_id,p_charge_id,p_type,p_amount,trim(p_reason),(select auth.uid())) returning id into aid;
 if p_charge_id is not null and p_type in('discount','waiver','credit') then
  update public.student_fee_charges set discount_amount=discount_amount+p_amount where id=p_charge_id;
  select amount-discount_amount-paid into net from public.student_fee_charges where id=p_charge_id;
  if net=0 then update public.student_fee_charges set status='paid' where id=p_charge_id; end if;
 end if;
 return aid;
end;$$;
revoke all on function public.record_fee_adjustment(uuid,uuid,uuid,text,numeric,text) from public,anon;
grant execute on function public.record_fee_adjustment(uuid,uuid,uuid,text,numeric,text) to authenticated;
