import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MapPin,
  Sprout,
  FlaskConical,
  Fuel,
  Tractor,
  Users,
  Wheat,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Trees,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Plots", href: "/plots", icon: MapPin },
  { title: "Crops", href: "/crops", icon: Sprout },
  { title: "Plot-Crops", href: "/plot-crops", icon: Sprout },
  { title: "Fertilizer", href: "/fertilizer", icon: FlaskConical },
  { title: "Diesel", href: "/diesel", icon: Fuel },
  { title: "Machinery", href: "/machinery", icon: Tractor },
  { title: "Labor", href: "/labor", icon: Users },
  { title: "Production", href: "/production", icon: Wheat },
  { title: "Sales", href: "/sales", icon: TrendingUp },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Users & Roles", href: "/users", icon: ShieldCheck },
];


export function Sidebar() {
  return (
    <aside className="w-64 border-r border-emerald-100 bg-emerald-950/95 text-emerald-100 flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-emerald-800/60 flex items-center gap-3">
        <div className="p-2 bg-emerald-600/30 rounded-lg border border-emerald-500/30 text-emerald-400">
          <Trees className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-semibold text-white tracking-wide text-lg">Ranga Estate</h1>
          <p className="text-xs text-emerald-400 font-medium">PWCW Management</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-emerald-800/50 hover:text-white text-emerald-200/90"
            >
              <Icon className="w-4 h-4 text-emerald-400" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Footer Info */}
      <div className="p-4 border-t border-emerald-800/60 bg-emerald-900/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
            RE
          </div>
          <div className="text-xs">
            <p className="font-medium text-emerald-100">Estate Admin</p>
            <p className="text-emerald-400/80 text-[10px]">admin@rangaestate.com</p>
          </div>
        </div>
        <button
          onClick={() => {
            document.cookie = "estate_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            window.location.href = "/login";
          }}
          title="Sign Out"
          className="text-xs text-emerald-300 hover:text-white px-2 py-1 bg-emerald-800/40 rounded border border-emerald-700/50 hover:bg-emerald-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

