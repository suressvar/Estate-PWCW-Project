"use client";

import {
  BarChart3,
  BookOpen,
  Boxes,
  Calendar,
  CalendarCheck,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  DollarSign,
  FileText,
  FlaskConical,
  FolderTree,
  Fuel,
  History,
  Layers,
  LayoutDashboard,
  Link2,
  LogOut,
  MapPin,
  PackageCheck,
  Receipt,
  ReceiptText,
  Scale,
  Send,
  Settings,
  ShieldCheck,
  Sprout,
  Store,
  Tractor,
  Trees,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

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
  { title: "Daily Work Log", href: "/daily-log", icon: CalendarCheck },
  {
    title: "Plots & Crops",
    icon: Trees,
    children: [
      { title: "Plot-Crops Tracking", href: "/plot-crops", icon: Link2 },
      { title: "Crop Cycles & P&L", href: "/crop-cycles", icon: CircleDollarSign },
      { title: "Plots Master", href: "/plots", icon: MapPin },
      { title: "Crops & Activities", href: "/crops", icon: Sprout },
    ],
  },
  {
    title: "Plot Operations",
    icon: Wrench,
    children: [
      { title: "Items", href: "/items", icon: Boxes },
      { title: "Machinery Register & Logs", href: "/machines", icon: Tractor },
      { title: "Fertilizer", href: "/fertilizer", icon: FlaskConical },
      { title: "Diesel", href: "/diesel", icon: Fuel },
      { title: "Machinery Old Logs", href: "/machinery", icon: Tractor },
    ],
  },
  {
    title: "Expenses & Cash",
    icon: Wallet,
    children: [
      { title: "Expenses & Petty Cash", href: "/expenses", icon: Wallet },
    ],
  },
  {
    title: "Chart of Accounts",
    icon: FolderTree,
    children: [
      { title: "Ledger Groups", href: "/ledger-groups", icon: FolderTree },
      { title: "Ledger Accounts", href: "/expense-ledgers", icon: BookOpen },
      { title: "Units", href: "/units", icon: Scale },
    ],
  },
  {
    title: "Vouchers",
    icon: Receipt,
    children: [
      { title: "Voucher Entry", href: "/purchases", icon: ReceiptText },
      { title: "Voucher Register", href: "/purchases/register", icon: BookOpen },
      { title: "Retailers / Suppliers", href: "/purchases/retailers", icon: Store },
    ],
  },
  {
    title: "Godown",
    icon: Warehouse,
    children: [
      { title: "Godown Inventory", href: "/godown", icon: PackageCheck },
      { title: "Issue to Menus", href: "/godown/issue", icon: Send },
      { title: "Stock Movements", href: "/godown/movements", icon: History },
    ],
  },
  {
    title: "Sales Module",
    icon: TrendingUp,
    children: [
      { title: "Sales Entry", href: "/sales", icon: ReceiptText },
      { title: "Sales Register", href: "/sales-register", icon: Layers },
    ],
  },
  {
    title: "HR & Payroll",
    icon: Users,
    children: [
      { title: "Employees Roster", href: "/employees", icon: Users },
      { title: "Daily Attendance & Tracking", href: "/workers", icon: CalendarCheck },
      { title: "Salary Calculator", href: "/salary/calculate", icon: DollarSign },
      { title: "Leave Management", href: "/leaves", icon: Calendar },
      { title: "Employee Roles", href: "/employee-roles", icon: ShieldCheck },
    ],
  },
  {
    title: "Financial Reports",
    icon: BarChart3,
    children: [
      { title: "Consolidated Master Report", href: "/reports/consolidated", icon: ClipboardList },
      { title: "Profit & Loss (P&L)", href: "/reports/pnl", icon: FileText },
      { title: "Estate Crop Analytics", href: "/reports", icon: BarChart3 },
    ],
  },
  { title: "Users & Roles", href: "/users", icon: ShieldCheck },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      document.cookie = "estate_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      try {
        sessionStorage.clear();
        localStorage.removeItem("estate_session");
      } catch (e) {
        console.error(e);
      }
      window.location.replace("/login");
    } catch {
      setLogoutError("Unable to sign out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

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
  }, [onMobileClose, pathname]);

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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed top-0 left-0 z-50 transition-transform duration-200 ease-in-out md:translate-x-0 print:hidden ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200/90 shrink-0">
          <Link href="/" prefetch={false} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#174D3C] group-hover:bg-[#103C30] flex items-center justify-center text-white font-bold text-sm shadow-xs transition-colors">
              E
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm tracking-tight text-slate-900 leading-none">
                ESTATE
              </span>
              <span className="text-[10px] text-[#16805D] font-semibold tracking-wider uppercase mt-0.5">
                PWCW ERP
              </span>
            </div>
          </Link>

          {/* Close button on Mobile */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 md:hidden transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Enterprise Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isOpen = Boolean(openMenus[item.title]);

            if (hasChildren && item.children) {
              const isAnyChildActive = item.children.some((c) => c.href === pathname);

              return (
                <div key={item.title} className="space-y-0.5">
                  {/* Collapsible Section Header */}
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-[13px] rounded-lg transition-all group cursor-pointer ${
                      isAnyChildActive
                        ? "text-[#174D3C] bg-[#EAF3EE] font-semibold"
                        : isOpen
                        ? "text-slate-900 bg-slate-50 font-medium"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isAnyChildActive
                            ? "text-[#174D3C]"
                            : isOpen
                            ? "text-slate-700"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-slate-600" : "text-slate-400"
                      }`}
                    />
                  </button>

                  {/* Submenu Items */}
                  {isOpen && (
                    <div className="ml-3.5 pl-2.5 border-l border-slate-200 space-y-0.5 py-0.5 animate-in slide-in-from-top-1 duration-150">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            prefetch={false}
                            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-all ${
                              isChildActive
                                ? "bg-[#174D3C] text-white font-semibold shadow-2xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                            }`}
                          >
                            <ChildIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isChildActive ? "text-white" : "text-slate-400"
                              }`}
                            />
                            <span className="truncate">{child.title}</span>
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
                prefetch={false}
                className={`flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-all ${
                  isActive
                    ? "bg-[#174D3C] text-white font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Account & Logout */}
        <div className="p-3 border-t border-slate-200/90 bg-slate-50/50 shrink-0">
          {logoutError && (
            <p role="alert" className="text-xs text-rose-600 mb-2 font-medium">
              {logoutError}
            </p>
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200/70 hover:border-rose-200 bg-white transition-all shadow-2xs group cursor-pointer"
            title="Log Out"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
              <span>Logout</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">
              {isLoggingOut ? "Exiting..." : "End Session"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
