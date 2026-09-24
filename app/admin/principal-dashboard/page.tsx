import Link from "next/link";
import { requireSchoolUser } from "@/lib/auth";

export default async function Page() {
  const { supabase: s, school } = await requireSchoolUser([
    "school_owner",
    "principal",
  ]);
  const id = school!.id;
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: students },
    { count: staff },
    { count: absent },
    { count: present },
    { data: payments },
    { data: charges },
    { data: exams },
    { count: openEnquiries },
  ] = await Promise.all([
    s
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", id)
      .eq("active", true),
    s
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("school_id", id)
      .eq("active", true),
    s
      .from("student_attendance")
      .select("*", { count: "exact", head: true })
      .eq("school_id", id)
      .eq("attendance_date", today)
      .eq("status", "absent"),
    s
      .from("student_attendance")
      .select("*", { count: "exact", head: true })
      .eq("school_id", id)
      .eq("attendance_date", today)
      .eq("status", "present"),
    s
      .from("fee_payments")
      .select("amount")
      .eq("school_id", id)
      .eq("payment_date", today),
    s
      .from("student_fee_charges")
      .select("amount,discount_amount,fee_payment_allocations(amount)")
      .eq("school_id", id)
      .eq("status", "open"),
    s
      .from("exams")
      .select("id,name,published,marks_locked")
      .eq("school_id", id)
      .order("created_at", { ascending: false })
      .limit(6),
    s
      .from("admission_enquiries")
      .select("*", { count: "exact", head: true })
      .eq("school_id", id)
      .in("status", ["new", "contacted", "follow_up"]),
  ]);

  const collected = (payments || []).reduce((n, x) => n + Number(x.amount), 0);
  const dues = (charges || []).reduce((n: number, x: any) => {
    const paid = (x.fee_payment_allocations || []).reduce(
      (a: number, p: any) => a + Number(p.amount),
      0
    );
    return (
      n +
      Math.max(0, Number(x.amount) - Number(x.discount_amount || 0) - paid)
    );
  }, 0);

  const inr = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">Principal Dashboard</h1>
        <p className="text-slate-500">
          {school?.name} · operational overview · {today}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {[
            ["Students", String(students || 0)],
            ["Staff", String(staff || 0)],
            ["Present today", String(present || 0)],
            ["Absent today", String(absent || 0)],
            ["Collected today", inr(collected)],
            ["Outstanding fees", inr(dues)],
          ].map(([a, b]) => (
            <div key={a} className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">{a}</p>
              <b className="mt-1 block text-2xl">{b}</b>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Academic operations</h2>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {[
                ["Attendance", "/admin/attendance"],
                ["Timetable", "/admin/timetable"],
                ["Teacher allocation", "/admin/teacher-assignments"],
                ["Exams & results", "/admin/exams"],
                ["Homework", "/admin/homework"],
              ].map(([n, h]) => (
                <Link
                  key={h}
                  href={h}
                  className="rounded-xl border p-3 text-sm hover:bg-slate-50"
                >
                  {n}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Finance & people</h2>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {[
                ["Collect fees", "/admin/fees"],
                ["Outstanding dues", "/admin/fees/dues"],
                ["Student ledger", "/admin/fees/ledger"],
                ["HR & payroll", "/admin/hr"],
                [
                  "Admissions",
                  "/admin/enquiries",
                  openEnquiries ? `${openEnquiries} open` : null,
                ],
              ].map((row) => {
                const [n, h, badge] = row as [string, string, string | null];
                return (
                  <Link
                    key={h}
                    href={h}
                    className="flex items-center justify-between rounded-xl border p-3 text-sm hover:bg-slate-50"
                  >
                    <span>{n}</span>
                    {badge && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-semibold">Recent exams</h2>
            {exams?.length ? (
              exams.map((x: any) => (
                <div
                  key={x.id}
                  className="flex items-center justify-between border-b py-3 text-sm"
                >
                  <span>{x.name}</span>
                  <span className="flex gap-1">
                    {x.published && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Published
                      </span>
                    )}
                    {x.marks_locked && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                        Locked
                      </span>
                    )}
                    {!x.published && !x.marks_locked && (
                      <span className="text-slate-400">Draft</span>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-500">No exams yet.</p>
            )}
            <Link
              href="/admin/exams"
              className="mt-3 inline-block text-sm text-blue-700"
            >
              Manage exams →
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
