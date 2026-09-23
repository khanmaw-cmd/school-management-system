import {requireSchoolModule} from "@/lib/auth";
export default async function ModuleLayout({children}:{children:React.ReactNode}){await requireSchoolModule("transport");return children;}
