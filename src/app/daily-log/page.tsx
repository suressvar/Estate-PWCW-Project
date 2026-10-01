"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  X,
  FileText,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { DailyLogItem, WorkActivityItem, ActivityType, DailyLogStatus } from "@/lib/db-storage";
import { MasterDailySheet } from "@/components/daily-log/master-daily-sheet";

const ACTIVITY_TYPES: { label: string; value: ActivityType }[] = [
  { label: "Irrigation & Water", value: "IRRIGATION" },
  { label: "Weeding & Cleaning", value: "WEEDING" },
  { label: "Fertilizer Application", value: "FERTILIZER_APPLICATION" },
  { label: "Spraying & Pest Control", value: "SPRAYING" },
  { label: "Harvesting & Picking", value: "HARVESTING" },
  { label: "Sowing & Planting", value: "SOWING" },
  { label: "Land Preparation", value: "LAND_PREPARATION" },
  { label: "Pruning & Tying", value: "PRUNING" },
  { label: "Machinery Maintenance", value: "MAINTENANCE" },
  { label: "Other / Custom Activity", value: "OTHER" },
];

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function adjustDate(dateStr: string, daysOffset: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DailyLogContent() {
  const searchParams = useSearchParams();
  const initialPlotId = searchParams.get("plotId") || "";
  const initialDate = searchParams.get("date") || getTodayString();

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedPlotId, setSelectedPlotId] = useState<string>(initialPlotId);
  const [plots, setPlots] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [currentLog, setCurrentLog] = useState<DailyLogItem | null>(null);
  const [allDateLogs, setAllDateLogs] = useState<DailyLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeView, setActiveView] = useState<"sheet" | "tasks">("sheet");

  // Add activity modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState<ActivityType>("IRRIGATION");
  const [newCustomActivity, setNewCustomActivity] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newWorkerIds, setNewWorkerIds] = useState<string[]>([]);
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Not done inline reason modal/state
  const [notDoneTargetId, setNotDoneTargetId] = useState<string | null>(null);
  const [notDoneReason, setNotDoneReason] = useState("");
  const [notDoneError, setNotDoneError] = useState("");

  // Load master data (plots & employees)
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [plotsRes, empsRes] = await Promise.all([
          fetch("/api/plots"),
          fetch("/api/employees"),
        ]);
        if (plotsRes.ok) {
          const plotsData = await plotsRes.json();
          setPlots(plotsData);
          if (!selectedPlotId && plotsData.length > 0) {
            setSelectedPlotId(plotsData[0].id);
          }
        }
        if (empsRes.ok) {
          const empsData = await empsRes.json();
          setEmployees(empsData);
        }
      } catch (e) {
        console.error("Failed to load plots or employees", e);
      }
    }
    loadMasterData();
  }, [selectedPlotId]);

  // Load daily logs for selected date & plot
  const loadDailyLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/daily-log?date=${selectedDate}`);
      if (res.ok) {
        const data: DailyLogItem[] = await res.json();
        setAllDateLogs(data);
        const matching = data.find((l) => l.plotId === selectedPlotId);
        setCurrentLog(matching || null);
      }
    } catch (e) {
      console.error("Failed to load daily logs", e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedPlotId]);

  useEffect(() => {
    loadDailyLogs();
  }, [loadDailyLogs]);

  // Handle Plot change
  const handlePlotChange = (newPlotId: string) => {
    setSelectedPlotId(newPlotId);
    const matching = allDateLogs.find((l) => l.plotId === newPlotId);
    setCurrentLog(matching || null);
  };

  // Quick initial log creation for plot+date
  const handleCreateDailyLog = async () => {
    if (!selectedPlotId) return;
    try {
      const res = await fetch("/api/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId: selectedPlotId,
          date: selectedDate,
          createdBy: "Field Supervisor",
          status: "PLANNED",
        }),
      });
      if (res.ok) {
        const newLog = await res.json();
        setCurrentLog(newLog);
        setActionMessage({ type: "success", text: "Daily log initialized for selected plot." });
        loadDailyLogs();
      }
    } catch (e) {
      console.error("Failed to create daily log", e);
    }
  };

  // Add work activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivityType === "OTHER" && !newCustomActivity.trim()) {
      setActionMessage({ type: "error", text: "Please enter custom activity name" });
      return;
    }

    try {
      setIsSubmittingActivity(true);
      let targetLogId = currentLog?.id;

      // If no log exists yet for this plot+date, upsert it first
      if (!targetLogId) {
        const upsertRes = await fetch("/api/daily-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plotId: selectedPlotId,
            date: selectedDate,
            createdBy: "Field Supervisor",
          }),
        });
        if (!upsertRes.ok) throw new Error("Could not initialize daily log");
        const logData = await upsertRes.json();
        targetLogId = logData.id;
        setCurrentLog(logData);
      }

      const res = await fetch(`/api/daily-log/${targetLogId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: newActivityType,
          customActivity: newActivityType === "OTHER" ? newCustomActivity.trim() : undefined,
          description: newDescription.trim() || undefined,
          assignedWorkerIds: newWorkerIds,
          plannedFlag: true,
          completedFlag: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentLog(data.dailyLog);
        setIsAddModalOpen(false);
        setNewCustomActivity("");
        setNewDescription("");
        setNewWorkerIds([]);
        setNewActivityType("IRRIGATION");
        setActionMessage({ type: "success", text: "Activity added successfully!" });
        loadDailyLogs();
      } else {
        const err = await res.json();
        setActionMessage({ type: "error", text: err.error || "Failed to add activity" });
      }
    } catch (e: any) {
      setActionMessage({ type: "error", text: e.message || "An error occurred" });
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Update activity status toggle (Done / Pending)
  const handleStatusToggle = async (
    activityId: string,
    targetStatus: "DONE" | "PENDING"
  ) => {
    if (!currentLog) return;
    try {
      const res = await fetch(`/api/daily-log/${currentLog.id}/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentLog(data.dailyLog);
        loadDailyLogs();
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  // Open Not Done reason prompt
  const openNotDoneModal = (activityId: string, currentReason?: string | null) => {
    setNotDoneTargetId(activityId);
    setNotDoneReason(currentReason || "");
    setNotDoneError("");
  };

  // Submit Not Done reason
  const submitNotDone = async () => {
    if (!notDoneTargetId || !currentLog) return;
    if (!notDoneReason.trim()) {
      setNotDoneError("A valid reason is mandatory when marking an activity as Not Done.");
      return;
    }

    try {
      const res = await fetch(`/api/daily-log/${currentLog.id}/activities/${notDoneTargetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "NOT_DONE",
          reasonIfNotDone: notDoneReason.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentLog(data.dailyLog);
        setNotDoneTargetId(null);
        setNotDoneReason("");
        setNotDoneError("");
        setActionMessage({ type: "success", text: "Activity marked as Not Done with reason." });
        loadDailyLogs();
      } else {
        const err = await res.json();
        setNotDoneError(err.error || "Failed to mark as Not Done.");
      }
    } catch (e: any) {
      setNotDoneError(e.message || "Failed to submit reason");
    }
  };

  // Delete activity
  const handleDeleteActivity = async (activityId: string) => {
    if (!currentLog) return;
    if (!confirm("Are you sure you want to remove this activity?")) return;

    try {
      const res = await fetch(`/api/daily-log/${currentLog.id}/activities/${activityId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentLog(data.dailyLog);
        setActionMessage({ type: "success", text: "Activity removed." });
        loadDailyLogs();
      }
    } catch (e) {
      console.error("Failed to delete activity", e);
    }
  };

  // Run carry forward end-of-day rollover manually
  const handleRunCarryForward = async () => {
    try {
      const res = await fetch("/api/daily-log/auto-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceDate: selectedDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: `Rollover complete: ${data.transitionedActivitiesCount} items auto-flagged Not Done; ${data.carriedForwardCount} items carried forward to next day.`,
        });
        loadDailyLogs();
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to run carry forward." });
      }
    } catch (e: any) {
      setActionMessage({ type: "error", text: e.message || "Error running rollover" });
    }
  };

  // Metrics for selected log
  const activities = currentLog?.activities || [];
  const completedCount = activities.filter((a) => a.completedFlag).length;
  const notDoneCount = activities.filter((a) => !a.completedFlag && !a.plannedFlag).length;
  const pendingCount = activities.filter((a) => a.plannedFlag && !a.completedFlag).length;
  const carriedCount = activities.filter((a) => !!a.carriedForwardFromId).length;

  const currentPlot = plots.find((p) => p.id === selectedPlotId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Alert toast notification */}
      {actionMessage && (
        <div
          id="action-feedback-alert"
          className={`p-4 rounded-2xl flex items-center justify-between shadow-xs transition-all ${actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header & Control Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-[#14532D] to-teal-950 text-white p-4 sm:p-5 shadow-lg border border-emerald-800/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Operational Backbone
              </span>
              <span className="text-[11px] text-emerald-300 font-mono font-medium">
                {selectedDate}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              Daily Work Tracking & Operations
            </h1>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="toggle-master-sheet-btn"
              onClick={() => setActiveView(activeView === "sheet" ? "tasks" : "sheet")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs transition-all hover:scale-[1.02]"
              title="Toggle between All-in-One Master Sheet and Plot Activity Board"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-900" />
              <span>{activeView === "sheet" ? "Switch to Plot Board" : "Open Master Daily Sheet"}</span>
            </button>

            <button
              id="run-carry-forward-btn"
              onClick={handleRunCarryForward}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 shadow-xs transition-all hover:shadow-md"
              title="End-of-day rollover: flags past pending as Not Done and carries forward to next day"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-300" />
              <span>Run Carry Forward</span>
            </button>

            <button
              id="add-activity-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 shadow-xs transition-all hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Add Activity</span>
            </button>
          </div>
        </div>

        {/* Date & Plot Selection Controls Bar */}
        <div className="mt-4 pt-3.5 border-t border-emerald-800/60 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Date Picker Control */}
          <div className="flex flex-wrap items-center gap-1.5 bg-emerald-950/60 p-2 rounded-xl border border-emerald-700/40">
            <button
              onClick={() => setSelectedDate(adjustDate(selectedDate, -1))}
              className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="relative flex-1 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/50 rounded-lg border border-emerald-700/50">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <input
                id="date-picker-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-transparent text-white text-xs font-semibold focus:outline-hidden [color-scheme:dark]"
              />
            </div>

            <button
              onClick={() => setSelectedDate(adjustDate(selectedDate, 1))}
              className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setSelectedDate(getTodayString())}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${selectedDate === getTodayString()
                  ? "bg-emerald-500 text-white shadow-2xs"
                  : "bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200"
                }`}
            >
              Today
            </button>
          </div>

          {/* Plot Selector Dropdown */}
          <div className="flex items-center gap-2 bg-emerald-950/60 p-2 rounded-xl border border-emerald-700/40">
            <div className="w-7 h-7 rounded-lg bg-emerald-800/80 flex items-center justify-center text-emerald-300 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <select
              id="plot-select"
              value={selectedPlotId}
              onChange={(e) => handlePlotChange(e.target.value)}
              className="w-full bg-transparent text-white text-xs font-bold focus:outline-hidden [color-scheme:dark] cursor-pointer"
            >
              {plots.map((plot) => (
                <option key={plot.id} value={plot.id} className="bg-slate-900 text-white">
                  {plot.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
        <button
          id="tab-master-sheet"
          onClick={() => setActiveView("sheet")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeView === "sheet"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
          <span>Master Daily Sheet (All-In-One)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-950 font-black">
            DAY BOOK
          </span>
        </button>

        <button
          id="tab-task-board"
          onClick={() => setActiveView("tasks")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeView === "tasks"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-emerald-300" />
          <span>Plot Activities & Tasks</span>
        </button>
      </div>

      {activeView === "sheet" ? (
        <MasterDailySheet
          selectedDate={selectedDate}
          selectedPlotId={selectedPlotId}
          plots={plots}
          employees={employees}
          onDateChange={setSelectedDate}
          onPlotChange={setSelectedPlotId}
          onSuccess={() => {
            loadDailyLogs();
            setActionMessage({
              type: "success",
              text: "Master Daily Sheet entries processed & pushed to menus successfully!",
            });
          }}
        />
      ) : (
        /* Selected Plot & Day View Container */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Plot Daily Log Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="truncate">{currentPlot?.name || "Selected Plot"}</span>
              </div>
              <span
                id="daily-log-status-badge"
                className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${currentLog?.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : currentLog?.status === "IN_PROGRESS"
                      ? "bg-sky-100 text-sky-800 border border-sky-200"
                      : currentLog?.status === "NOT_DONE"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
              >
                {currentLog?.status || "NO LOG"}
              </span>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Total Planned</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5">{activities.length}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-xs text-emerald-700 font-medium">Completed</div>
                <div className="text-xl font-bold text-emerald-800 mt-0.5">{completedCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <div className="text-xs text-amber-700 font-medium">Pending Needed</div>
                <div className="text-xl font-bold text-amber-800 mt-0.5">{pendingCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <div className="text-xs text-rose-700 font-medium">Not Done</div>
                <div className="text-xl font-bold text-rose-800 mt-0.5">{notDoneCount}</div>
              </div>
            </div>

            {carriedCount > 0 && (
              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-medium flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>
                  <strong>{carriedCount}</strong> activit{carriedCount === 1 ? "y" : "ies"} carried forward from prior dates.
                </span>
              </div>
            )}

            {/* Daily Log Details */}
            {currentLog ? (
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Supervisor / Logged By:</span>
                  <span className="font-semibold text-slate-700">{currentLog.createdBy || "Field Staff"}</span>
                </div>
                {currentLog.notes && (
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-1">Log Notes:</span>
                    <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 italic">
                      &ldquo;{currentLog.notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500">
                  No daily log entry recorded for this plot on {selectedDate}.
                </p>
                <button
                  onClick={handleCreateDailyLog}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                >
                  Start Daily Log
                </button>
              </div>
            )}
          </div>

          {/* Quick Date Switcher for Other Plots */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              All Plots for {selectedDate}
            </h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {plots.map((p) => {
                const log = allDateLogs.find((l) => l.plotId === p.id);
                const isSelected = p.id === selectedPlotId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePlotChange(p.id)}
                    className={`w-full text-left p-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${isSelected
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                      }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${log?.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : log?.status === "NOT_DONE"
                            ? "bg-rose-100 text-rose-800"
                            : log
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-400"
                        }`}
                    >
                      {log ? `${log.activities.length} tasks` : "No log"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Day View Activities List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                  Planned Activities for {currentPlot?.name || "Plot"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggle completion status or view carry-forward reasons
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Activity
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                Loading daily activities...
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Activities Logged</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No work activities scheduled for this plot on {selectedDate}. Click &ldquo;Add Activity&rdquo; to plan work.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Activity
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                {activities.map((activity) => {
                  const isDone = activity.completedFlag;
                  const isNotDone = !activity.completedFlag && !activity.plannedFlag;
                  const isPending = activity.plannedFlag && !activity.completedFlag;

                  return (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-xl border transition-all ${isDone
                          ? "bg-emerald-50/40 border-emerald-200/80 shadow-2xs"
                          : isNotDone
                            ? "bg-rose-50/40 border-rose-200/80 shadow-2xs"
                            : "bg-white border-slate-200 shadow-2xs"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 text-slate-800">
                              {activity.activityType}
                            </span>
                            {activity.customActivity && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 text-purple-800">
                                {activity.customActivity}
                              </span>
                            )}
                            {activity.carriedForwardFromId && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3 text-cyan-600" />
                                Carried Forward
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-slate-800 leading-snug">
                            {activity.description || activity.customActivity || ACTIVITY_TYPES.find((t) => t.value === activity.activityType)?.label || activity.activityType}
                          </p>

                          {/* Workers Chips */}
                          {activity.assignedWorkerNames && activity.assignedWorkerNames.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-600">
                              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {activity.assignedWorkerNames.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Reason Not Done display */}
                          {activity.reasonIfNotDone && (
                            <div className="p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-xs text-rose-900 mt-2 flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Reason Not Done: </span>
                                <span>{activity.reasonIfNotDone}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status Toggle Button Group */}
                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/80 shadow-inner">
                            <button
                              id={`status-toggle-done-${activity.id}`}
                              onClick={() => handleStatusToggle(activity.id, "DONE")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isDone
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-emerald-800"
                                }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Done
                            </button>

                            <button
                              id={`status-toggle-pending-${activity.id}`}
                              onClick={() => handleStatusToggle(activity.id, "PENDING")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isPending
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "text-slate-600 hover:text-amber-800"
                                }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Pending
                            </button>

                            <button
                              id={`status-toggle-not-done-${activity.id}`}
                              onClick={() => openNotDoneModal(activity.id, activity.reasonIfNotDone)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isNotDone
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-rose-800"
                                }`}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Not Done
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 self-end transition-colors"
                            title="Remove activity"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* MODAL 1: Add Activity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Work Activity</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4">
              {/* Activity Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Activity Type</label>
                <select
                  id="activity-type-select"
                  value={newActivityType}
                  onChange={(e) => setNewActivityType(e.target.value as ActivityType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Activity name if OTHER */}
              {newActivityType === "OTHER" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Custom Activity Name</label>
                  <input
                    id="custom-activity-input"
                    type="text"
                    placeholder="e.g. Tomato tying, Soil aeration, Honey harvest"
                    value={newCustomActivity}
                    onChange={(e) => setNewCustomActivity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Description / Instructions
                </label>
                <textarea
                  id="activity-desc-input"
                  rows={3}
                  placeholder="Details on acreage, rows, chemical dosage, or target plot zone..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Assign Workers (Employees stub relation) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Assign Workers / Field Staff
                </label>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 max-h-40 overflow-y-auto space-y-1.5">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-emerald-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={`worker-checkbox-${emp.id}`}
                        checked={newWorkerIds.includes(emp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWorkerIds([...newWorkerIds, emp.id]);
                          } else {
                            setNewWorkerIds(newWorkerIds.filter((id) => id !== emp.id));
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{emp.name}</span>
                    </label>
                  ))}
                  {employees.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No active employees found in roster.</p>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-activity-btn"
                  type="submit"
                  disabled={isSubmittingActivity}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmittingActivity ? "Saving Activity..." : "Add to Daily Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Required "Reason Not Done" Modal */}
      {notDoneTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-800 pb-2 border-b border-rose-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Reason Required</h3>
                <p className="text-xs text-slate-500">Why was this activity not completed today?</p>
              </div>
            </div>

            {notDoneError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{notDoneError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Reason Not Done <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="reason-not-done-input"
                required
                rows={3}
                placeholder="e.g. Pump failure, Heavy rainfall, Fertilizer stock depleted, Worker absent..."
                value={notDoneReason}
                onChange={(e) => {
                  setNotDoneReason(e.target.value);
                  setNotDoneError("");
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-400">
                This item will be recorded with this reason and can be carried forward as needed work for tomorrow.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setNotDoneTargetId(null);
                  setNotDoneReason("");
                  setNotDoneError("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-reason-btn"
                type="button"
                onClick={submitNotDone}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
              >
                Confirm Not Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyLogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-sm font-bold">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
          Loading Daily Work Tracking...
        </div>
      }
    >
      <DailyLogContent />
    </Suspense>
  );
}
