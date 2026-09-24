-- Exam marks locking and controlled result publication.

alter table public.exams
  add column if not exists marks_locked boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references auth.users(id);

-- Publish / unpublish with automatic marks lock on publish.
create or replace function public.set_exam_published(
  p_school_id uuid,
  p_exam_id uuid,
  p_published boolean
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  r public.exams%rowtype;
begin
  if not public.has_school_role(
    p_school_id,
    array['school_owner','principal']::public.school_role[]
  ) then
    raise exception 'Unauthorized exam publish';
  end if;

  select * into r
  from public.exams
  where id = p_exam_id and school_id = p_school_id
  for update;

  if r.id is null then
    raise exception 'Exam not found';
  end if;

  if p_published then
    update public.exams set
      published = true,
      marks_locked = true,
      published_at = now(),
      published_by = auth.uid()
    where id = p_exam_id;
  else
    -- Unpublish keeps marks locked so teachers cannot silently rewrite
    -- published history without an explicit unlock by leadership.
    update public.exams set
      published = false,
      published_at = null,
      published_by = null
    where id = p_exam_id;
  end if;
end;
$$;

revoke all on function public.set_exam_published(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_exam_published(uuid, uuid, boolean) to authenticated;

-- Explicit unlock (owner/principal only) so marks can be corrected after unpublish.
create or replace function public.set_exam_marks_locked(
  p_school_id uuid,
  p_exam_id uuid,
  p_locked boolean
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.has_school_role(
    p_school_id,
    array['school_owner','principal']::public.school_role[]
  ) then
    raise exception 'Unauthorized marks lock change';
  end if;

  if p_locked = false then
    -- Cannot unlock while still published
    if exists (
      select 1 from public.exams
      where id = p_exam_id and school_id = p_school_id and published = true
    ) then
      raise exception 'Unpublish the exam before unlocking marks';
    end if;
  end if;

  update public.exams
  set marks_locked = p_locked
  where id = p_exam_id and school_id = p_school_id;

  if not found then
    raise exception 'Exam not found';
  end if;
end;
$$;

revoke all on function public.set_exam_marks_locked(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_exam_marks_locked(uuid, uuid, boolean) to authenticated;

-- Guard direct table updates when locked/published.
create or replace function public.guard_exam_marks_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_exam public.exams%rowtype;
begin
  select e.* into v_exam
  from public.exams e
  join public.exam_subjects es on es.exam_id = e.id
  where es.id = coalesce(new.exam_subject_id, old.exam_subject_id);

  if v_exam.id is null then
    raise exception 'Exam not found for marks';
  end if;

  if v_exam.published or v_exam.marks_locked then
    raise exception 'Marks are locked for this exam. Unlock or unpublish first.';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists exam_marks_lock_guard on public.exam_marks;
create trigger exam_marks_lock_guard
  before insert or update or delete on public.exam_marks
  for each row execute function public.guard_exam_marks_write();
