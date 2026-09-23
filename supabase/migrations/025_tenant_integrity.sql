-- Enforce tenant-safe relationships at the database layer.
create or replace function public.validate_school_relationships() returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if tg_table_name='guardians' and not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) then raise exception 'Guardian student must belong to school'; end if;
  if tg_table_name='teacher_assignments' then
    if not exists(select 1 from public.staff x where x.id=new.staff_id and x.school_id=new.school_id) then raise exception 'Teacher must belong to school'; end if;
    if not exists(select 1 from public.academic_years x where x.id=new.academic_year_id and x.school_id=new.school_id) then raise exception 'Academic year must belong to school'; end if;
    if not exists(select 1 from public.classes x where x.id=new.class_id and x.school_id=new.school_id) then raise exception 'Class must belong to school'; end if;
    if new.section_id is not null and not exists(select 1 from public.sections x where x.id=new.section_id and x.school_id=new.school_id and x.class_id=new.class_id) then raise exception 'Section must belong to class and school'; end if;
  end if;
  return new;
end;$$;
drop trigger if exists guardians_school_guard on public.guardians;
create trigger guardians_school_guard before insert or update on public.guardians for each row execute function public.validate_school_relationships();
drop trigger if exists teacher_assignments_school_guard on public.teacher_assignments;
create trigger teacher_assignments_school_guard before insert or update on public.teacher_assignments for each row execute function public.validate_school_relationships();

create or replace function public.validate_timetable_collision() returns trigger language plpgsql security invoker set search_path=public as $$begin
 if exists(select 1 from public.timetable_entries t where t.school_id=new.school_id and t.academic_year_id=new.academic_year_id and t.weekday=new.weekday and t.id<>new.id and t.starts_at<new.ends_at and t.ends_at>new.starts_at and ((new.staff_id is not null and t.staff_id=new.staff_id) or (t.class_id=new.class_id and (new.section_id is null or t.section_id is null or t.section_id=new.section_id)) or (new.room is not null and new.room<>'' and t.room=new.room))) then raise exception 'Timetable collision: teacher, class/section, or room is already occupied';end if;return new;end;$$;
