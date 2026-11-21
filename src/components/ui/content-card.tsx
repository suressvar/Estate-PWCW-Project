import React from "react";

interface ContentCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export function ContentCard({
  title,
  subtitle,
  actions,
  action,
  badge,
  children,
  className = "",
  bodyClassName = "",
  footer,
  noPadding = false,
}: ContentCardProps) {
  const headerActions = actions || action;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden ${className}`}
    >
      {(title || subtitle || headerActions || badge) && (
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="space-y-0.5">
              {typeof title === "string" ? (
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 font-normal">
                  {subtitle}
                </p>
              )}
            </div>
            {badge && <div>{badge}</div>}
          </div>
          {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
        </div>
      )}

      <div className={noPadding ? bodyClassName : `p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}
