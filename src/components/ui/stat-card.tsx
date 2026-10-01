import React from "react";

export type StatCardVariant = "default" | "emerald" | "violet" | "rose" | "amber" | "cyan" | "blue";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  variant?: StatCardVariant;
  badge?: string;
}

const variantStyles: Record<
  StatCardVariant,
  {
    card: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    valueColor: string;
    badgeBg: string;
  }
> = {
  default: {
    card: "bg-white/90 border-[#CBF3BB] hover:border-emerald-400 hover:shadow-md",
    iconBg: "bg-[#ECF4E8] border-[#ABE7B2]",
    iconColor: "text-[#14532D]",
    titleColor: "text-slate-700",
    valueColor: "text-slate-900",
    badgeBg: "bg-slate-100 text-slate-700",
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-500/10 via-emerald-50/70 to-teal-500/5 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100/50 hover:shadow-lg",
    iconBg: "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30",
    iconColor: "text-white",
    titleColor: "text-emerald-900",
    valueColor: "text-emerald-950",
    badgeBg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  violet: {
    card: "bg-gradient-to-br from-violet-500/10 via-purple-50/70 to-indigo-500/5 border-violet-200 hover:border-violet-400 hover:shadow-violet-100/50 hover:shadow-lg",
    iconBg: "bg-violet-600 text-white shadow-xs shadow-violet-600/30",
    iconColor: "text-white",
    titleColor: "text-violet-900",
    valueColor: "text-violet-950",
    badgeBg: "bg-violet-100 text-violet-800 border border-violet-200",
  },
  rose: {
    card: "bg-gradient-to-br from-rose-500/10 via-rose-50/70 to-orange-500/5 border-rose-200 hover:border-rose-400 hover:shadow-rose-100/50 hover:shadow-lg",
    iconBg: "bg-rose-600 text-white shadow-xs shadow-rose-600/30",
    iconColor: "text-white",
    titleColor: "text-rose-900",
    valueColor: "text-rose-950",
    badgeBg: "bg-rose-100 text-rose-800 border border-rose-200",
  },
  amber: {
    card: "bg-gradient-to-br from-amber-500/10 via-amber-50/70 to-yellow-500/5 border-amber-200 hover:border-amber-400 hover:shadow-amber-100/50 hover:shadow-lg",
    iconBg: "bg-amber-500 text-white shadow-xs shadow-amber-500/30",
    iconColor: "text-white",
    titleColor: "text-amber-900",
    valueColor: "text-amber-950",
    badgeBg: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  cyan: {
    card: "bg-gradient-to-br from-cyan-500/10 via-sky-50/70 to-blue-500/5 border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-100/50 hover:shadow-lg",
    iconBg: "bg-cyan-600 text-white shadow-xs shadow-cyan-600/30",
    iconColor: "text-white",
    titleColor: "text-cyan-900",
    valueColor: "text-cyan-950",
    badgeBg: "bg-cyan-100 text-cyan-800 border border-cyan-200",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-500/10 via-blue-50/70 to-indigo-500/5 border-blue-200 hover:border-blue-400 hover:shadow-blue-100/50 hover:shadow-lg",
    iconBg: "bg-blue-600 text-white shadow-xs shadow-blue-600/30",
    iconColor: "text-white",
    titleColor: "text-blue-900",
    valueColor: "text-blue-950",
    badgeBg: "bg-blue-100 text-blue-800 border border-blue-200",
  },
};

export function StatCard({
  title,
  value,
  change,
  isPositive,
  subtitle,
  description,
  icon,
  variant = "default",
  badge,
}: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between backdrop-blur-xs shadow-xs hover:-translate-y-0.5 ${styles.card}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold tracking-wider uppercase ${styles.titleColor}`}>
          {title}
        </span>
        {icon && (
          <div className={`p-2.5 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
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

      <div className="mt-4 space-y-1.5">
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${styles.valueColor}`}>
          {value}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {change && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                isPositive
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-rose-100 text-rose-800 border border-rose-300"
              }`}
            >
              {change}
            </span>
          )}
          {badge && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${styles.badgeBg}`}>
              {badge}
            </span>
          )}
          {(subtitle || description) && (
            <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{subtitle || description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
