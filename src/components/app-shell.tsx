"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeNavigation = useCallback(() => setMobileSidebarOpen(false), []);
  const openNavigation = useCallback(() => setMobileSidebarOpen(true), []);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // A restored document must pass server authentication again instead of
    // displaying a pre-logout browser snapshot.
    const onRestore = (event: PageTransitionEvent) => {
      if (event.persisted && pathname !== "/login") window.location.reload();
    };
    window.addEventListener("pageshow", onRestore);
    return () => window.removeEventListener("pageshow", onRestore);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full text-slate-900 antialiased overflow-x-hidden">
      {/* Sidebar (Desktop Persistent Fixed, Mobile Drawer) */}
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={closeNavigation} />

      {/* Main Content Area (Offset by md:ml-64 on desktop) */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen max-w-full overflow-x-hidden print:ml-0">
        {/* Global ERP Topbar */}
        <Topbar onOpenMobileMenu={openNavigation} />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden w-full max-w-full print:p-0 print:m-0 print:min-h-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
