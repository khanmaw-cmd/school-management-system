import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolModule } from "@/lib/auth";
import PrintButton from "@/components/print-button";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase: s, school } = await requireSchoolModule("fees", [
    "school_owner",
    "principal",
    "accountant",
  ]);

  const { data: payment } = await s
    .from("fee_payments")
    .select(
      "id,amount,payment_date,payment_method,reference_no,receipt_no,notes,students(admission_no,first_name,last_name),fee_payment_allocations(amount,student_fee_charges(description,due_date))"
    )
    .eq("id", id)
    .eq("school_id", school!.id)
    .maybeSingle();

  if (!payment) notFound();

  const st: any = Array.isArray(payment.students)
    ? payment.students[0]
    : payment.students;
  const allocs: any[] = payment.fee_payment_allocations || [];

  return (
    <main className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
          <Link href="/admin/fees" className="text-sm text-blue-700">
            ← Finance
          </Link>
          <PrintButton />
        </div>

        <article className="rounded-2xl border bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <header className="border-b pb-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Fee receipt
            </p>
            <h1 className="mt-1 text-2xl font-bold">{school?.name}</h1>
            <p className="mt-2 font-mono text-sm text-slate-600">
              {payment.receipt_no}
            </p>
          </header>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Student</dt>
              <dd className="font-semibold">
                {st?.first_name} {st?.last_name}
              </dd>
              <dd className="text-slate-500">{st?.admission_no}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Date</dt>
              <dd className="font-semibold">{payment.payment_date}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Method</dt>
              <dd className="font-semibold capitalize">{payment.payment_method}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Reference / UTR</dt>
              <dd className="font-semibold">{payment.reference_no || "—"}</dd>
            </div>
          </dl>

          <table className="mt-8 w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">Due</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {allocs.map((a: any, i: number) => {
                const ch = Array.isArray(a.student_fee_charges)
                  ? a.student_fee_charges[0]
                  : a.student_fee_charges;
                return (
                  <tr key={i} className="border-b">
                    <td className="py-3">{ch?.description || "Fee"}</td>
                    <td className="py-3">{ch?.due_date || "—"}</td>
                    <td className="py-3 text-right">
                      ₹{Number(a.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
              {!allocs.length && (
                <tr className="border-b">
                  <td className="py-3" colSpan={2}>
                    Fee payment
                  </td>
                  <td className="py-3 text-right">
                    ₹{Number(payment.amount).toLocaleString("en-IN")}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-4 font-semibold">
                  Total received
                </td>
                <td className="pt-4 text-right text-lg font-bold">
                  ₹{Number(payment.amount).toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>

          <p className="mt-10 text-center text-xs text-slate-400">
            Computer-generated receipt · {school?.name}
          </p>
        </article>
      </div>
    </main>
  );
}
