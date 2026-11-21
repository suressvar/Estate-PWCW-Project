"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  titleId?: string;
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
  badge,
  className = "",
  titleId,
}: PageHeaderProps) {
  return (
    <div className={`space-y-2 pb-2 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-900 transition-colors font-medium text-slate-500"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-slate-900 font-semibold" : "text-slate-500 font-medium"}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 id={titleId} className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {/* description hidden */}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
