"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Menu } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-ambient-estate flex flex-col w-full">
      {/* Mobile Top Header */}
      <header className="h-16 bg-[#14532D] border-b border-[#0E3D20] px-4 flex items-center justify-between md:hidden sticky top-0 z-30 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E6C36] flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          <div>
            <span className="font-bold text-base text-white block leading-none">ESTATE</span>
            <span className="text-xs text-emerald-300 font-medium tracking-wider uppercase mt-0.5 block">PWCW Management</span>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-xl bg-[#0E3D20] text-emerald-100 hover:text-white hover:bg-emerald-800 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex w-full">
        {/* Desktop Fixed & Mobile Drawer Sidebar */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area (Offset by md:ml-64, removed completely during print) */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen overflow-x-hidden w-full max-w-full print:ml-0 print:p-0 print:m-0 print:min-h-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
