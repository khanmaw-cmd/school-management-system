-- Extend student attendance statuses with half-day support.
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'attendance_status' and e.enumlabel = 'half_day'
  ) then
    alter type public.attendance_status add value 'half_day';
  end if;
end$$;
