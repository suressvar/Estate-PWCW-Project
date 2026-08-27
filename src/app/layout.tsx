import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Estate - PWCW Management System",
  description: "Plot, Crop, Water, and Labor Management Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-100">
      <body className="min-h-full antialiased text-slate-900 font-sans bg-ambient-estate">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );

}



