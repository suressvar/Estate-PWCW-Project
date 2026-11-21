"use client";

import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import { Check, ShieldCheck, UserPlus, X } from "lucide-react";

interface RoleDef {
  id: string;
  name: string;
  canManagePlots: boolean;
  canManageCrops: boolean;
  canLogFertilizer: boolean;
  canLogDiesel: boolean;
  canLogMachinery: boolean;
  canLogLabor: boolean;
  canLogProduction: boolean;
  canLogSales: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}

const initialRoles: RoleDef[] = [
  {
    id: "r1",
    name: "Admin / Estate Owner",
    canManagePlots: true,
    canManageCrops: true,
    canLogFertilizer: true,
    canLogDiesel: true,
    canLogMachinery: true,
    canLogLabor: true,
    canLogProduction: true,
    canLogSales: true,
    canViewReports: true,
    canManageUsers: true,
  },
  {
    id: "r2",
    name: "Manager",
    canManagePlots: true,
    canManageCrops: true,
    canLogFertilizer: true,
    canLogDiesel: true,
    canLogMachinery: true,
    canLogLabor: true,
    canLogProduction: true,
    canLogSales: true,
    canViewReports: true,
    canManageUsers: false,
  },
  {
    id: "r3",
    name: "Field Staff",
    canManagePlots: false,
    canManageCrops: false,
    canLogFertilizer: true,
    canLogDiesel: true,
    canLogMachinery: true,
    canLogLabor: true,
    canLogProduction: true,
    canLogSales: false,
    canViewReports: false,
    canManageUsers: false,
  },
];

export default function UsersPage() {
  const roles = initialRoles;
  const canEdit = false;

  return (
    <PageContainer>
      {/* Standardized Page Header */}
      <PageHeader
        title="Access & Role Templates"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Users & Roles" },
        ]}
      />

      <p className="text-xs text-slate-500">
        Only the administrator account can sign in. Additional user accounts are not enabled; the role templates below are read-only.
      </p>

      {/* Roles Permission Matrix Card */}
      <ContentCard
        title="Fine-Grained Module Permission Matrix"
        actions={
          canEdit ? (
            <button className="px-3 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Custom Role</span>
            </button>
          ) : undefined
        }
      >
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Role Name</th>
                <th className="px-3 py-3 text-center">Manage Plots</th>
                <th className="px-3 py-3 text-center">Manage Crops</th>
                <th className="px-3 py-3 text-center">Fertilizer Log</th>
                <th className="px-3 py-3 text-center">Diesel Log</th>
                <th className="px-3 py-3 text-center">Labor Log</th>
                <th className="px-3 py-3 text-center">Sales Log</th>
                <th className="px-5 py-3 text-center">View Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#174D3C]" />
                      <span>{r.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {r.canManagePlots ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EAF3EE] text-[#16805D]">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {r.canManageCrops ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EAF3EE] text-[#16805D]">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {r.canLogFertilizer ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EAF3EE] text-[#16805D]">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {r.canLogDiesel ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EAF3EE] text-[#16805D]">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {r.canLogLabor ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EAF3EE] text-[#16805D]">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {r.canLogSales ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EAF3EE] text-[#16805D]">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {r.canViewReports ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EAF3EE] text-[#16805D]">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </PageContainer>
  );
}
