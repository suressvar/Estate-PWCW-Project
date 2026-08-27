"use client";

import React, { useState, useEffect } from "react";
import { CascadeLogForm } from "@/components/cascade-log-form";
import { ProductionLogItem } from "@/lib/transaction-logs";
import { Wheat, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

export default function ProductionPage() {
  const [logs, setLogs] = useState<ProductionLogItem[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");

  const fetchLogs = async () => {
    const res = await fetch("/api/production-logs");
    const data = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-lg border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Crop Production & Harvest Logs</h1>
          </div>
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

      {!canEdit ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Access Restricted: You do not have permission to log Production entries for this module.</span>
        </div>
      ) : (
        <CascadeLogForm
          moduleTitle="Production Log"
          submitEndpoint="/api/production-logs"
          onSuccess={fetchLogs}
          initialExtraState={{ quantityKg: "1250" }}
          renderExtraFields={(state, setState) => (
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700">Harvested Quantity (kg)</label>
              <input
                id="prod-qty-input"
                type="number"
                required
                value={state.quantityKg}
                onChange={(e) => setState({ ...state, quantityKg: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
              />
            </div>
          )}
        />
      )}

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900">
          Harvest Production History ({logs.length})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Plot Location</th>
              <th className="p-3">Harvested Crop</th>
              <th className="p-3">Quantity (kg)</th>
              <th className="p-3">Logged By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="p-3 text-slate-500">{log.date}</td>
                <td className="p-3 font-bold text-slate-900">{log.plotName}</td>
                <td className="p-3 text-emerald-800 font-medium">{log.cropActivityName}</td>
                <td className="p-3 font-bold text-slate-900">{log.quantityKg} kg</td>
                <td className="p-3 text-slate-500">{log.loggedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
