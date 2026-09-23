-- Database tenant integrity for fees and examinations.
create or replace function public.validate_finance_exam_tenant_links() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if tg_table_name='fee_structures' then
  if not exists(select 1 from public.academic_years x where x.id=new.academic_year_id and x.school_id=new.school_id) or (new.class_id is not null and not exists(select 1 from public.classes x where x.id=new.class_id and x.school_id=new.school_id)) then raise exception 'Invalid fee structure relationship'; end if;
 elsif tg_table_name='student_fee_assignments' then
  if not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) or not exists(select 1 from public.fee_structures x where x.id=new.fee_structure_id and x.school_id=new.school_id) then raise exception 'Invalid fee assignment relationship'; end if;
 elsif tg_table_name='fee_payments' then
  if not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) or (new.fee_structure_id is not null and not exists(select 1 from public.fee_structures x where x.id=new.fee_structure_id and x.school_id=new.school_id)) then raise exception 'Invalid fee payment relationship'; end if;
 elsif tg_table_name='student_fee_charges' then
  if not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) or not exists(select 1 from public.academic_years x where x.id=new.academic_year_id and x.school_id=new.school_id) or (new.fee_structure_id is not null and not exists(select 1 from public.fee_structures x where x.id=new.fee_structure_id and x.school_id=new.school_id)) then raise exception 'Invalid fee charge relationship'; end if;
 elsif tg_table_name='fee_payment_allocations' then
  if not exists(select 1 from public.fee_payments x where x.id=new.payment_id and x.school_id=new.school_id) or not exists(select 1 from public.student_fee_charges x where x.id=new.charge_id and x.school_id=new.school_id) then raise exception 'Invalid payment allocation relationship'; end if;
 elsif tg_table_name='fee_adjustments' then
  if not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) or (new.charge_id is not null and not exists(select 1 from public.student_fee_charges x where x.id=new.charge_id and x.school_id=new.school_id and x.student_id=new.student_id)) then raise exception 'Invalid fee adjustment relationship'; end if;
 elsif tg_table_name='exams' then
  if not exists(select 1 from public.academic_years x where x.id=new.academic_year_id and x.school_id=new.school_id) then raise exception 'Invalid exam academic year'; end if;
 elsif tg_table_name='exam_subjects' then
  if not exists(select 1 from public.exams x where x.id=new.exam_id and x.school_id=new.school_id) or not exists(select 1 from public.classes x where x.id=new.class_id and x.school_id=new.school_id) or not exists(select 1 from public.subjects x where x.id=new.subject_id and x.school_id=new.school_id) then raise exception 'Invalid exam subject relationship'; end if;
 elsif tg_table_name='exam_marks' then
  if not exists(select 1 from public.exam_subjects x where x.id=new.exam_subject_id and x.school_id=new.school_id) or not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) then raise exception 'Invalid exam mark relationship'; end if;
 end if; return new;
end;$$;
do $$declare t text;begin foreach t in array array['fee_structures','student_fee_assignments','fee_payments','student_fee_charges','fee_payment_allocations','fee_adjustments','exams','exam_subjects','exam_marks'] loop execute format('drop trigger if exists finance_exam_tenant_guard on public.%I',t);execute format('create trigger finance_exam_tenant_guard before insert or update on public.%I for each row execute function public.validate_finance_exam_tenant_links()',t);end loop;end$$;
