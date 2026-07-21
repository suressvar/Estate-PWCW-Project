import React from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";

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
    <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {(change || subtitle) && (
          <div className="flex items-center gap-1.5 text-xs">
            {change && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium ${
                  isPositive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-red-50 text-red-700 border border-red-200/60"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
                )}
                {change}
              </span>
            )}
            {subtitle && <span className="text-slate-500">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
