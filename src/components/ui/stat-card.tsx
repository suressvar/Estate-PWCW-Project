import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function StatCard({ title, value, change, isPositive, subtitle, icon: Icon }: StatCardProps) {
  return (
    <div className="glass-panel p-5 rounded-xl transition-all duration-200 hover:shadow-md flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">{title}</span>
        {Icon && (
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-800 border border-emerald-500/20">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {change && (
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                isPositive
                  ? "bg-emerald-100/90 text-emerald-900 border border-emerald-300"
                  : "bg-red-100/90 text-red-900 border border-red-300"
              }`}
            >
              {change}
            </span>
          </div>
        )}
        {subtitle && <p className="text-[11px] text-slate-600 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}
