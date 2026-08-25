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
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between md:hidden sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <div>
            <span className="font-bold text-sm text-white block leading-none">RANGA ESTATE</span>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">Farm Management</span>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
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

        {/* Main Content Area (Offset by md:ml-64 so it never clips behind sidebar) */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen overflow-x-hidden w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
