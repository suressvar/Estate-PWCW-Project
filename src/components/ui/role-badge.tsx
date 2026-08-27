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
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#ECF4E8] text-[#14532D] border border-[#ABE7B2] shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-[#14532D]" />
        Admin
      </span>
    );
  }

  if (normalized === "MANAGER") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#CBF3BB]/60 text-[#14532D] border border-[#93BFC7]">
        <UserCheck className="w-3.5 h-3.5 text-[#14532D]" />
        Manager
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#ECF4E8] text-slate-700 border border-[#93BFC7]/70">
      <Eye className="w-3.5 h-3.5 text-[#4A7C85]" />
      Field Staff
    </span>
  );
}
