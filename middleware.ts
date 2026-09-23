import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
 let response=NextResponse.next({request});
 const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
  cookies:{getAll(){return request.cookies.getAll()},setAll(items){items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}
 });
 const {data:{user}}=await supabase.auth.getUser();
 const protectedPath=request.nextUrl.pathname.startsWith("/admin")||request.nextUrl.pathname.startsWith("/setup");
 if(protectedPath&&!user){const url=request.nextUrl.clone();url.pathname="/login";url.searchParams.set("next",request.nextUrl.pathname);return NextResponse.redirect(url);}
 if(request.nextUrl.pathname==="/login"&&user){const url=request.nextUrl.clone();url.pathname="/admin";return NextResponse.redirect(url);}
 return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
