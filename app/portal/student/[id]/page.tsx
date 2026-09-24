import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StudentPortal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await createClient();
  const { data: st } = await s
    .from("students")
    .select("id,school_id,admission_no,first_name,last_name")
    .eq("id", id)
    .maybeSingle();
  if (!st) notFound();

  const [
    { data: att },
    { data: payments },
    { data: marksData },
    { data: enroll },
    { data: charges },
    { data: notices },
  ] = await Promise.all([
    s
      .from("student_attendance")
      .select("status,attendance_date")
      .eq("student_id", id)
      .order("attendance_date", { ascending: false })
      .limit(40),
    s
      .from("fee_payments")
      .select("amount,payment_date,receipt_no,payment_method")
      .eq("student_id", id)
      .order("payment_date", { ascending: false })
      .limit(10),
    s
      .from("exam_marks")
      .select(
        "marks,absent,exam_subjects(max_marks,pass_marks,subjects(name),exams(name,published))"
      )
      .eq("student_id", id),
    s
      .from("student_enrollments")
      .select("class_id,section_id,academic_year_id")
      .eq("student_id", id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    s
      .from("student_fee_charges")
      .select(
        "id,description,due_date,amount,discount_amount,status,fee_payment_allocations(amount)"
      )
      .eq("student_id", id)
      .in("status", ["open", "paid"])
      .order("due_date", { ascending: true }),
    s
      .from("notices")
      .select("id,title,body,published_at")
      .eq("school_id", st.school_id)
      .order("published_at", { ascending: false })
      .limit(5),
  ]);

  const marks = (marksData || []).filter(
    (x: any) => x.exam_subjects?.exams?.published === true
  );

  let hw: any[] = [];
  if (enroll) {
    let q = s
      .from("homework")
      .select("id,title,description,due_date,subjects(name)")
      .eq("school_id", st.school_id)
      .eq("academic_year_id", enroll.academic_year_id)
      .eq("class_id", enroll.class_id);
    if (enroll.section_id) {
      q = q.or("section_id.is.null,section_id.eq." + enroll.section_id);
    }
    q = q.order("created_at", { ascending: false }).limit(10);
    const { data } = await q;
    hw = data || [];
  }

  const count = (v: string) => att?.filter((x) => x.status === v).length || 0;

  const chargeRows = (charges || []).map((x: any) => {
    const paid = (x.fee_payment_allocations || []).reduce(
      (a: number, p: any) => a + Number(p.amount),
      0
    );
    const gross = Number(x.amount) - Number(x.discount_amount || 0);
    const remaining = Math.max(0, gross - paid);
    return { ...x, paid, remaining };
  });
  const outstanding = chargeRows.reduce(
    (n: number, x: any) => n + x.remaining,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4">
          <Link href="/portal" className="text-sm text-blue-700 hover:underline">
            ← All children
          </Link>
        </div>
        <h1 className="text-3xl font-bold">
          {st.first_name} {st.last_name}
        </h1>
        <p className="text-slate-500">Admission No: {st.admission_no}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          <div className="rounded-2xl border bg-white p-5 md:col-span-2">
            <p className="text-sm text-slate-500">Fee outstanding</p>
            <b className="text-2xl">₹{outstanding.toLocaleString("en-IN")}</b>
          </div>
          {["present", "absent", "late", "leave", "half_day"].map((v) => (
            <div key={v} className="rounded-2xl border bg-white p-5">
              <p className="text-sm capitalize text-slate-500">
                {v.replace("_", "-")}
              </p>
              <b className="text-2xl">{count(v)}</b>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Notices</h2>
            {notices?.length ? (
              notices.map((x: any) => (
                <div key={x.id} className="border-b py-3">
                  <b>{x.title}</b>
                  <p className="mt-1 text-sm text-slate-600">{x.body}</p>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-500">No recent notices.</p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Homework</h2>
            {hw.length ? (
              hw.map((x: any) => (
                <div key={x.id} className="border-b py-3">
                  <b>{x.title}</b>
                  <p className="text-sm text-slate-500">
                    {x.subjects?.name || ""} · Due {x.due_date || "not set"}
                  </p>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-500">No homework assigned.</p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Fee charges</h2>
            {chargeRows.length ? (
              chargeRows.map((x: any) => (
                <div
                  key={x.id}
                  className="grid grid-cols-3 gap-2 border-b py-3 text-sm"
                >
                  <span className="col-span-2">
                    {x.description || "Fee"}
                    <span className="block text-xs text-slate-500">
                      Due {x.due_date || "—"}
                    </span>
                  </span>
                  <b className="text-right">
                    {x.remaining > 0
                      ? `₹${x.remaining.toLocaleString("en-IN")} due`
                      : "Paid"}
                  </b>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-500">No fee charges.</p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Recent payments</h2>
            {payments?.length ? (
              payments.map((x) => (
                <div
                  key={x.receipt_no}
                  className="grid grid-cols-3 border-b py-3 text-sm"
                >
                  <span>{x.receipt_no}</span>
                  <span>{x.payment_date}</span>
                  <b>₹{Number(x.amount).toLocaleString("en-IN")}</b>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-500">No payments yet.</p>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold">Published results</h2>
            {marks.length ? (
              marks.map((x: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 border-b py-3 text-sm md:grid-cols-4"
                >
                  <span>{x.exam_subjects?.exams?.name}</span>
                  <span>{x.exam_subjects?.subjects?.name}</span>
                  <span>
                    {x.absent
                      ? "Absent"
                      : `${x.marks} / ${x.exam_subjects?.max_marks}`}
                  </span>
                  <span>
                    {!x.absent &&
                    Number(x.marks) >= Number(x.exam_subjects?.pass_marks)
                      ? "Pass"
                      : x.absent
                        ? "—"
                        : "Needs review"}
                  </span>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No published results yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
