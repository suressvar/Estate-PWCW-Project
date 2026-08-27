"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link2, MapPin, Sprout } from "lucide-react";

interface PlotsCropsNavProps {
  stats?: {
    plotsCount?: number;
    cropsCount?: number;
    associationsCount?: number;
  };
}

export function PlotsCropsNav({ stats }: PlotsCropsNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      title: "Plot-Crops Tracking",
      description: "Assign & track multiple crops per plot",
      href: "/plot-crops",
      icon: Link2,
      count: stats?.associationsCount,
    },
    {
      title: "Land Plots Master",
      description: "Acreages, sectors & land boundaries",
      href: "/plots",
      icon: MapPin,
      count: stats?.plotsCount,
    },
    {
      title: "Crops & Activities",
      description: "Harvest crops & field labor tasks",
      href: "/crops",
      icon: Sprout,
      count: stats?.cropsCount,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-1.5 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-md shrink-0 ${
                    isActive
                      ? "bg-white/15 text-emerald-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate text-left">
                  <div className="font-bold truncate">{tab.title}</div>
                </div>
              </div>

              {typeof tab.count === "number" && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-emerald-950/60 text-emerald-200"
                      : "bg-slate-200 text-slate-700"
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
