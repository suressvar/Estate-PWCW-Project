"use client";

import React, { useState, useEffect } from "react";
import { CascadeLogForm } from "@/components/cascade-log-form";
import { FertilizerLogItem } from "@/lib/transaction-logs";
import { FlaskConical, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

export default function FertilizerPage() {
  const [logs, setLogs] = useState<FertilizerLogItem[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");

  const fetchLogs = async () => {
    const res = await fetch("/api/fertilizer-logs");
    const data = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Fertilizer Logs & Stock Management</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-300 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold">Simulated Role:</span>
            <RoleBadge role={roleName} />
          </div>
          <button
            onClick={() => { setCanEdit(!canEdit); setRoleName(canEdit ? "Field Staff" : "Admin"); }}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-600" />
            Toggle RBAC
          </button>
        </div>
      </div>


      {!canEdit ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Access Restricted: You do not have permission to log Fertilizer entries for this module.</span>
        </div>
      ) : (
        <CascadeLogForm
          moduleTitle="Fertilizer Log"
          submitEndpoint="/api/fertilizer-logs"
          onSuccess={fetchLogs}
          initialExtraState={{ transactionType: "CONSUMPTION", fertilizerName: "NPK 19-19-19", quantityKg: "50", cost: "3500" }}
          renderExtraFields={(state, setState) => (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Type</label>
                <select
                  value={state.transactionType}
                  onChange={(e) => setState({ ...state, transactionType: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                >
                  <option value="CONSUMPTION">CONSUMPTION (Applied to Plot)</option>
                  <option value="PURCHASE">PURCHASE (Added to Stock)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Fertilizer Name</label>
                <input
                  id="fert-name-input"
                  type="text"
                  required
                  value={state.fertilizerName}
                  onChange={(e) => setState({ ...state, fertilizerName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Quantity (kg)</label>
                <input
                  id="fert-qty-input"
                  type="number"
                  required
                  value={state.quantityKg}
                  onChange={(e) => setState({ ...state, quantityKg: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Cost Value (₹)</label>
                <input
                  id="fert-cost-input"
                  type="number"
                  required
                  value={state.cost}
                  onChange={(e) => setState({ ...state, cost: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                />
              </div>
            </>
          )}
        />
      )}

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900">
          Fertilizer Log Entry History ({logs.length})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Plot Location</th>
              <th className="p-3">Crop / Activity</th>
              <th className="p-3">Type</th>
              <th className="p-3">Fertilizer Item</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Cost Value</th>
              <th className="p-3">Logged By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="p-3 text-slate-500">{log.date}</td>
                <td className="p-3 font-bold text-slate-900">{log.plotName}</td>
                <td className="p-3 text-emerald-800 font-medium">{log.cropActivityName}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${log.transactionType === 'PURCHASE' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                    {log.transactionType}
                  </span>
                </td>
                <td className="p-3 font-semibold text-slate-800">{log.fertilizerName}</td>
                <td className="p-3 text-slate-700">{log.quantityKg} kg</td>
                <td className="p-3 font-bold text-slate-900">₹{log.cost}</td>
                <td className="p-3 text-slate-500">{log.loggedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
