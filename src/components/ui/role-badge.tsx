import React from "react";
import { ShieldCheck, UserCheck, Eye } from "lucide-react";

export type RoleType = "ADMIN" | "MANAGER" | "FIELD_STAFF";

interface RoleBadgeProps {
  role: RoleType | string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const normalized = role.toUpperCase();
  
  if (normalized === "ADMIN" || normalized === "OWNER") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300/70">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
        Admin
      </span>
    );
  }

  if (normalized === "MANAGER") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300/40">
        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
        Manager
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300/70">
      <Eye className="w-3.5 h-3.5 text-slate-500" />
      Field Staff
    </span>
  );
}
