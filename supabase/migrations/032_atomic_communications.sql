-- Atomic in-app communication campaign delivery.
create or replace function public.send_communication_campaign(
 p_school_id uuid,p_title text,p_body text,p_audience text,p_class_id uuid default null,p_section_id uuid default null
) returns table(campaign_id uuid,recipient_count integer)
language plpgsql security invoker set search_path=public as $$
declare cid uuid; rc integer:=0;
begin
 if not public.has_school_role(p_school_id,array['school_owner','principal','reception']::public.school_role[]) then raise exception 'Not authorized'; end if;
 if trim(coalesce(p_title,''))='' or trim(coalesce(p_body,''))='' then raise exception 'Title and message are required'; end if;
 if p_audience not in('school','staff','parents','students','class') then raise exception 'Invalid audience'; end if;
 if p_audience='class' and p_class_id is null then raise exception 'Class is required'; end if;
 if p_class_id is not null and not exists(select 1 from public.classes c where c.id=p_class_id and c.school_id=p_school_id) then raise exception 'Invalid class'; end if;
 if p_section_id is not null and (p_class_id is null or not exists(select 1 from public.sections s where s.id=p_section_id and s.class_id=p_class_id and s.school_id=p_school_id)) then raise exception 'Invalid section'; end if;

 insert into public.communication_campaigns(school_id,title,body,audience,class_id,section_id,status,sent_at,created_by)
 values(p_school_id,trim(p_title),trim(p_body),p_audience,p_class_id,p_section_id,'sent',now(),(select auth.uid())) returning id into cid;

 with target_students as (
  select distinct st.id,st.user_id from public.students st
  where st.school_id=p_school_id and st.active and
   (p_audience in('school','parents','students') or
    (p_audience='class' and exists(select 1 from public.student_enrollments e where e.student_id=st.id and e.school_id=p_school_id and e.class_id=p_class_id and (p_section_id is null or e.section_id=p_section_id))))
 ), recipients as (
  select m.user_id from public.school_memberships m where m.school_id=p_school_id and m.active and p_audience in('school','staff') and (p_audience='school' or m.role not in('parent','student'))
  union
  select ts.user_id from target_students ts where ts.user_id is not null and p_audience<>'parents'
  union
  select g.user_id from public.guardians g join target_students ts on ts.id=g.student_id where g.school_id=p_school_id and g.user_id is not null and p_audience<>'students'
 )
 insert into public.notifications(school_id,user_id,type,title,body,link)
 select p_school_id,r.user_id,'announcement',trim(p_title),trim(p_body),'/notifications' from recipients r where r.user_id is not null;
 get diagnostics rc=row_count;
 return query select cid,rc;
end;$$;
revoke all on function public.send_communication_campaign(uuid,text,text,text,uuid,uuid) from public,anon;
grant execute on function public.send_communication_campaign(uuid,text,text,text,uuid,uuid) to authenticated;
