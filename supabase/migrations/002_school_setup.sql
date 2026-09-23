create or replace function public.create_school_with_owner(school_name text, school_code text, owner_name text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare new_school_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.school_memberships where user_id=auth.uid() and active) then raise exception 'User already belongs to a school'; end if;
 insert into public.profiles(id,full_name) values(auth.uid(),trim(owner_name))
 on conflict(id) do update set full_name=excluded.full_name;
 insert into public.schools(name,code) values(trim(school_name),upper(trim(school_code))) returning id into new_school_id;
 insert into public.school_memberships(school_id,user_id,role) values(new_school_id,auth.uid(),'school_owner');
 return new_school_id;
end;
$$;
grant execute on function public.create_school_with_owner(text,text,text) to authenticated;

create policy "owner updates school" on public.schools for update
using (exists(select 1 from public.school_memberships m where m.school_id=id and m.user_id=auth.uid() and m.active and m.role='school_owner'))
with check (exists(select 1 from public.school_memberships m where m.school_id=id and m.user_id=auth.uid() and m.active and m.role='school_owner'));
