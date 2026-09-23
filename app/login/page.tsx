"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function Login(){
 const [message,setMessage]=useState(""); const [loading,setLoading]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setLoading(true);const f=new FormData(e.currentTarget);const {error}=await createClient().auth.signInWithPassword({email:String(f.get("email")),password:String(f.get("password"))});setLoading(false);setMessage(error?error.message:"Signed in successfully.");if(!error) window.location.href="/";}
 return <main className="grid min-h-screen place-items-center p-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold">School Login</h1><p className="mt-2 text-sm text-slate-500">Use your authorized school account.</p><label className="mt-6 block text-sm font-medium">Email</label><input name="email" type="email" required className="mt-2 w-full rounded-xl border p-3"/><label className="mt-4 block text-sm font-medium">Password</label><input name="password" type="password" required className="mt-2 w-full rounded-xl border p-3"/><button disabled={loading} className="mt-6 w-full rounded-xl bg-slate-900 p-3 font-semibold text-white">{loading?"Signing in...":"Sign in"}</button>{message&&<p className="mt-4 text-sm">{message}</p>}</form></main>
}
