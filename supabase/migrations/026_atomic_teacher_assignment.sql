-- Atomic teacher/class/subject assignment with tenant validation.
create or replace function public.assign_teacher(p_staff_id uuid,p_academic_year_id uuid,p_class_id uuid,p_section_id uuid default null,p_subject_id uuid default null)
returns void language plpgsql security invoker set search_path=public as $$
declare v_school uuid;
begin
 select m.school_id into v_school from public.school_memberships m where m.user_id=(select auth.uid()) and m.active and m.role in('school_owner','principal') order by m.created_at limit 1;
 if v_school is null then raise exception 'Unauthorized'; end if;
 if not exists(select 1 from public.staff x where x.id=p_staff_id and x.school_id=v_school and x.active) then raise exception 'Invalid teacher'; end if;
 if not exists(select 1 from public.academic_years x where x.id=p_academic_year_id and x.school_id=v_school) then raise exception 'Invalid academic year'; end if;
 if not exists(select 1 from public.classes x where x.id=p_class_id and x.school_id=v_school) then raise exception 'Invalid class'; end if;
 if p_section_id is not null and not exists(select 1 from public.sections x where x.id=p_section_id and x.school_id=v_school and x.class_id=p_class_id) then raise exception 'Invalid section'; end if;
 if p_subject_id is not null and not exists(select 1 from public.subjects x where x.id=p_subject_id and x.school_id=v_school) then raise exception 'Invalid subject'; end if;
 insert into public.teacher_assignments(school_id,staff_id,academic_year_id,class_id,section_id) values(v_school,p_staff_id,p_academic_year_id,p_class_id,p_section_id);
 if p_subject_id is not null then insert into public.teacher_subject_assignments(school_id,staff_id,subject_id,academic_year_id,class_id,section_id) values(v_school,p_staff_id,p_subject_id,p_academic_year_id,p_class_id,p_section_id); end if;
end;$$;
revoke all on function public.assign_teacher(uuid,uuid,uuid,uuid,uuid) from public,anon;
grant execute on function public.assign_teacher(uuid,uuid,uuid,uuid,uuid) to authenticated;
