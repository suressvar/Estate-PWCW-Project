"use client";

import type { MasterDailySheetState } from "@/components/daily-log/master-sheet/use-master-daily-sheet";
import { MACHINE_RATES } from "@/types/estate";
import {
  Fuel,
  Tractor
} from "lucide-react";

type Props = Pick<MasterDailySheetState,
  "dieselLiters" |
  "machineName" |
  "handleMachineSelect" |
  "machines" |
  "runningHours" |
  "handleHoursChange" |
  "setDieselLiters" |
  "setDieselCost" |
  "dieselCost" |
  "machineNotes" |
  "setMachineNotes"
>;

export function MachinerySection({
  dieselLiters,
  machineName,
  handleMachineSelect,
  machines,
  runningHours,
  handleHoursChange,
  setDieselLiters,
  setDieselCost,
  dieselCost,
  machineNotes,
  setMachineNotes,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Tractor className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">4. Machinery Fleet & Diesel Dispense</h4>
            <p className="text-[10px] text-slate-500">Operating run & fuel consumption (Pushes to /diesel & /machinery)</p>
          </div>
        </div>
        {Number(dieselLiters) > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 flex items-center gap-1">
            <Fuel className="w-2.5 h-2.5 text-cyan-600" />
            {dieselLiters} L
          </span>
        )}
      </div>

      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-bold text-slate-600">Select Machine</label>
            <select
              id="master-machine-select"
              value={machineName}
              onChange={(e) => handleMachineSelect(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">-- Choose Machine (Leave empty if none) --</option>
              {machines.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} {m.type ? `(${m.type})` : ""}
                </option>
              ))}
              {Object.keys(MACHINE_RATES).map((name) => (
                <option key={name} value={name}>
                  {name} (Standard Rate)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Hours Run (hrs)</label>
            <input
              id="master-machine-hours"
              type="number"
              min="0"
              step="0.5"
              placeholder="0.0"
              value={runningHours}
              onChange={(e) => handleHoursChange(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Diesel Used (Liters)</label>
            <input
              id="master-diesel-liters"
              type="number"
              min="0"
              step="0.5"
              placeholder="0.0"
              value={dieselLiters}
              onChange={(e) => {
                const l = e.target.value === "" ? "" : Number(e.target.value);
                setDieselLiters(l);
                if (l) setDieselCost(Math.round(Number(l) * 95));
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-cyan-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Estimated Fuel Cost (₹)</label>
            <input
              type="number"
              min="0"
              placeholder="₹ 0"
              value={dieselCost}
              onChange={(e) => setDieselCost(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Work Details (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Deep tilling, Sprayer operating on inter-crop"
              value={machineNotes}
              onChange={(e) => setMachineNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
