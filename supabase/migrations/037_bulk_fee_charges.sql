-- Bulk fee charge generation from a fee structure for an enrolled class.

create or replace function public.generate_fee_charges_from_structure(
  p_school_id uuid,
  p_fee_structure_id uuid,
  p_description text,
  p_charge_date date,
  p_due_date date,
  p_created_by uuid default null
) returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  fs public.fee_structures%rowtype;
  v_count integer := 0;
begin
  if not public.can_manage_finance(p_school_id) then
    raise exception 'Not authorized';
  end if;

  select * into fs
  from public.fee_structures
  where id = p_fee_structure_id and school_id = p_school_id and active = true;

  if fs.id is null then
    raise exception 'Fee structure not found';
  end if;

  insert into public.student_fee_charges (
    school_id, student_id, academic_year_id, fee_structure_id,
    description, charge_date, due_date, amount, discount_amount, status, created_by
  )
  select
    p_school_id,
    se.student_id,
    fs.academic_year_id,
    fs.id,
    coalesce(nullif(trim(p_description), ''), fs.name),
    p_charge_date,
    p_due_date,
    fs.amount,
    coalesce(sfa.discount_amount, 0),
    'open',
    coalesce(p_created_by, auth.uid())
  from public.student_enrollments se
  left join public.student_fee_assignments sfa
    on sfa.student_id = se.student_id
   and sfa.fee_structure_id = fs.id
   and sfa.school_id = p_school_id
  join public.students st on st.id = se.student_id and st.active = true
  where se.school_id = p_school_id
    and se.academic_year_id = fs.academic_year_id
    and (fs.class_id is null or se.class_id = fs.class_id)
    and not exists (
      select 1 from public.student_fee_charges c
      where c.student_id = se.student_id
        and c.fee_structure_id = fs.id
        and c.due_date = p_due_date
        and c.status in ('open', 'paid')
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.generate_fee_charges_from_structure(uuid, uuid, text, date, date, uuid) from public, anon;
grant execute on function public.generate_fee_charges_from_structure(uuid, uuid, text, date, date, uuid) to authenticated;
