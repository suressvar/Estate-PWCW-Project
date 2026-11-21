"use client";

import { ChevronRight, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface TopbarProps {
  onOpenMobileMenu?: () => void;
}

// Map path segments to readable titles
const segmentTitles: Record<string, string> = {
  "": "Dashboard",
  "daily-log": "Daily Work Log",
  "plot-crops": "Plot-Crops Tracking",
  "crop-cycles": "Crop Cycles & P&L",
  "plots": "Plots Master",
  "crops": "Crops & Activities",
  "items": "Operation Items",
  "machines": "Machinery Register",
  "machinery": "Machinery Old Logs",
  "fertilizer": "Fertilizer Logs",
  "diesel": "Diesel Tracking",
  "expenses": "Expenses & Petty Cash",
  "ledger-groups": "Ledger Groups",
  "expense-ledgers": "Ledger Accounts",
  "units": "Units of Measure",
  "purchases": "Vouchers Entry",
  "register": "Register",
  "retailers": "Retailers & Suppliers",
  "other": "Other Expenses",
  "godown": "Godown Inventory",
  "issue": "Issue to Menus",
  "movements": "Stock Movements",
  "stock-valuations": "Stock Valuations",
  "sales": "Sales Entry",
  "sales-register": "Sales Register",
  "sales-dashboard": "Sales Analytics",
  "sales-invoice": "Sales Invoice",
  "employees": "Employees Roster",
  "workers": "Daily Attendance",
  "attendance": "Attendance Register",
  "summary": "Attendance Summary",
  "salary": "Payroll",
  "calculate": "Salary Calculator",
  "leaves": "Leave Management",
  "employee-roles": "Employee Roles",
  "reports": "Reports",
  "consolidated": "Consolidated Master Report",
  "pnl": "Profit & Loss",
  "stock-inventory": "Stock Inventory",
  "users": "Users & Roles",
  "settings": "System Settings",
  "wages": "Wages",
  "plot-operations": "Plot Operations",
};

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "Estate", href: "/" },
    ...segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const label = segmentTitles[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
      return { label, href };
    }),
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)] print:hidden">
      {/* Left: Mobile Toggle & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Global Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 overflow-hidden">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    prefetch={false}
                    className="hover:text-slate-900 transition-colors font-medium truncate max-w-[140px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Search shortcut, User profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Global Quick Search Hint */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors cursor-pointer">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search ERP...</span>
          <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Vertical divider */}
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* User Identity Preview */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-lg bg-[#174D3C] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            AD
          </div>
          <div className="hidden md:flex flex-col text-left leading-none">
            <span className="text-xs font-semibold text-slate-900">Administrator</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              Estate Owner
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
