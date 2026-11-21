"use client";

import { CircleDollarSign, Link2, MapPin, Sprout } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PlotsCropsNavProps {
  stats?: {
    plotsCount?: number;
    cropsCount?: number;
    associationsCount?: number;
    cyclesCount?: number;
  };
}

export function PlotsCropsNav({ stats }: PlotsCropsNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      title: "Plot-Crops Tracking",
      href: "/plot-crops",
      icon: Link2,
      count: stats?.associationsCount,
    },
    {
      title: "Crop Cycles & P&L",
      href: "/crop-cycles",
      icon: CircleDollarSign,
      count: stats?.cyclesCount,
    },
    {
      title: "Land Plots Master",
      href: "/plots",
      icon: MapPin,
      count: stats?.plotsCount,
    },
    {
      title: "Crops & Activities",
      href: "/crops",
      icon: Sprout,
      count: stats?.cropsCount,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-1 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                isActive
                  ? "bg-[#174D3C] text-white font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1 rounded-md shrink-0 ${
                    isActive ? "bg-white/15 text-white" : "text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate text-left">
                  <div className="truncate font-semibold">{tab.title}</div>
                </div>
              </div>

              {typeof tab.count === "number" && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
