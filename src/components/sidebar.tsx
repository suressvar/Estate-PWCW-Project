"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Sprout,
  Tractor,
  LineChart,
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  PieChart,
  ShieldCheck,
  ChevronDown,
  X,
  LogOut,
  Sparkles,
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
  { title: "Dashboard", href: "/", icon: Home },
  {
    title: "Plots & Crops",
    icon: Sprout,
    children: [
      { title: "Plot-Crops Tracking", href: "/plot-crops", icon: Sprout },
      { title: "Plots Master", href: "/plots", icon: Sprout },
      { title: "Crops & Activities", href: "/crops", icon: Sprout },
    ],
  },
  {
    title: "Plot Operations",
    icon: Tractor,
    children: [
      { title: "Fertilizer", href: "/fertilizer", icon: Tractor },
      { title: "Diesel", href: "/diesel", icon: Tractor },
      { title: "Machinery", href: "/machinery", icon: Tractor },
      { title: "Production", href: "/production", icon: Tractor },
    ],
  },
  {
    title: "Chart of Accounts",
    icon: LineChart,
    children: [
      { title: "Ledger Groups", href: "/ledger-groups", icon: LineChart },
      { title: "Ledger Accounts", href: "/expense-ledgers", icon: LineChart },
    ],
  },
  {
    title: "Vouchers (Purchases)",
    icon: ShoppingCart,
    children: [
      { title: "Vouchers Hub", href: "/vouchers", icon: ShoppingCart },
      { title: "Feed & Nutrition", href: "/vouchers/feed", icon: ShoppingCart },
      { title: "Farm Medicine & Care", href: "/vouchers/medicine", icon: ShoppingCart },
      { title: "Biologics & Immunity", href: "/vouchers/vaccine", icon: ShoppingCart },
      { title: "Other Vouchers", href: "/vouchers/other", icon: ShoppingCart },
    ],
  },
  {
    title: "Sales Module",
    icon: TrendingUp,
    children: [
      { title: "Sales Entry", href: "/sales", icon: TrendingUp },
      { title: "Harvest Sales Register", href: "/sales-register/other", icon: TrendingUp },
      { title: "Sales Analytics Dashboard", href: "/sales-dashboard", icon: TrendingUp },
    ],
  },
  {
    title: "HR & Payroll",
    icon: Users,
    children: [
      { title: "Employees Roster", href: "/employees", icon: Users },
      { title: "Attendance Grid", href: "/attendance", icon: Users },
      { title: "Attendance Summary", href: "/attendance/summary", icon: Users },
      { title: "Salary Calculator", href: "/salary/calculate", icon: Users },
      { title: "Wages Register", href: "/wages", icon: Users },
      { title: "Leave Management", href: "/leaves", icon: Users },
      { title: "Employee Roles", href: "/employee-roles", icon: Users },
    ],
  },
  {
    title: "Inventory & Stocks",
    icon: Package,
    children: [
      { title: "Stock Inventory Report", href: "/reports/stock-inventory", icon: Package },
      { title: "Periodic Valuations", href: "/stock-valuations", icon: Package },
    ],
  },
  {
    title: "Financial Reports",
    icon: PieChart,
    children: [
      { title: "Profit & Loss (P&L)", href: "/reports/pnl", icon: PieChart },
      { title: "Estate Crop Analytics", href: "/reports", icon: PieChart },
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
    document.cookie = "estate_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    try {
      sessionStorage.clear();
      localStorage.removeItem("estate_session");
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  // Track accordion expand state
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => child.href === pathname);
        initialState[item.title] = isChildActive;
      }
    });
    return initialState;
  });

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
          className="fixed inset-0 bg-[#092b18]/80 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Sidebar Container matching picture */}
      <aside
        className={`w-64 bg-gradient-to-b from-[#0e3b22] via-[#092b18] to-[#051a0e] flex flex-col h-screen fixed top-0 left-0 z-50 text-white transition-transform duration-300 ease-in-out md:translate-x-0 select-none ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 pt-2">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Circular Green Emblem with Leaf */}
            <div className="w-11 h-11 rounded-full bg-[#16562f] border border-[#34c759]/40 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-white fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A9.45 9.45 0 0 0 17 8z" />
                <path d="M7.5 12C9 7 13 4 19 3c-1.5 5-4.5 9-9.5 10.5L7.5 12z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wide text-white leading-tight">
                RANGA ESTATE
              </span>
              <span className="text-[9px] text-[#88e39f] font-bold tracking-widest uppercase">
                Farm Management
              </span>
            </div>
          </Link>

          {/* Close button on Mobile */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-[#88e39f] hover:text-white hover:bg-white/10 md:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isOpen = Boolean(openMenus[item.title]);
            const isSelfActive = pathname === item.href;
            const isAnyChildActive = hasChildren && item.children?.some((c) => c.href === pathname);
            const isActive = isSelfActive || isAnyChildActive;

            if (hasChildren && item.children) {
              return (
                <div key={item.title} className="space-y-1">
                  {/* Parent Accordion Button */}
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all group cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#1eb854] to-[#5cdb50] text-white shadow-md font-bold"
                        : "text-white/85 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon Tile */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isActive ? "bg-white/25 text-white" : "bg-white/10 text-white/90 group-hover:bg-white/15"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs">{item.title}</span>
                    </div>

                    <ChevronDown
                      className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>

                  {/* Submenu Drawer */}
                  {isOpen && (
                    <div className="pl-6 pr-1 space-y-1 border-l-2 border-[#1eb854]/40 ml-4 py-1.5 animate-in slide-in-from-top-1 duration-150">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                              isChildActive
                                ? "bg-[#1eb854] text-white font-bold shadow-xs"
                                : "text-white/75 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <ChildIcon className={`w-3.5 h-3.5 ${isChildActive ? "text-white" : "text-[#88e39f]"}`} />
                            <span>{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href || "#"}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-2xl transition-all group ${
                  isSelfActive
                    ? "bg-gradient-to-r from-[#1eb854] to-[#5cdb50] text-white shadow-md font-bold"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelfActive ? "bg-white/25 text-white" : "bg-white/10 text-white/90 group-hover:bg-white/15"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Profile with Dropdown & Logout matching picture */}
        <div className="p-3 bg-[#051a0e]/95 border-t border-white/10">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#1eb854] flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs">
                A
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate">Administrator</span>
                <span className="text-[10px] text-white/60 font-medium truncate">Super Admin</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-white/60 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className="w-3.5 h-3.5 text-white/60" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
