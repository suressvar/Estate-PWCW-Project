"use client";

import { ACTIVITY_TYPES } from "@/components/daily-log/master-sheet/options";
import type { MasterDailySheetState } from "@/components/daily-log/master-sheet/use-master-daily-sheet";
import type { ActivityType } from "@/types/storage";
import {
  CheckCircle2,
  ClipboardList,
  Users
} from "lucide-react";

type Props = Pick<MasterDailySheetState,
  "hasActivity" |
  "setHasActivity" |
  "activityType" |
  "setActivityType" |
  "customActivity" |
  "setCustomActivity" |
  "setActivityCompleted" |
  "activityCompleted" |
  "activityDescription" |
  "setActivityDescription" |
  "employees" |
  "assignedWorkerIds" |
  "setAssignedWorkerIds"
>;

export function ActivitySection({
  hasActivity,
  setHasActivity,
  activityType,
  setActivityType,
  customActivity,
  setCustomActivity,
  setActivityCompleted,
  activityCompleted,
  activityDescription,
  setActivityDescription,
  employees,
  assignedWorkerIds,
  setAssignedWorkerIds,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <ClipboardList className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">1. Planned or Completed Field Work</h4>
            <p className="text-[10px] text-slate-500">Scheduled agricultural operation for this plot</p>
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={hasActivity}
            onChange={(e) => setHasActivity(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
          />
          <span>Include Activity</span>
        </label>
      </div>

      {hasActivity && (
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Activity Type</label>
              <select
                id="master-activity-type"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {activityType === "OTHER" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Custom Activity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Trellising, Honey extraction"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Execution Status Today</label>
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setActivityCompleted(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${activityCompleted
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Mark Completed
                </button>
                <button
                  type="button"
                  onClick={() => setActivityCompleted(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${!activityCompleted
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  <span>Keep as Planned</span>
                </button>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold text-slate-600">Instructions / Notes (Optional)</label>
              <input
                type="text"
                placeholder="Specific zone, rows, block dosage, or field notes..."
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Workers Assignment */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-500" />
              Assign Estate Staff to this Activity:
            </label>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {employees.map((emp) => {
                const isSelected = assignedWorkerIds.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setAssignedWorkerIds(assignedWorkerIds.filter((id) => id !== emp.id));
                      } else {
                        setAssignedWorkerIds([...assignedWorkerIds, emp.id]);
                      }
                    }}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border transition-all ${isSelected
                        ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {emp.name}
                  </button>
                );
              })}
              {employees.length === 0 && (
                <span className="text-[11px] text-slate-400 italic">No employees loaded in roster.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
