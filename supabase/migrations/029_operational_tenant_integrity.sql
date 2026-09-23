-- Tenant relationship integrity for operational modules.
create or replace function public.validate_operational_tenant_links() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if tg_table_name='library_loans' then
  if not exists(select 1 from public.library_books x where x.id=new.book_id and x.school_id=new.school_id) or not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) then raise exception 'Invalid cross-school library relationship'; end if;
 elsif tg_table_name='transport_stops' then
  if not exists(select 1 from public.transport_routes x where x.id=new.route_id and x.school_id=new.school_id) then raise exception 'Invalid cross-school route'; end if;
 elsif tg_table_name='student_transport' then
  if not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) or not exists(select 1 from public.transport_routes x where x.id=new.route_id and x.school_id=new.school_id) or not exists(select 1 from public.academic_years x where x.id=new.academic_year_id and x.school_id=new.school_id) then raise exception 'Invalid cross-school transport relationship'; end if;
  if new.stop_id is not null and not exists(select 1 from public.transport_stops x where x.id=new.stop_id and x.school_id=new.school_id and x.route_id=new.route_id) then raise exception 'Invalid transport stop'; end if;
 elsif tg_table_name='assets' then
  if new.category_id is not null and not exists(select 1 from public.asset_categories x where x.id=new.category_id and x.school_id=new.school_id) then raise exception 'Invalid cross-school asset category'; end if;
 elsif tg_table_name='staff_leave_requests' then
  if not exists(select 1 from public.staff x where x.id=new.staff_id and x.school_id=new.school_id) then raise exception 'Invalid cross-school staff leave'; end if;
 elsif tg_table_name='student_health_records' then
  if not exists(select 1 from public.students x where x.id=new.student_id and x.school_id=new.school_id) then raise exception 'Invalid cross-school health record'; end if;
 elsif tg_table_name='salary_structures' then
  if not exists(select 1 from public.staff x where x.id=new.staff_id and x.school_id=new.school_id) then raise exception 'Invalid cross-school salary'; end if;
 elsif tg_table_name='payroll_items' then
  if not exists(select 1 from public.payroll_runs x where x.id=new.payroll_run_id and x.school_id=new.school_id) or not exists(select 1 from public.staff x where x.id=new.staff_id and x.school_id=new.school_id) then raise exception 'Invalid cross-school payroll item'; end if;
 elsif tg_table_name='communication_campaigns' then
  if new.class_id is not null and not exists(select 1 from public.classes x where x.id=new.class_id and x.school_id=new.school_id) then raise exception 'Invalid campaign class'; end if;
  if new.section_id is not null and (new.class_id is null or not exists(select 1 from public.sections x where x.id=new.section_id and x.school_id=new.school_id and x.class_id=new.class_id)) then raise exception 'Invalid campaign section'; end if;
 end if; return new;
end;$$;
do $$declare t text;begin foreach t in array array['library_loans','transport_stops','student_transport','assets','staff_leave_requests','student_health_records','salary_structures','payroll_items','communication_campaigns'] loop execute format('drop trigger if exists operational_tenant_guard on public.%I',t);execute format('create trigger operational_tenant_guard before insert or update on public.%I for each row execute function public.validate_operational_tenant_links()',t);end loop;end$$;
