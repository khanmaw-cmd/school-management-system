-- RBAC hardening. Apply after 001-009.
create or replace function public.has_school_role(target_school uuid, allowed_roles public.school_role[])
returns boolean language sql stable security definer set search_path=public
as $$ select auth.uid() is not null and exists(select 1 from public.school_memberships m where m.school_id=target_school and m.user_id=auth.uid() and m.active=true and m.role=any(allowed_roles)); $$;
revoke all on function public.has_school_role(uuid,public.school_role[]) from public,anon;
grant execute on function public.has_school_role(uuid,public.school_role[]) to authenticated;

create or replace function public.is_school_member(target_school uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select auth.uid() is not null and exists(select 1 from public.school_memberships m where m.school_id=target_school and m.user_id=auth.uid() and m.active=true); $$;
revoke all on function public.is_school_member(uuid) from public,anon;
grant execute on function public.is_school_member(uuid) to authenticated;

create or replace function public.can_manage_school(target_school uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select public.has_school_role(target_school,array['school_owner','principal','reception']::public.school_role[]); $$;
revoke all on function public.can_manage_school(uuid) from public,anon;
grant execute on function public.can_manage_school(uuid) to authenticated;

revoke all on function public.create_school_with_owner(text,text,text) from public,anon;
grant execute on function public.create_school_with_owner(text,text,text) to authenticated;

create or replace function public.can_mark_academics(target_school uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select public.has_school_role(target_school,array['school_owner','principal','teacher']::public.school_role[]); $$;
revoke all on function public.can_mark_academics(uuid) from public,anon;
grant execute on function public.can_mark_academics(uuid) to authenticated;

create or replace function public.can_manage_finance(target_school uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select public.has_school_role(target_school,array['school_owner','principal','accountant']::public.school_role[]); $$;
revoke all on function public.can_manage_finance(uuid) from public,anon;
grant execute on function public.can_manage_finance(uuid) to authenticated;

drop policy if exists "manage attendance" on public.student_attendance;
create policy "manage attendance" on public.student_attendance for all to authenticated using(public.can_mark_academics(school_id)) with check(public.can_mark_academics(school_id));
drop policy if exists "manage marks" on public.exam_marks;
create policy "manage marks" on public.exam_marks for all to authenticated using(public.can_mark_academics(school_id)) with check(public.can_mark_academics(school_id));
drop policy if exists "manage payments" on public.fee_payments;
create policy "manage payments" on public.fee_payments for all to authenticated using(public.can_manage_finance(school_id)) with check(public.can_manage_finance(school_id));
drop policy if exists "manage fee structures" on public.fee_structures;
create policy "manage fee structures" on public.fee_structures for all to authenticated using(public.can_manage_finance(school_id)) with check(public.can_manage_finance(school_id));
drop policy if exists "manage fee assignments" on public.student_fee_assignments;
create policy "manage fee assignments" on public.student_fee_assignments for all to authenticated using(public.can_manage_finance(school_id)) with check(public.can_manage_finance(school_id));