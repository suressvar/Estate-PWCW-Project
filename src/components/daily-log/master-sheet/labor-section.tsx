"use client";

import type { MasterDailySheetState } from "@/components/daily-log/master-sheet/use-master-daily-sheet";
import {
  Users
} from "lucide-react";

type Props = Pick<MasterDailySheetState,
  "calculatedLaborCost" |
  "menCount" |
  "setMenCount" |
  "womenCount" |
  "setWomenCount" |
  "workingHours" |
  "setWorkingHours" |
  "menWageRate" |
  "setMenWageRate" |
  "womenWageRate" |
  "setWomenWageRate" |
  "laborCostManual" |
  "setLaborCostManual" |
  "laborNotes" |
  "setLaborNotes"
>;

export function LaborSection({
  calculatedLaborCost,
  menCount,
  setMenCount,
  womenCount,
  setWomenCount,
  workingHours,
  setWorkingHours,
  menWageRate,
  setMenWageRate,
  womenWageRate,
  setWomenWageRate,
  laborCostManual,
  setLaborCostManual,
  laborNotes,
  setLaborNotes,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-800 flex items-center justify-center font-bold">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">2. Labor & Manpower Payout</h4>
            <p className="text-[10px] text-slate-500">Casual daily labor headcount and wages (Pushes to Labor Logs & HR)</p>
          </div>
        </div>
        {calculatedLaborCost > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-100 text-violet-800">
            ₹{calculatedLaborCost.toLocaleString()}
          </span>
        )}
      </div>

      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Men Count</label>
            <input
              id="master-men-count"
              type="number"
              min="0"
              placeholder="0"
              value={menCount}
              onChange={(e) => setMenCount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Women Count</label>
            <input
              id="master-women-count"
              type="number"
              min="0"
              placeholder="0"
              value={womenCount}
              onChange={(e) => setWomenCount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Working Hours</label>
            <input
              id="master-working-hours"
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              placeholder="8"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Men Rate (₹/day)</label>
            <input
              type="number"
              min="0"
              value={menWageRate}
              onChange={(e) => setMenWageRate(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Women Rate (₹/day)</label>
            <input
              type="number"
              min="0"
              value={womenWageRate}
              onChange={(e) => setWomenWageRate(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">
              Total Labor Cost (₹) <span className="text-[10px] text-slate-400 font-normal">(Auto-calculated)</span>
            </label>
            <input
              type="number"
              placeholder={calculatedLaborCost ? String(calculatedLaborCost) : "Auto-computed"}
              value={laborCostManual}
              onChange={(e) => setLaborCostManual(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-black text-violet-900 bg-violet-50/40 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Labor Remarks / Task (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Coffee weeding, Coconut plucking, Basin cleaning"
              value={laborNotes}
              onChange={(e) => setLaborNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
