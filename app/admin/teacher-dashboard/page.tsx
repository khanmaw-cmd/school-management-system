import Link from "next/link";
import { requireSchoolUser } from "@/lib/auth";

const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function Page() {
  const { supabase: s, school, user } = await requireSchoolUser(["teacher"]);
  const id = school!.id;
  const weekday = new Date().getDay() || 7;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { data: staff } = await s
    .from("staff")
    .select("id,full_name")
    .eq("school_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  let assignments: any[] = [];
  let today: any[] = [];
  let homework: any[] = [];
  let pendingMarks = 0;

  if (staff) {
    const [a, t, h, marks] = await Promise.all([
      s
        .from("teacher_subject_assignments")
        .select(
          "id,class_id,section_id,subjects(name),classes(name),sections(name),academic_years(name)"
        )
        .eq("school_id", id)
        .eq("staff_id", staff.id)
        .then((x) => x.data || []),
      s
        .from("timetable_entries")
        .select(
          "id,starts_at,ends_at,room,class_id,section_id,subjects(name),classes(name),sections(name)"
        )
        .eq("school_id", id)
        .eq("staff_id", staff.id)
        .eq("weekday", weekday)
        .order("starts_at")
        .then((x) => x.data || []),
      s
        .from("homework")
        .select("id,title,due_date,classes(name),subjects(name)")
        .eq("school_id", id)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(8)
        .then((x) => x.data || []),
      s
        .from("exam_subjects")
        .select("id,exams!inner(school_id,published)")
        .eq("exams.school_id", id)
        .eq("exams.published", false)
        .limit(50)
        .then((x) => x.data?.length || 0),
    ]);
    assignments = a;
    today = t;
    homework = h;
    pendingMarks = marks;
  }

  const nextPeriod = today[0];

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">
          {greeting}
          {staff?.full_name ? `, ${staff.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-slate-500">
          {staff
            ? `${days[weekday]} · Your teaching workspace`
            : "Teacher profile is not linked to this login yet. Ask the school admin to link your staff record."}
        </p>

        {nextPeriod && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-800">Up next today</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {nextPeriod.subjects?.name} · {nextPeriod.classes?.name}{" "}
              {nextPeriod.sections?.name || ""}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {String(nextPeriod.starts_at).slice(0, 5)}–
              {String(nextPeriod.ends_at).slice(0, 5)}
              {nextPeriod.room ? ` · Room ${nextPeriod.room}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/attendance"
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white"
              >
                Take attendance
              </Link>
              <Link
                href="/admin/homework"
                className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm"
              >
                Assign homework
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <section className="rounded-2xl border bg-white p-5 lg:col-span-2">
            <h2 className="font-semibold">Today&apos;s periods · {days[weekday]}</h2>
            {today.length ? (
              <div className="mt-3 space-y-3">
                {today.map((x: any) => (
                  <div
                    key={x.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  >
                    <div>
                      <b className="text-slate-900">
                        {x.subjects?.name} · {x.classes?.name}{" "}
                        {x.sections?.name || ""}
                      </b>
                      <p className="text-sm text-slate-500">
                        {String(x.starts_at).slice(0, 5)}–
                        {String(x.ends_at).slice(0, 5)}
                        {x.room ? ` · ${x.room}` : ""}
                      </p>
                    </div>
                    <Link
                      href="/admin/attendance"
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                    >
                      Attendance
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No periods scheduled for today.
              </p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              {[
                ["Take attendance", "/admin/attendance"],
                ["Add homework", "/admin/homework"],
                ["Enter marks", "/admin/exams/marks"],
                ["My timetable", "/admin/timetable"],
                ["Notices", "/admin/notices"],
              ].map(([n, h]) => (
                <Link
                  key={h}
                  href={h}
                  className="rounded-xl border px-3 py-3 text-sm hover:bg-slate-50"
                >
                  {n}
                </Link>
              ))}
            </div>
            {pendingMarks > 0 && (
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Open exams may still need marks entry.
              </p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">My class assignments</h2>
            {assignments.length ? (
              assignments.map((x: any) => (
                <div key={x.id} className="border-b py-3 text-sm">
                  <b>{x.subjects?.name}</b>
                  <p className="text-slate-500">
                    {x.classes?.name} {x.sections?.name || "All sections"} ·{" "}
                    {x.academic_years?.name}
                  </p>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No subject assignments yet.
              </p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent homework you set</h2>
              <Link href="/admin/homework" className="text-sm text-blue-700">
                Manage →
              </Link>
            </div>
            {homework.length ? (
              homework.map((x: any) => (
                <div key={x.id} className="border-b py-3 text-sm">
                  <b>{x.title}</b>
                  <p className="text-slate-500">
                    {x.classes?.name} · {x.subjects?.name} · Due{" "}
                    {x.due_date || "—"}
                  </p>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-500">No homework created yet.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
