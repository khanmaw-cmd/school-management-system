"use server";
import { revalidatePath } from "next/cache";
import { requireSchoolModule, requireSchoolUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

const finance = () => requireSchoolModule("hr_payroll", ["school_owner", "principal", "accountant"]);

export async function saveSalary(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const staff = String(f.get("staff"));
  const { data: staffRow } = await s
    .from("staff")
    .select("id")
    .eq("id", staff)
    .eq("school_id", school!.id)
    .eq("active", true)
    .maybeSingle();
  if (!staffRow) throw new Error("Invalid staff member");

  const basic = Number(f.get("basic") || 0);
  const allowances = Number(f.get("allowances") || 0);
  const deductions = Number(f.get("deductions") || 0);
  if (basic + allowances - deductions < 0) {
    throw new Error("Net salary cannot be negative");
  }

  const { error } = await s.from("salary_structures").upsert(
    {
      school_id: school!.id,
      staff_id: staff,
      basic,
      allowances,
      deductions,
      effective_from: String(f.get("effective")),
    },
    { onConflict: "staff_id" }
  );
  if (error) throw new Error(error.message);

  await audit(s, {
    school_id: school!.id,
    actor_user_id: user.id,
    action: "update",
    entity_type: "salary",
    entity_id: staff,
    summary: "Updated staff salary structure",
  });
  revalidatePath("/admin/hr");
}

export async function generatePayroll(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const monthRaw = String(f.get("month"));
  // Ensure first-of-month date for the RPC
  const month = monthRaw.length === 7 ? `${monthRaw}-01` : monthRaw;

  const { data: runId, error } = await s.rpc("generate_payroll_run", {
    p_school_id: school!.id,
    p_pay_month: month,
    p_created_by: user.id,
  });

  if (error) throw new Error(error.message);
  if (!runId) throw new Error("Payroll generation failed");

  await audit(s, {
    school_id: school!.id,
    actor_user_id: user.id,
    action: "generate",
    entity_type: "payroll",
    entity_id: runId,
    summary: "Generated payroll for " + month,
  });
  revalidatePath("/admin/hr");
}

export async function finalizePayroll(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const id = String(f.get("run_id"));
  const { error } = await s.rpc("set_payroll_status", {
    p_run_id: id,
    p_status: "finalized",
  });
  if (error) throw new Error(error.message);

  await audit(s, {
    school_id: school!.id,
    actor_user_id: user.id,
    action: "finalize",
    entity_type: "payroll",
    entity_id: id,
    summary: "Finalized payroll",
  });
  revalidatePath("/admin/hr");
}

export async function markPayrollPaid(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const id = String(f.get("run_id"));
  const { error } = await s.rpc("set_payroll_status", {
    p_run_id: id,
    p_status: "paid",
  });
  if (error) throw new Error(error.message);

  await audit(s, {
    school_id: school!.id,
    actor_user_id: user.id,
    action: "pay",
    entity_type: "payroll",
    entity_id: id,
    summary: "Marked payroll paid",
  });
  revalidatePath("/admin/hr");
}

export async function payPayrollItem(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const id = String(f.get("item_id"));
  const { error } = await s.rpc("pay_payroll_item", {
    p_item_id: id,
    p_reference_no: String(f.get("reference") || "") || null,
  });
  if (error) throw new Error(error.message);

  await audit(s, {
    school_id: school!.id,
    actor_user_id: user.id,
    action: "pay",
    entity_type: "payroll_item",
    entity_id: id,
    summary: "Recorded staff payroll payment",
  });
  revalidatePath("/admin/hr");
  revalidatePath("/admin/hr/run/" + String(f.get("run_id")));
}
