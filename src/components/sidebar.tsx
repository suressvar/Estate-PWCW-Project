"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Sprout,
  FlaskConical,
  Fuel,
  Tractor,
  Users,
  Wheat,
  BarChart3,
  ShieldCheck,
  Trees,
  ChevronDown,
  Link2,
  Wrench,
  ReceiptText,
  TrendingUp,
  ShoppingBag,
  FolderTree,
  BookOpen,
  Calendar,
  DollarSign,
  Layers,
  FileText,
  UserCheck,
  Receipt,
  Award,
  X,
  LogOut,
} from "lucide-react";

export interface SubNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SubNavItem[];
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    title: "Plots & Crops",
    icon: Trees,
    children: [
      { title: "Plot-Crops Tracking", href: "/plot-crops", icon: Link2 },
      { title: "Plots Master", href: "/plots", icon: MapPin },
      { title: "Crops & Activities", href: "/crops", icon: Sprout },
    ],
  },
  {
    title: "Plot Operations",
    icon: Wrench,
    children: [
      { title: "Fertilizer", href: "/fertilizer", icon: FlaskConical },
      { title: "Diesel", href: "/diesel", icon: Fuel },
      { title: "Machinery", href: "/machinery", icon: Tractor },
      { title: "Production", href: "/production", icon: Wheat },
    ],
  },
  {
    title: "Chart of Accounts",
    icon: FolderTree,
    children: [
      { title: "Ledger Groups", href: "/ledger-groups", icon: FolderTree },
      { title: "Ledger Accounts", href: "/expense-ledgers", icon: BookOpen },
    ],
  },
  {
    title: "Vouchers (Purchases)",
    icon: ShoppingBag,
    children: [
      { title: "Vouchers Hub", href: "/vouchers", icon: ShoppingBag },
      { title: "Feed & Nutrition", href: "/vouchers/feed", icon: Layers },
      { title: "Farm Medicine & Care", href: "/vouchers/medicine", icon: ReceiptText },
      { title: "Biologics & Immunity", href: "/vouchers/vaccine", icon: ReceiptText },
      { title: "Other Vouchers", href: "/vouchers/other", icon: Receipt },
    ],
  },
  {
    title: "Sales Module",
    icon: TrendingUp,
    children: [
      { title: "Sales Entry", href: "/sales", icon: TrendingUp },
      { title: "Harvest Sales Register", href: "/sales-register/other", icon: Layers },
      { title: "Sales Analytics Dashboard", href: "/sales-dashboard", icon: Award },
    ],
  },
  {
    title: "HR & Payroll",
    icon: Users,
    children: [
      { title: "Employees Roster", href: "/employees", icon: Users },
      { title: "Attendance Grid", href: "/attendance", icon: Calendar },
      { title: "Attendance Summary", href: "/attendance/summary", icon: UserCheck },
      { title: "Salary Calculator", href: "/salary/calculate", icon: DollarSign },
      { title: "Wages Register", href: "/wages", icon: DollarSign },
      { title: "Leave Management", href: "/leaves", icon: Calendar },
      { title: "Employee Roles", href: "/employee-roles", icon: ShieldCheck },
    ],
  },
  {
    title: "Inventory & Stocks",
    icon: Layers,
    children: [
      { title: "Stock Inventory Report", href: "/reports/stock-inventory", icon: Layers },
      { title: "Periodic Valuations", href: "/stock-valuations", icon: FileText },
    ],
  },
  {
    title: "Financial Reports",
    icon: BarChart3,
    children: [
      { title: "Profit & Loss (P&L)", href: "/reports/pnl", icon: FileText },
      { title: "Estate Crop Analytics", href: "/reports", icon: BarChart3 },
    ],
  },
  { title: "Users & Roles", href: "/users", icon: ShieldCheck },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Clear auth state
    document.cookie = "estate_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    try {
      sessionStorage.clear();
      localStorage.removeItem("estate_session");
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  // Dynamic state: Submenus start collapsed by default unless active route belongs to it
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children) {
        // Open only if the current route belongs to this group
        const isChildActive = item.children.some((child) => child.href === pathname);
        initialState[item.title] = isChildActive;
      }
    });
    return initialState;
  });

  // Automatically expand parent menu if active route changes
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => child.href === pathname);
        if (isChildActive) {
          setOpenMenus((prev) => ({ ...prev, [item.title]: true }));
        }
      }
    });
    if (onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed top-0 left-0 z-50 text-slate-300 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 group-hover:bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm transition-colors">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-none">
                RANGA ESTATE
              </span>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase mt-0.5">
                Farm Management
              </span>
            </div>
          </Link>

          {/* Close button on Mobile */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isOpen = Boolean(openMenus[item.title]);

            if (hasChildren && item.children) {
              const isAnyChildActive = item.children.some((c) => c.href === pathname);

              return (
                <div key={item.title} className="space-y-1">
                  {/* Main Accordion Header (Click / Touch to toggle submenus) */}
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all group cursor-pointer ${
                      isAnyChildActive
                        ? "text-white bg-slate-800/90 shadow-xs border border-slate-700/60"
                        : isOpen
                        ? "text-white bg-slate-800/50"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isAnyChildActive || isOpen ? "text-emerald-400" : "text-slate-400 group-hover:text-white"
                        }`}
                      />
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-emerald-400" : ""
                      }`}
                    />
                  </button>

                  {/* Sub Menu Links (Collapsible) */}
                  {isOpen && (
                    <div className="pl-4 pr-1 space-y-1 border-l-2 border-emerald-800/60 ml-4 py-1.5 animate-in slide-in-from-top-2 duration-200">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                              isChildActive
                                ? "bg-emerald-800 text-white font-bold shadow-xs border border-emerald-600/40"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                          >
                            <ChildIcon className={`w-3.5 h-3.5 ${isChildActive ? "text-emerald-300" : "text-slate-500"}`} />
                            <span>{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.title}
                href={item.href || "#"}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-800 text-white font-bold shadow-xs border border-emerald-600/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-300" : "text-slate-400"}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-700 flex items-center justify-center text-xs font-bold text-emerald-200 shrink-0 shadow-xs">
                A
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate">Administrator</span>
                <span className="text-[10px] text-emerald-400 font-medium truncate">All Modules Active</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-all shrink-0 group flex items-center justify-center"
              title="Log Out of Estate Application"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-rose-400" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
