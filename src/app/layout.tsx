import { AppShell } from "@/components/app-shell";
import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full bg-gray-50 overflow-x-hidden">
      <body className="min-h-full antialiased text-gray-900 font-sans bg-[#F9FAFB] overflow-x-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );

}



