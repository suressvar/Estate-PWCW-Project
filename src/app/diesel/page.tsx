"use client";

import React, { useState, useEffect } from "react";
import { CascadeLogForm } from "@/components/cascade-log-form";
import { DieselLogItem } from "@/lib/transaction-logs";
import { Fuel, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

export default function DieselPage() {
  const [logs, setLogs] = useState<DieselLogItem[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");

  const fetchLogs = async () => {
    const res = await fetch("/api/diesel-logs");
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
            <Fuel className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Diesel Fuel Logs & Stock</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log diesel fuel stock purchases and consumption across estate equipment.
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

      {!canEdit ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Access Restricted: You do not have permission to log Diesel entries for this module.</span>
        </div>
      ) : (
        <CascadeLogForm
          moduleTitle="Diesel Log"
          submitEndpoint="/api/diesel-logs"
          onSuccess={fetchLogs}
          initialExtraState={{ transactionType: "PURCHASE", quantityLiters: "200", cost: "19000" }}
          renderExtraFields={(state, setState) => (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Transaction Type</label>
                <select
                  value={state.transactionType}
                  onChange={(e) => setState({ ...state, transactionType: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                >
                  <option value="PURCHASE">PURCHASE (Refill Storage Tank)</option>
                  <option value="CONSUMPTION">CONSUMPTION (Equipment Dispense)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Volume (Liters)</label>
                <input
                  id="diesel-qty-input"
                  type="number"
                  required
                  value={state.quantityLiters}
                  onChange={(e) => setState({ ...state, quantityLiters: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-slate-700">Total Purchase Cost / Value (₹)</label>
                <input
                  id="diesel-cost-input"
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
          Diesel Transaction History ({logs.length})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Quantity (Liters)</th>
              <th className="p-3">Total Value</th>
              <th className="p-3">Logged By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="p-3 text-slate-500">{log.date}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${log.transactionType === 'PURCHASE' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                    {log.transactionType}
                  </span>
                </td>
                <td className="p-3 font-semibold text-slate-800">{log.quantityLiters} L</td>
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
