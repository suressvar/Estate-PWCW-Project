"use client";

import { COMMON_FERTILIZERS } from "@/components/daily-log/master-sheet/options";
import type { MasterDailySheetState } from "@/components/daily-log/master-sheet/use-master-daily-sheet";
import {
  FlaskConical
} from "lucide-react";

type Props = Pick<MasterDailySheetState,
  "fertilizerName" |
  "fertQuantityKg" |
  "setFertilizerName" |
  "godownItems" |
  "setFertQuantityKg" |
  "fertCost" |
  "setFertCost" |
  "fertNotes" |
  "setFertNotes"
>;

export function FertilizerSection({
  fertilizerName,
  fertQuantityKg,
  setFertilizerName,
  godownItems,
  setFertQuantityKg,
  fertCost,
  setFertCost,
  fertNotes,
  setFertNotes,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <FlaskConical className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">3. Fertilizer & Nutrition Application</h4>
            <p className="text-[10px] text-slate-500">Applied inputs (Pushes directly to Fertilizer Menu at /fertilizer)</p>
          </div>
        </div>
        {fertilizerName && Number(fertQuantityKg) > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
            {fertQuantityKg} kg
          </span>
        )}
      </div>

      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Fertilizer Name</label>
            <input
              id="master-fertilizer-name"
              type="text"
              list="fertilizer-suggestions"
              placeholder="e.g. Urea, DAP, NPK 19-19-19"
              value={fertilizerName}
              onChange={(e) => setFertilizerName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            <datalist id="fertilizer-suggestions">
              {COMMON_FERTILIZERS.map((f, i) => (
                <option key={i} value={f} />
              ))}
              {godownItems
                .filter((g) => g.category?.toLowerCase().includes("fertilizer") || g.category?.toLowerCase().includes("nutrition"))
                .map((g) => (
                  <option key={g.id} value={g.name}>
                    Stock: {g.availableQuantity} {g.unit}
                  </option>
                ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Quantity Applied (kg)</label>
            <input
              id="master-fertilizer-qty"
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              value={fertQuantityKg}
              onChange={(e) => {
                const q = e.target.value === "" ? "" : Number(e.target.value);
                setFertQuantityKg(q);
                // Approximate cost if not set
                if (q && !fertCost) {
                  setFertCost(Math.round(Number(q) * 35));
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Cost / Value (₹)</label>
            <input
              type="number"
              min="0"
              placeholder="₹ 0"
              value={fertCost}
              onChange={(e) => setFertCost(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Application Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Basal dose around root zone, Folier spray 200L tank"
            value={fertNotes}
            onChange={(e) => setFertNotes(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}
