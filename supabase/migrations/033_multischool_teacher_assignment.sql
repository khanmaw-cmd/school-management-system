-- Make teacher assignment explicitly school-scoped for multi-school users.
drop function if exists public.assign_teacher(uuid,uuid,uuid,uuid,uuid);
create or replace function public.assign_teacher(p_school_id uuid,p_staff_id uuid,p_academic_year_id uuid,p_class_id uuid,p_section_id uuid default null,p_subject_id uuid default null)
returns void language plpgsql security invoker set search_path=public as $$
begin
 if not public.has_school_role(p_school_id,array['school_owner','principal']::public.school_role[]) then raise exception 'Unauthorized'; end if;
 if not exists(select 1 from public.staff x where x.id=p_staff_id and x.school_id=p_school_id and x.active) then raise exception 'Invalid teacher'; end if;
 if not exists(select 1 from public.academic_years x where x.id=p_academic_year_id and x.school_id=p_school_id) then raise exception 'Invalid academic year'; end if;
 if not exists(select 1 from public.classes x where x.id=p_class_id and x.school_id=p_school_id) then raise exception 'Invalid class'; end if;
 if p_section_id is not null and not exists(select 1 from public.sections x where x.id=p_section_id and x.school_id=p_school_id and x.class_id=p_class_id) then raise exception 'Invalid section'; end if;
 if p_subject_id is not null and not exists(select 1 from public.subjects x where x.id=p_subject_id and x.school_id=p_school_id) then raise exception 'Invalid subject'; end if;
 insert into public.teacher_assignments(school_id,staff_id,academic_year_id,class_id,section_id) values(p_school_id,p_staff_id,p_academic_year_id,p_class_id,p_section_id);
 if p_subject_id is not null then insert into public.teacher_subject_assignments(school_id,staff_id,subject_id,academic_year_id,class_id,section_id) values(p_school_id,p_staff_id,p_subject_id,p_academic_year_id,p_class_id,p_section_id); end if;
end;$$;
revoke all on function public.assign_teacher(uuid,uuid,uuid,uuid,uuid,uuid) from public,anon;
grant execute on function public.assign_teacher(uuid,uuid,uuid,uuid,uuid,uuid) to authenticated;
