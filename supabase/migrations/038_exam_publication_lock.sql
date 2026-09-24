-- Lock marks after result publication and make publication transactional.
create or replace function public.guard_published_exam_marks() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if exists(select 1 from public.exam_subjects es join public.exams e on e.id=es.exam_id where es.id=coalesce(new.exam_subject_id,old.exam_subject_id) and e.published) then raise exception 'Marks are locked after exam results are published'; end if;
 return coalesce(new,old);
end;$$;
drop trigger if exists published_exam_marks_guard on public.exam_marks;
create trigger published_exam_marks_guard before insert or update or delete on public.exam_marks for each row execute function public.guard_published_exam_marks();

create or replace function public.set_exam_published(p_school_id uuid,p_exam_id uuid,p_published boolean) returns void language plpgsql security invoker set search_path=public as $$
declare e public.exams%rowtype;
begin
 if not public.has_school_role(p_school_id,array['school_owner','principal']::public.school_role[]) then raise exception 'Unauthorized'; end if;
 select * into e from public.exams where id=p_exam_id and school_id=p_school_id for update;
 if e.id is null then raise exception 'Exam not found'; end if;
 if p_published and not exists(select 1 from public.exam_subjects where exam_id=e.id and school_id=p_school_id) then raise exception 'Cannot publish an exam without subjects'; end if;
 update public.exams set published=p_published where id=e.id;
end;$$;
revoke all on function public.set_exam_published(uuid,uuid,boolean) from public,anon;
grant execute on function public.set_exam_published(uuid,uuid,boolean) to authenticated;
