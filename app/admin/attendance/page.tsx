import { requireSchoolUser } from "@/lib/auth";
import { saveAttendance } from "./actions";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const { supabase: s, school: schoolRow } = await requireSchoolUser(["school_owner","principal","teacher"]);
  const school = schoolRow!.id;
  const date = q.date || new Date().toISOString().slice(0, 10);

  const [{ data: years }, { data: classes }, { data: sections }] =
    await Promise.all([
      s.from("academic_years").select("id,name,active").eq("school_id", school),
      s.from("classes").select("id,name").eq("school_id", school).order("sort_order"),
      s.from("sections").select("id,name,class_id").eq("school_id", school),
    ]);

  let students: any[] = [];
  let saved: any[] = [];
  if (q.year && q.class) {
    let e = s
      .from("student_enrollments")
      .select("student_id,roll_no,students(id,first_name,last_name)")
      .eq("school_id", school)
      .eq("academic_year_id", q.year)
      .eq("class_id", q.class);
    if (q.section) e = e.eq("section_id", q.section);
    students = (await e).data || [];
    saved =
      (
        await s
          .from("student_attendance")
          .select("student_id,status,remarks")
          .eq("school_id", school)
          .eq("attendance_date", date)
      ).data || [];
  }

  const previous = new Map(saved.map((x) => [x.student_id, x]));

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Student Attendance</h1>
        <p className="mt-1 text-slate-500">
          Mark daily attendance with present, absent, late, leave or half-day.
        </p>

        <form className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-4">
          <select
            name="year"
            defaultValue={q.year}
            required
            className="rounded-xl border p-3"
          >
            <option value="">Academic year</option>
            {years?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
                {x.active ? " (Active)" : ""}
              </option>
            ))}
          </select>
          <select
            name="class"
            defaultValue={q.class}
            required
            className="rounded-xl border p-3"
          >
            <option value="">Class</option>
            {classes?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <select
            name="section"
            defaultValue={q.section}
            className="rounded-xl border p-3"
          >
            <option value="">All sections</option>
            {sections
              ?.filter((x) => !q.class || x.class_id === q.class)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
          <input
            name="date"
            type="date"
            defaultValue={date}
            className="rounded-xl border p-3"
          />
          <button className="rounded-xl bg-blue-700 p-3 text-white md:col-span-4">
            Load students
          </button>
        </form>

        {q.year && q.class && (
          <form action={saveAttendance} className="mt-6 rounded-2xl border bg-white p-5">
            <input type="hidden" name="academic_year_id" value={q.year} />
            <input type="hidden" name="class_id" value={q.class} />
            <input type="hidden" name="section_id" value={q.section || ""} />
            <input type="hidden" name="date" value={date} />

            {students.map((e: any) => {
              const st = Array.isArray(e.students) ? e.students[0] : e.students;
              const p = previous.get(st.id);
              return (
                <div
                  key={st.id}
                  className="grid grid-cols-1 items-center gap-2 border-b py-3 text-sm sm:grid-cols-5"
                >
                  <input type="hidden" name="student_id" value={st.id} />
                  <span className="font-mono text-slate-500">{e.roll_no || "-"}</span>
                  <b className="sm:col-span-1">
                    {st.first_name} {st.last_name}
                  </b>
                  <select
                    name={"status_" + st.id}
                    defaultValue={p?.status || "present"}
                    className="rounded-lg border p-2"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="leave">Leave</option>
                    <option value="half_day">Half-day</option>
                  </select>
                  <input
                    name={"remarks_" + st.id}
                    defaultValue={p?.remarks || ""}
                    placeholder="Remarks"
                    className="rounded-lg border p-2"
                  />
                </div>
              );
            })}

            {students.length ? (
              <button className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-white">
                {saved.length ? "Update attendance" : "Save attendance"}
              </button>
            ) : (
              <p className="py-8 text-center text-slate-500">
                No enrolled students found.
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
