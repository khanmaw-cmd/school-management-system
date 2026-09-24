import { requireSchoolModule } from "@/lib/auth";
import { saveMarks } from "../actions";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const { supabase: s, school } = await requireSchoolModule("exams", [
    "school_owner",
    "principal",
    "teacher",
  ]);
  const id = school!.id;

  const { data: es } = await s
    .from("exam_subjects")
    .select(
      "id,class_id,max_marks,pass_marks,exams(id,name,academic_year_id,published,marks_locked),subjects(name),classes(name)"
    )
    .eq("school_id", id);

  let students: any[] = [];
  let existing: any[] = [];
  const selected = es?.find((x) => x.id === q.exam_subject);
  const exam: any = selected
    ? Array.isArray(selected.exams)
      ? selected.exams[0]
      : selected.exams
    : null;
  const locked = !!(exam?.published || exam?.marks_locked);

  if (selected && exam) {
    const [{ data: e }, { data: m }] = await Promise.all([
      s
        .from("student_enrollments")
        .select("students(id,admission_no,first_name,last_name)")
        .eq("school_id", id)
        .eq("academic_year_id", exam.academic_year_id)
        .eq("class_id", selected.class_id),
      s
        .from("exam_marks")
        .select("student_id,marks,absent,remarks")
        .eq("school_id", id)
        .eq("exam_subject_id", selected.id),
    ]);
    students = e || [];
    existing = m || [];
  }

  const old = new Map(existing.map((x) => [x.student_id, x]));

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Marks Entry</h1>

        <form className="mt-6 flex flex-wrap gap-3">
          <select
            name="exam_subject"
            defaultValue={q.exam_subject}
            required
            className="min-w-0 flex-1 rounded-xl border bg-white p-3"
          >
            <option value="">Select exam / class / subject</option>
            {es?.map((x: any) => {
              const ex = Array.isArray(x.exams) ? x.exams[0] : x.exams;
              const tag =
                ex?.published || ex?.marks_locked ? " (locked)" : "";
              return (
                <option key={x.id} value={x.id}>
                  {ex?.name} · {x.classes?.name} · {x.subjects?.name} (
                  {x.max_marks}){tag}
                </option>
              );
            })}
          </select>
          <button className="rounded-xl bg-blue-700 px-5 text-white">Load</button>
        </form>

        {selected && locked && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Marks for this exam are locked
            {exam?.published ? " because results are published" : ""}. A school
            owner or principal must unlock before further edits.
          </div>
        )}

        {selected && (
          <form action={saveMarks} className="mt-6 rounded-2xl border bg-white p-5">
            <input type="hidden" name="exam_subject" value={selected.id} />
            <p className="mb-4 text-sm text-slate-500">
              Maximum {selected.max_marks} · Pass {selected.pass_marks}
            </p>
            {students.map((e: any) => {
              const st = Array.isArray(e.students) ? e.students[0] : e.students;
              const p = old.get(st.id);
              return (
                <div
                  key={st.id}
                  className="grid grid-cols-2 items-center gap-2 border-b py-3 text-sm sm:grid-cols-5"
                >
                  <input type="hidden" name="student_id" value={st.id} />
                  <span className="font-mono text-slate-500">{st.admission_no}</span>
                  <b>
                    {st.first_name} {st.last_name}
                  </b>
                  <input
                    name={"marks_" + st.id}
                    type="number"
                    min="0"
                    max={Number(selected.max_marks)}
                    step=".01"
                    defaultValue={p?.marks ?? ""}
                    placeholder="Marks"
                    disabled={locked}
                    className="rounded-lg border p-2 disabled:bg-slate-100"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      name={"absent_" + st.id}
                      type="checkbox"
                      defaultChecked={p?.absent || false}
                      disabled={locked}
                    />{" "}
                    Absent
                  </label>
                  <input
                    name={"remarks_" + st.id}
                    defaultValue={p?.remarks || ""}
                    placeholder="Remarks"
                    disabled={locked}
                    className="rounded-lg border p-2 disabled:bg-slate-100 sm:col-span-1"
                  />
                </div>
              );
            })}
            {students.length ? (
              !locked && (
                <button className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-white">
                  {existing.length ? "Update marks" : "Save marks"}
                </button>
              )
            ) : (
              <p className="p-6 text-center text-slate-500">
                No students enrolled for this exam academic year/class.
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
