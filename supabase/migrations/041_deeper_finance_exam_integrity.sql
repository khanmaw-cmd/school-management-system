-- Deeper finance and examination relationship integrity.
create or replace function public.validate_payment_allocation_student() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if not exists(
  select 1 from public.fee_payments p join public.student_fee_charges c on c.id=new.charge_id
  where p.id=new.payment_id and p.school_id=new.school_id and c.school_id=new.school_id and p.student_id=c.student_id
 ) then raise exception 'Payment and charge must belong to the same student'; end if;
 return new;
end;$$;
drop trigger if exists payment_allocation_student_guard on public.fee_payment_allocations;
create trigger payment_allocation_student_guard before insert or update on public.fee_payment_allocations for each row execute function public.validate_payment_allocation_student();

create or replace function public.validate_exam_mark_enrollment() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if not exists(
  select 1 from public.exam_subjects es join public.exams e on e.id=es.exam_id
  join public.student_enrollments se on se.student_id=new.student_id and se.school_id=new.school_id and se.academic_year_id=e.academic_year_id and se.class_id=es.class_id
  where es.id=new.exam_subject_id and es.school_id=new.school_id
 ) then raise exception 'Student is not enrolled for this exam subject class and academic year'; end if;
 return new;
end;$$;
drop trigger if exists exam_mark_enrollment_guard on public.exam_marks;
create trigger exam_mark_enrollment_guard before insert or update on public.exam_marks for each row execute function public.validate_exam_mark_enrollment();
