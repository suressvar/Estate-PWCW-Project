import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Ranga Estate - PWCW Management System",
  description: "Plot, Crop, Water, and Labor Management Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="min-h-full antialiased text-slate-900 font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}



