"use client";
import type { WorkActivityItem } from "@/lib/db-storage";

import {
AlertCircle,
ArrowRight,
CheckCircle2,
ClipboardList,
Clock,
MapPin,
RefreshCw,
RotateCcw,
Sparkles,
Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect,useState } from "react";

interface PendingSummary {
  date: string;
  totalPlotsTracked: number;
  totalAvailablePlots: number;
  totalActivities: number;
  totalPending: number;
  totalNotDone: number;
  totalCompleted: number;
  totalCarriedForward: number;
  completionRatePercent: number;
  plotWorkItems: {
    plotId: string;
    plotName: string;
    dailyLogId: string;
    status: string;
    pendingActivities: WorkActivityItem[];
    notDoneActivities: WorkActivityItem[];
    completedActivities: WorkActivityItem[];
  }[];
}

export function PendingWorkWidget() {
  const [data, setData] = useState<PendingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/daily-log/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load daily log summary", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => { dispose = (() => {
    fetchSummary();
  })(); }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, []);

  

  return (
    <div
      id="daily-work-summary-widget"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/60 border border-emerald-500/30 flex items-center justify-center text-emerald-200 shadow-inner">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Today&apos;s Daily Work Tracking
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  Live Backbone
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Outstanding & pending operations across all estate plots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 transition-colors disabled:opacity-50"
              title="Refresh tracking data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/daily-log"
              id="open-daily-log-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-colors shadow-sm"
            >
              Open Daily Log
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-emerald-700/50">
          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-700/40">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Pending Needed
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1" id="widget-pending-count">
              {data?.totalPending || 0}
            </div>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-700/40">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Not Done Today
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1" id="widget-not-done-count">
              {data?.totalNotDone || 0}
            </div>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-700/40">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Completed
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1" id="widget-completed-count">
              {data?.totalCompleted || 0}
            </div>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-700/40">
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-cyan-300" />
              Carried Forward
            </div>
            <div className="text-2xl font-black text-cyan-300 mt-1" id="widget-carried-count">
              {data?.totalCarriedForward || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Content Area */}
      <div className="p-5">
        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            Loading work tracking across all plots...
          </div>
        ) : !data || data.plotWorkItems.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Outstanding Work Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              All planned activities are complete, or no daily logs have been created yet for today.
            </p>
            <Link
              href="/daily-log"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
            >
              Plan today&apos;s activities now &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>
                Tracking across {data.totalPlotsTracked} plot
                {data.totalPlotsTracked === 1 ? "" : "s"} ({data.totalActivities} total activities)
              </span>
              <span className="font-bold text-emerald-700">
                {data.completionRatePercent}% completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${data.completionRatePercent}%` }}
                className="h-full bg-emerald-600 transition-all duration-500"
              />
              <div
                style={{
                  width: `${
                    data.totalActivities > 0
                      ? Math.round((data.totalPending / data.totalActivities) * 100)
                      : 0
                  }%`,
                }}
                className="h-full bg-amber-400 transition-all duration-500"
              />
              <div
                style={{
                  width: `${
                    data.totalActivities > 0
                      ? Math.round((data.totalNotDone / data.totalActivities) * 100)
                      : 0
                  }%`,
                }}
                className="h-full bg-rose-400 transition-all duration-500"
              />
            </div>

            {/* Plot Activity Items List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {data.plotWorkItems.map((plot) => (
                <div
                  key={plot.plotId}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{plot.plotName}</span>
                    </div>
                    <Link
                      href={`/daily-log?plotId=${plot.plotId}&date=${data.date}`}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 shrink-0"
                    >
                      View Log &rarr;
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    {plot.pendingActivities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white border border-amber-200/80 shadow-2xs text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              {act.activityType}
                            </span>
                            {act.carriedForwardFromId && (
                              <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 flex items-center gap-0.5">
                                <RotateCcw className="w-2.5 h-2.5" />
                                Carried Forward
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium truncate mt-1">
                            {act.description || act.customActivity || act.activityType}
                          </p>
                          {act.assignedWorkerNames && act.assignedWorkerNames.length > 0 && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3 text-slate-400" />
                              {act.assignedWorkerNames.join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          Pending
                        </span>
                      </div>
                    ))}

                    {plot.notDoneActivities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white border border-rose-200/80 shadow-2xs text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              {act.activityType}
                            </span>
                            {act.carriedForwardFromId && (
                              <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 flex items-center gap-0.5">
                                <RotateCcw className="w-2.5 h-2.5" />
                                Carried Forward
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium truncate mt-1">
                            {act.description || act.customActivity || act.activityType}
                          </p>
                          {act.reasonIfNotDone && (
                            <p className="text-[11px] text-rose-700 font-medium italic mt-0.5">
                              Reason: &ldquo;{act.reasonIfNotDone}&rdquo;
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          Not Done
                        </span>
                      </div>
                    ))}

                    {plot.pendingActivities.length === 0 && plot.notDoneActivities.length === 0 && (
                      <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        All {plot.completedActivities.length} activities completed for today!
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
