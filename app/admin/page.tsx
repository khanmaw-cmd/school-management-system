import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const {data:membership}=await supabase.from("school_memberships").select("role,schools(id,name,code)").eq("user_id",user.id).eq("active",true).limit(1).maybeSingle();
 if(!membership) redirect("/setup");
 const school=Array.isArray(membership.schools)?membership.schools[0]:membership.schools;
 const cards=[["Students","/admin/students"],["Classes & Sections","/admin/classes"],["Teachers","/admin/teachers"],["Attendance","/admin/attendance"],["Fees","#"],["Exams","#"]];
 return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-6xl"><header className="mb-8"><p className="text-sm font-semibold text-blue-700">{school?.name??"School"}</p><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="mt-2 text-slate-500">Signed in as {membership.role.replaceAll("_"," ")} · {user.email}</p></header><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([name,href])=><Link key={name} href={href} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"><h2 className="text-lg font-semibold">{name}</h2><p className="mt-2 text-sm text-slate-500">Open module →</p></Link>)}</section></div></main>;
}
