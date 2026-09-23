import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title:"School Management System", description:"Multi-school management platform" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
