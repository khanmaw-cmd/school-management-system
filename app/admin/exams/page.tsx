import Link from "next/link";
import { requireSchoolModule } from "@/lib/auth";
import {
  addExam,
  addExamSubject,
  setExamPublished,
  setExamMarksLocked,
} from "./actions";

export default async function Page() {
  const { supabase: s, school, membership } = await requireSchoolModule(
    "exams",
    ["school_owner", "principal", "teacher"]
  );
  const id = school!.id;
  const canPublish =
    membership.role === "school_owner" || membership.role === "principal";

  const [{ data: y }, { data: c }, { data: sub }, { data: exams }] =
    await Promise.all([
      s.from("academic_years").select("id,name").eq("school_id", id),
      s.from("classes").select("id,name").eq("school_id", id),
      s.from("subjects").select("id,name").eq("school_id", id),
      s
        .from("exams")
        .select("*")
        .eq("school_id", id)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Exams & Results</h1>
          <Link
            href="/admin/exams/marks"
            className="rounded-xl bg-blue-700 px-5 py-3 text-white"
          >
            Enter marks
          </Link>
        </div>

        {canPublish && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <form action={addExam} className="rounded-2xl border bg-white p-5">
              <h2 className="font-semibold">Create exam</h2>
              <select
                name="year"
                required
                className="mt-3 w-full rounded-xl border p-3"
              >
                <option value="">Academic year</option>
                {y?.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <input
                name="name"
                required
                placeholder="Term 1 / Final Exam"
                className="mt-3 w-full rounded-xl border p-3"
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input name="starts" type="date" className="rounded-xl border p-3" />
                <input name="ends" type="date" className="rounded-xl border p-3" />
              </div>
              <button className="mt-3 rounded-xl bg-slate-900 px-5 py-3 text-white">
                Create exam
              </button>
            </form>

            <form
              action={addExamSubject}
              className="rounded-2xl border bg-white p-5"
            >
              <h2 className="font-semibold">Add exam subject</h2>
              <select
                name="exam"
                required
                className="mt-3 w-full rounded-xl border p-3"
              >
                <option value="">Exam</option>
                {exams?.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <select
                name="class"
                required
                className="mt-3 w-full rounded-xl border p-3"
              >
                <option value="">Class</option>
                {c?.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <select
                name="subject"
                required
                className="mt-3 w-full rounded-xl border p-3"
              >
                <option value="">Subject</option>
                {sub?.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <input
                  name="max"
                  required
                  type="number"
                  defaultValue="100"
                  className="rounded-xl border p-3"
                />
                <input
                  name="pass"
                  required
                  type="number"
                  defaultValue="35"
                  className="rounded-xl border p-3"
                />
                <input name="date" type="date" className="rounded-xl border p-3" />
              </div>
              <button className="mt-3 rounded-xl bg-slate-900 px-5 py-3 text-white">
                Add subject
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {exams?.map((x: any) => (
            <div
              key={x.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <b>{x.name}</b>
                <span className="ml-3 text-sm text-slate-500">
                  {x.starts_on || ""}
                  {x.ends_on ? " to " + x.ends_on : ""}
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {x.published && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Published
                    </span>
                  )}
                  {x.marks_locked && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      Marks locked
                    </span>
                  )}
                  {!x.published && !x.marks_locked && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {canPublish && (
                <div className="flex flex-wrap gap-2">
                  <form action={setExamPublished}>
                    <input type="hidden" name="exam_id" value={x.id} />
                    <input
                      type="hidden"
                      name="published"
                      value={x.published ? "false" : "true"}
                    />
                    <button className="rounded-lg border px-3 py-1.5 text-sm">
                      {x.published ? "Unpublish" : "Publish results"}
                    </button>
                  </form>
                  {!x.published && (
                    <form action={setExamMarksLocked}>
                      <input type="hidden" name="exam_id" value={x.id} />
                      <input
                        type="hidden"
                        name="locked"
                        value={x.marks_locked ? "false" : "true"}
                      />
                      <button className="rounded-lg border px-3 py-1.5 text-sm">
                        {x.marks_locked ? "Unlock marks" : "Lock marks"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
