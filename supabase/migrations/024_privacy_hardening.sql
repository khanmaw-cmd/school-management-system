-- Tighten notification targeting, calendar audiences, and health-record privacy.
drop policy if exists "staff create notifications" on public.notifications;
create policy "staff create notifications" on public.notifications for insert to authenticated
with check(
  public.has_school_role(school_id,array['school_owner','principal','teacher','accountant','reception']::public.school_role[])
  and (user_id is null or exists(select 1 from public.school_memberships m where m.school_id=notifications.school_id and m.user_id=notifications.user_id and m.active))
  and (student_id is null or exists(select 1 from public.students st where st.id=notifications.student_id and st.school_id=notifications.school_id))
  and (user_id is not null or student_id is not null)
);

drop policy if exists "calendar school read" on public.school_calendar_events;
create policy "calendar audience read" on public.school_calendar_events for select to authenticated
using(
  public.has_school_role(school_id,array['school_owner','principal','reception']::public.school_role[])
  or (audience='school' and public.is_school_member(school_id))
  or (audience='staff' and public.has_school_role(school_id,array['teacher','accountant']::public.school_role[]))
  or (audience='students' and public.has_school_role(school_id,array['student']::public.school_role[]))
  or (audience='parents' and public.has_school_role(school_id,array['parent']::public.school_role[]))
);

drop policy if exists "health authorized read" on public.student_health_records;
create policy "health authorized read" on public.student_health_records for select to authenticated
using(
  public.has_school_role(school_id,array['school_owner','principal','reception']::public.school_role[])
  or exists(select 1 from public.students st where st.id=student_id and st.school_id=student_health_records.school_id and st.user_id=(select auth.uid()))
  or exists(select 1 from public.guardians g where g.student_id=student_health_records.student_id and g.school_id=student_health_records.school_id and g.user_id=(select auth.uid()))
);
