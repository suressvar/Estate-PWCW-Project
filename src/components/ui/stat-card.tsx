import React from "react";

export type StatCardVariant = "default" | "emerald" | "violet" | "rose" | "amber" | "cyan" | "blue";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  trend?: { value: string; isPositive?: boolean };
  subtitle?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  variant?: StatCardVariant;
  badge?: string;
  trendPeriod?: string;
}

const variantStyles: Record<
  StatCardVariant,
  {
    iconBg: string;
    iconColor: string;
    borderHover: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  default: {
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
    borderHover: "hover:border-slate-300",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
  },
  emerald: {
    iconBg: "bg-[#EAF3EE]",
    iconColor: "text-[#174D3C]",
    borderHover: "hover:border-[#174D3C]/30",
    badgeBg: "bg-[#EAF3EE]",
    badgeText: "text-[#16805D]",
  },
  violet: {
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
    borderHover: "hover:border-violet-300",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    borderHover: "hover:border-rose-300",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    borderHover: "hover:border-amber-300",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
  },
  cyan: {
    iconBg: "bg-sky-50",
    iconColor: "text-sky-700",
    borderHover: "hover:border-sky-300",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-800",
  },
  blue: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    borderHover: "hover:border-blue-300",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-800",
  },
};

export function StatCard({
  title,
  value,
  change,
  isPositive,
  trend,
  subtitle,
  description,
  icon,
  variant = "default",
  badge,
  trendPeriod,
}: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;
  const effectiveChange = change || trend?.value;
  const effectiveIsPositive = isPositive !== undefined ? isPositive : trend?.isPositive;

  return (
    <div
      className={`bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 flex flex-col justify-between ${styles.borderHover}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            {title}
          </span>
          <div className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 leading-none pt-1">
            {value}
          </div>
        </div>

        {icon && (
          <div
            className={`w-9 h-9 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0 border border-slate-100`}
          >
            {React.isValidElement(icon) ? (
              icon
            ) : typeof icon === "function" ? (
              React.createElement(icon as React.ComponentType<{ className?: string }>, {
                className: `w-4 h-4 ${styles.iconColor}`,
              })
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {effectiveChange && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                effectiveIsPositive
                  ? "bg-[#EAF3EE] text-[#16805D]"
                  : "bg-rose-50 text-[#DC3545]"
              }`}
            >
              {effectiveChange}
            </span>
          )}
          {badge && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${styles.badgeBg} ${styles.badgeText}`}
            >
              {badge}
            </span>
          )}
          {(subtitle || description) && (
            <span className="text-slate-500 font-normal truncate max-w-[180px]">
              {subtitle || description}
            </span>
          )}
        </div>

        {trendPeriod && (
          <span className="text-[11px] text-slate-400 font-normal shrink-0">
            {trendPeriod}
          </span>
        )}
      </div>
    </div>
  );
}
