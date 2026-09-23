-- Finance integrity, grade validation, and safer tenant operations.
drop policy if exists "read charges" on public.student_fee_charges;
create policy "charge authorized read" on public.student_fee_charges for select to authenticated using(public.can_manage_finance(school_id) or public.can_view_student(student_id));
drop policy if exists "read allocations" on public.fee_payment_allocations;
create policy "allocation authorized read" on public.fee_payment_allocations for select to authenticated using(public.can_manage_finance(school_id) or exists(select 1 from public.student_fee_charges c where c.id=charge_id and public.can_view_student(c.student_id)));
drop policy if exists "read adjustments" on public.fee_adjustments;
create policy "adjustment authorized read" on public.fee_adjustments for select to authenticated using(public.can_manage_finance(school_id) or public.can_view_student(student_id));

create or replace function public.collect_fee_payment(p_school_id uuid,p_student_id uuid,p_charge_id uuid,p_amount numeric,p_payment_date date,p_method text,p_reference text default null)
returns table(payment_id uuid,receipt_no text,balance_after numeric)
language plpgsql security invoker set search_path=public
as $$
declare c public.student_fee_charges%rowtype; paid numeric; bal numeric; pid uuid; rec text;
begin
 if not public.can_manage_finance(p_school_id) then raise exception 'Not authorized'; end if;
 select * into c from public.student_fee_charges where id=p_charge_id and school_id=p_school_id and student_id=p_student_id for update;
 if not found then raise exception 'Charge not found'; end if;
 select coalesce(sum(amount),0) into paid from public.fee_payment_allocations where charge_id=p_charge_id;
 bal:=c.amount-c.discount_amount-paid;
 if p_amount<=0 or p_amount>bal then raise exception 'Invalid payment amount'; end if;
 rec:='RCP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 insert into public.fee_payments(school_id,student_id,amount,payment_date,payment_method,reference_no,receipt_no,collected_by) values(p_school_id,p_student_id,p_amount,p_payment_date,p_method,nullif(trim(p_reference),''),rec,(select auth.uid())) returning id into pid;
 insert into public.fee_payment_allocations(school_id,payment_id,charge_id,amount) values(p_school_id,pid,p_charge_id,p_amount);
 bal:=bal-p_amount;
 if bal=0 then update public.student_fee_charges set status='paid' where id=p_charge_id; end if;
 return query select pid,rec,bal;
end;$$;
revoke all on function public.collect_fee_payment(uuid,uuid,uuid,numeric,date,text,text) from public,anon;
grant execute on function public.collect_fee_payment(uuid,uuid,uuid,numeric,date,text,text) to authenticated;

create or replace function public.validate_grade_range() returns trigger language plpgsql set search_path=public as $$
begin
 if exists(select 1 from public.grade_scales g where g.school_id=new.school_id and g.name=new.name and g.id<>new.id and numrange(g.min_percentage,g.max_percentage,'[]') && numrange(new.min_percentage,new.max_percentage,'[]')) then raise exception 'Grade percentage range overlaps an existing grade'; end if;
 return new;
end;$$;
drop trigger if exists grade_range_no_overlap on public.grade_scales;
create trigger grade_range_no_overlap before insert or update on public.grade_scales for each row execute function public.validate_grade_range();