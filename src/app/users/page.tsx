"use client";

import React, { useState } from "react";
import { ShieldCheck, UserPlus, SlidersHorizontal, Edit2, Trash2 } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

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
  const [roles, setRoles] = useState<RoleDef[]>(initialRoles);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");

  const handleTogglePerm = (roleId: string, permKey: keyof RoleDef) => {
    if (!canEdit) return;
    setRoles(
      roles.map((r) =>
        r.id === roleId ? { ...r, [permKey]: !r[permKey] } : r
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-lg border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Users & Dynamic RBAC Roles Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure fine-grained module permission flags for estate staff, managers, and administrators.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-md border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Simulated Role:</span>
            <RoleBadge role={roleName} />
          </div>
          <button
            onClick={() => { setCanEdit(!canEdit); setRoleName(canEdit ? "Field Staff" : "Admin"); }}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            Toggle RBAC
          </button>
        </div>
      </div>

      {/* Roles Permission Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900 flex justify-between items-center">
          <span>Fine-Grained Module Permission Matrix</span>
          {canEdit && (
            <button className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              Add Custom Role
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="p-3">Role Name</th>
                <th className="p-3">Manage Plots</th>
                <th className="p-3">Manage Crops</th>
                <th className="p-3">Fertilizer Log</th>
                <th className="p-3">Diesel Log</th>
                <th className="p-3">Labor Log</th>
                <th className="p-3">Sales Log</th>
                <th className="p-3">View Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{r.name}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={r.canManagePlots}
                      disabled={!canEdit}
                      onChange={() => handleTogglePerm(r.id, "canManagePlots")}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={r.canManageCrops}
                      disabled={!canEdit}
                      onChange={() => handleTogglePerm(r.id, "canManageCrops")}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={r.canLogFertilizer}
                      disabled={!canEdit}
                      onChange={() => handleTogglePerm(r.id, "canLogFertilizer")}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={r.canLogDiesel}
                      disabled={!canEdit}
                      onChange={() => handleTogglePerm(r.id, "canLogDiesel")}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={r.canLogLabor}
                      disabled={!canEdit}
                      onChange={() => handleTogglePerm(r.id, "canLogLabor")}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={r.canLogSales}
                      disabled={!canEdit}
                      onChange={() => handleTogglePerm(r.id, "canLogSales")}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={r.canViewReports}
                      disabled={!canEdit}
                      onChange={() => handleTogglePerm(r.id, "canViewReports")}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
