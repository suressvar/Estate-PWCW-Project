import { ShieldCheck, UserCheck, Eye } from "lucide-react";

export type RoleType = "ADMIN" | "MANAGER" | "FIELD_STAFF";

interface RoleBadgeProps {
  role: RoleType | string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const normalized = (role || "").toUpperCase();

  if (normalized === "ADMIN" || normalized === "OWNER") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAF3EE] text-[#174D3C] border border-[#16805D]/25">
        <ShieldCheck className="w-3 h-3 text-[#174D3C]" />
        Admin
      </span>
    );
  }

  if (normalized === "MANAGER") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
        <UserCheck className="w-3 h-3 text-blue-700" />
        Manager
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      <Eye className="w-3 h-3 text-slate-500" />
      Field Staff
    </span>
  );
}
