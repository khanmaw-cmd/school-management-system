"use client";
import { FormEvent,useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Setup(){
 const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const f=new FormData(e.currentTarget);const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user){location.href="/login";return;}
 const {error}=await supabase.rpc("create_school_with_owner",{school_name:String(f.get("name")),school_code:String(f.get("code")).toUpperCase(),owner_name:String(f.get("owner"))});
 setBusy(false);if(error){setMessage(error.message);return;}location.href="/admin";}
 return <main className="grid min-h-screen place-items-center p-6"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm"><p className="text-sm font-semibold text-blue-700">FIRST-TIME SETUP</p><h1 className="mt-1 text-2xl font-bold">Create your school</h1><p className="mt-2 text-sm text-slate-500">This creates the school workspace and assigns you as School Owner.</p><label className="mt-6 block text-sm font-medium">School name</label><input name="name" required className="mt-2 w-full rounded-xl border p-3"/><label className="mt-4 block text-sm font-medium">School code</label><input name="code" required maxLength={20} className="mt-2 w-full rounded-xl border p-3" placeholder="e.g. UEA001"/><label className="mt-4 block text-sm font-medium">Owner / administrator name</label><input name="owner" required className="mt-2 w-full rounded-xl border p-3"/><button disabled={busy} className="mt-6 w-full rounded-xl bg-slate-900 p-3 font-semibold text-white">{busy?"Creating...":"Create school"}</button>{message&&<p className="mt-4 text-sm text-red-600">{message}</p>}</form></main>;
}
