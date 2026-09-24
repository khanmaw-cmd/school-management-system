"use server";
import { revalidatePath } from "next/cache";
import { requireSchoolModule } from "@/lib/auth";
import { audit, notify } from "@/lib/audit";

async function finance() {
  return requireSchoolModule("fees", ["school_owner", "principal", "accountant"]);
}

export async function addFeeStructure(f: FormData) {
  const { supabase: s, school } = await finance();
  const { error } = await s.from("fee_structures").insert({
    school_id: school!.id,
    academic_year_id: String(f.get("year")),
    class_id: String(f.get("class") || "") || null,
    name: String(f.get("name")).trim(),
    amount: Number(f.get("amount")),
    frequency: String(f.get("frequency")),
    due_day: Number(f.get("due_day") || 0) || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/fees");
}

export async function createCharge(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const amount = Number(f.get("amount"));
  const discount = Number(f.get("discount") || 0);
  if (amount < 0 || discount < 0 || discount > amount)
    throw new Error("Invalid charge or discount");
  const { error } = await s.from("student_fee_charges").insert({
    school_id: school!.id,
    student_id: String(f.get("student")),
    academic_year_id: String(f.get("year")),
    fee_structure_id: String(f.get("fee") || "") || null,
    description: String(f.get("description")).trim(),
    charge_date: String(f.get("charge_date")),
    due_date: String(f.get("due_date")),
    amount,
    discount_amount: discount,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/fees");
}

export async function generateChargesFromPlan(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const { data, error } = await s.rpc("generate_fee_charges_from_structure", {
    p_school_id: school!.id,
    p_fee_structure_id: String(f.get("fee")),
    p_description: String(f.get("description") || ""),
    p_charge_date: String(f.get("charge_date")),
    p_due_date: String(f.get("due_date")),
    p_created_by: user.id,
  });
  if (error) throw new Error(error.message);
  await audit(s, {
    school_id: school!.id,
    actor_user_id: user.id,
    action: "generate",
    entity_type: "fee_charges",
    entity_id: String(f.get("fee")),
    summary: "Generated " + (data || 0) + " fee charges from plan",
  });
  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/dues");
}

export async function collectPayment(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const student = String(f.get("student"));
  const charge = String(f.get("charge"));
  const amount = Number(f.get("amount"));
  if (amount <= 0) throw new Error("Payment must be greater than zero");
  const { data, error } = await s.rpc("collect_fee_payment", {
    p_school_id: school!.id,
    p_student_id: student,
    p_charge_id: charge,
    p_amount: amount,
    p_payment_date: String(f.get("date")),
    p_method: String(f.get("method")),
    p_reference: String(f.get("reference") || "") || null,
  });
  if (error) throw new Error(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) throw new Error("Payment failed");
  await audit(s, {
    school_id: school!.id,
    actor_user_id: user.id,
    action: "collect",
    entity_type: "payment",
    entity_id: result.payment_id,
    summary:
      "Collected ₹" + amount + " receipt " + result.receipt_no,
    metadata: {
      student,
      charge,
      receipt: result.receipt_no,
      balance_after: result.balance_after,
    },
  });
  await notify(s, {
    school_id: school!.id,
    student_id: student,
    type: "payment",
    title: "Fee payment received",
    body:
      "Payment of ₹" +
      amount +
      " received. Receipt " +
      result.receipt_no +
      ".",
    link: "/portal/student/" + student,
  });
  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/dues");
  revalidatePath("/admin/fees/ledger");
  revalidatePath("/admin/fees/receipt/" + result.payment_id);
}

export async function addAdjustment(f: FormData) {
  const { supabase: s, school, user } = await finance();
  const student = String(f.get("student"));
  const charge = String(f.get("charge") || "") || null;
  const type = String(f.get("type"));
  const amount = Number(f.get("amount"));
  const reason = String(f.get("reason")).trim();
  if (amount <= 0 || !reason)
    throw new Error("Valid amount and reason are required");
  const { data, error } = await s.rpc("record_fee_adjustment", {
    p_school_id: school!.id,
    p_student_id: student,
    p_charge_id: charge,
    p_type: type,
    p_amount: amount,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  await audit(s, {
    school_id: school!.id,
    actor_user_id: user.id,
    action: "create",
    entity_type: "fee_adjustment",
    entity_id: String(data || charge || ""),
    summary: type + " ₹" + amount + " · " + reason,
  });
  revalidatePath("/admin/fees/ledger");
}
