"use client";

import React, { useState, useEffect } from "react";
import { CascadeLogForm } from "@/components/cascade-log-form";
import { MachineryLogItem, MACHINE_RATES } from "@/lib/transaction-logs";
import { Tractor, ShieldAlert, SlidersHorizontal, Clock, Fuel } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

export default function MachineryPage() {
  const [logs, setLogs] = useState<MachineryLogItem[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");

  const fetchLogs = async () => {
    const res = await fetch("/api/machinery-logs");
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
            <Tractor className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Machinery Usage & Fuel Consumption</h1>
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
          <span>Access Restricted: You do not have permission to log Machinery entries for this module.</span>
        </div>
      ) : (
        <CascadeLogForm
          moduleTitle="Machinery Usage Log"
          submitEndpoint="/api/machinery-logs"
          onSuccess={fetchLogs}
          initialExtraState={{
            machineName: "John Deere Tractor",
            startTime: "08:00",
            endTime: "13:00",
            runningHours: 5,
            dieselConsumedLiters: 22.5,
          }}
          renderExtraFields={(state, setState) => {
            const handleTimeChange = (start: string, end: string, machine: string) => {
              if (start && end) {
                const [sh, sm] = start.split(":").map(Number);
                const [eh, em] = end.split(":").map(Number);
                const diffHours = Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
                const rate = MACHINE_RATES[machine] || 4.0;
                const estDiesel = diffHours * rate;

                setState({
                  ...state,
                  startTime: start,
                  endTime: end,
                  machineName: machine,
                  runningHours: diffHours,
                  dieselConsumedLiters: estDiesel,
                });
              }
            };

            return (
              <>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Machine Equipment</label>
                  <select
                    id="machine-select"
                    value={state.machineName}
                    onChange={(e) => handleTimeChange(state.startTime, state.endTime, e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  >
                    {Object.keys(MACHINE_RATES).map((m) => (
                      <option key={m} value={m}>
                        {m} ({MACHINE_RATES[m]} L/hr)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Start Time</label>
                  <input
                    id="start-time-input"
                    type="time"
                    required
                    value={state.startTime}
                    onChange={(e) => handleTimeChange(e.target.value, state.endTime, state.machineName)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">End Time</label>
                  <input
                    id="end-time-input"
                    type="time"
                    required
                    value={state.endTime}
                    onChange={(e) => handleTimeChange(state.startTime, e.target.value, state.machineName)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                  />
                </div>

                {/* Auto-Calculated Metrics Box */}
                <div className="sm:col-span-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      Auto Calculated Running Hours:
                    </span>
                    <span className="text-sm font-bold text-emerald-800">{state.runningHours} Hours</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-emerald-700" />
                      Estimated Diesel Consumed:
                    </span>
                    <span className="text-sm font-bold text-amber-700">{state.dieselConsumedLiters} Liters</span>
                  </div>
                </div>
              </>
            );
          }}
        />
      )}

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900">
          Machinery Usage Log History ({logs.length})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Plot</th>
              <th className="p-3">Crop / Activity</th>
              <th className="p-3">Machine Equipment</th>
              <th className="p-3">Runtime Window</th>
              <th className="p-3">Total Running Time</th>
              <th className="p-3">Est. Diesel Used</th>
              <th className="p-3">Logged By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="p-3 text-slate-500">{log.date}</td>
                <td className="p-3 font-bold text-slate-900">{log.plotName}</td>
                <td className="p-3 text-emerald-800 font-medium">{log.cropActivityName}</td>
                <td className="p-3 font-semibold text-slate-800">{log.machineName}</td>
                <td className="p-3 text-slate-600">{log.startTime} - {log.endTime}</td>
                <td className="p-3 font-bold text-slate-900">{log.runningHours} hrs</td>
                <td className="p-3 font-bold text-amber-700">{log.dieselConsumedLiters} L</td>
                <td className="p-3 text-slate-500">{log.loggedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
