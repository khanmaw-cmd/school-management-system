import Link from "next/link";
const modules=["Students","Teachers","Classes & Sections","Attendance","Fees","Exams"];
export default function Home(){
 return <main className="min-h-screen p-6 md:p-10">
  <div className="mx-auto max-w-6xl">
   <div className="mb-8 flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-700">SCHOOL MANAGEMENT SYSTEM</p><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="mt-2 text-slate-600">Foundation workspace for daily school operations.</p></div><Link className="rounded-xl bg-slate-900 px-5 py-3 text-white" href="/login">Sign in</Link></div>
   <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{modules.map((m,i)=><div key={m} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs text-slate-500">MODULE {String(i+1).padStart(2,"0")}</p><h2 className="mt-2 text-xl font-semibold">{m}</h2><p className="mt-2 text-sm text-slate-500">Ready for Phase 1 workflow implementation.</p></div>)}</section>
  </div>
 </main>
}
