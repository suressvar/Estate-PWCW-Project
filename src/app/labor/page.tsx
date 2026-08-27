"use client";

import React, { useState, useEffect } from "react";
import { CascadeLogForm } from "@/components/cascade-log-form";
import { LaborLogItem } from "@/lib/transaction-logs";
import { Users, ShieldAlert, SlidersHorizontal, DollarSign } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

export default function LaborPage() {
  const [logs, setLogs] = useState<LaborLogItem[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");

  const fetchLogs = async () => {
    const res = await fetch("/api/labor-logs");
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
            <Users className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Labor Usage & Wage Costs</h1>
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
          <span>Access Restricted: You do not have permission to log Labor entries for this module.</span>
        </div>
      ) : (
        <CascadeLogForm
          moduleTitle="Labor Log"
          submitEndpoint="/api/labor-logs"
          onSuccess={fetchLogs}
          initialExtraState={{
            menCount: "4",
            womenCount: "6",
            menWageRate: "600",
            womenWageRate: "450",
            totalCost: 5100,
          }}
          renderExtraFields={(state, setState) => {
            const handleCalc = (mc: string, wc: string, mr: string, wr: string) => {
              const total = (Number(mc) || 0) * (Number(mr) || 0) + (Number(wc) || 0) * (Number(wr) || 0);
              setState({
                ...state,
                menCount: mc,
                womenCount: wc,
                menWageRate: mr,
                womenWageRate: wr,
                totalCost: total,
              });
            };

            return (
              <>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Male Labor Count</label>
                  <input
                    id="men-count-input"
                    type="number"
                    required
                    value={state.menCount}
                    onChange={(e) => handleCalc(e.target.value, state.womenCount, state.menWageRate, state.womenWageRate)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Male Wage Rate (₹/day)</label>
                  <input
                    id="men-wage-input"
                    type="number"
                    required
                    value={state.menWageRate}
                    onChange={(e) => handleCalc(state.menCount, state.womenCount, e.target.value, state.womenWageRate)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Female Labor Count</label>
                  <input
                    id="women-count-input"
                    type="number"
                    required
                    value={state.womenCount}
                    onChange={(e) => handleCalc(state.menCount, e.target.value, state.menWageRate, state.womenWageRate)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Female Wage Rate (₹/day)</label>
                  <input
                    id="women-wage-input"
                    type="number"
                    required
                    value={state.womenWageRate}
                    onChange={(e) => handleCalc(state.menCount, state.womenCount, state.menWageRate, e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>

                {/* Auto Calculated Total Box */}
                <div className="sm:col-span-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                    Auto Calculated Total Wage Cost:
                  </span>
                  <span className="text-base font-bold text-emerald-800">₹{state.totalCost}</span>
                </div>
              </>
            );
          }}
        />
      )}

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900">
          Labor Wage Log History ({logs.length})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Plot</th>
              <th className="p-3">Crop / Activity</th>
              <th className="p-3">Male Workers</th>
              <th className="p-3">Female Workers</th>
              <th className="p-3">Wage Rates (M / W)</th>
              <th className="p-3">Total Wage Payout</th>
              <th className="p-3">Logged By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="p-3 text-slate-500">{log.date}</td>
                <td className="p-3 font-bold text-slate-900">{log.plotName}</td>
                <td className="p-3 text-emerald-800 font-medium">{log.cropActivityName}</td>
                <td className="p-3 font-semibold text-slate-800">{log.menCount} Men</td>
                <td className="p-3 font-semibold text-slate-800">{log.womenCount} Women</td>
                <td className="p-3 text-slate-600">₹{log.menWageRate} / ₹{log.womenWageRate}</td>
                <td className="p-3 font-bold text-emerald-700">₹{log.totalCost}</td>
                <td className="p-3 text-slate-500">{log.loggedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
