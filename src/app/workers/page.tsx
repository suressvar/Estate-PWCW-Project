"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Sparkles,
  CreditCard,
  Briefcase,
  Layers,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  RefreshCw,
  Sprout,
  Check,
} from "lucide-react";
import {
  WorkerItem,
  WorkerAttendanceItem,
  WorkerActivityLogItem,
  WageEntryItem,
  WorkerAttendanceStatus,
  WagePaidStatus,
} from "@/lib/db-storage";

export default function WorkersManagementPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<
    "attendance" | "activities" | "summary"
  >("attendance");

  // Date Navigation
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Month & Year for Monthly Summary
  const now = new Date();
  const [summaryYear, setSummaryYear] = useState<number>(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState<number>(now.getMonth() + 1);

  // Core Data States
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [dailySheet, setDailySheet] = useState<{
    workers: (WorkerItem & {
      attendance?: WorkerAttendanceItem;
      wage?: WageEntryItem;
      activities?: WorkerActivityLogItem[];
    })[];
    summary: any;
  } | null>(null);

  const [activitiesList, setActivitiesList] = useState<WorkerActivityLogItem[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);

  // External Reference Data (Plots, Crop Cycles, Daily Logs)
  const [plots, setPlots] = useState<any[]>([]);
  const [cropCycles, setCropCycles] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);

  // Loading & Alert States
  const [loading, setLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // Modals
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [actWorkerId, setActWorkerId] = useState("");
  const [actPlotId, setActPlotId] = useState("");
  const [actDailyLogId, setActDailyLogId] = useState("");
  const [actCropCycleId, setActCropCycleId] = useState("");
  const [actDescription, setActDescription] = useState("");
  const [actHours, setActHours] = useState("8");

  // 1. Fetch Reference Data (Plots, Crop Cycles, Daily Logs, Employee Roles)
  useEffect(() => {
    async function loadRefs() {
      try {
        const [plotsRes, cyclesRes, dlRes] = await Promise.all([
          fetch("/api/plots"),
          fetch("/api/crop-cycles"),
          fetch(`/api/daily-log?skipAuto=true`),
        ]);
        if (plotsRes.ok) setPlots(await plotsRes.json());
        if (cyclesRes.ok) {
          const cData = await cyclesRes.json();
          setCropCycles(cData.cycles || (Array.isArray(cData) ? cData : []));
        }
        if (dlRes.ok) setDailyLogs(await dlRes.json());
      } catch (e) {
        console.error("Failed to load reference data", e);
      }
    }
    loadRefs();
  }, []);

  // 2. Fetch Workers
  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/workers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
        if (data.length > 0 && !actWorkerId) {
          setActWorkerId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [actWorkerId]);

  // 3. Fetch Daily Attendance Sheet
  const fetchDailySheet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workers/attendance?date=${selectedDate}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setDailySheet(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // 4. Fetch Activities List
  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/workers/activities", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setActivitiesList(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 6. Fetch Monthly Summary
  const fetchMonthlySummary = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/workers/summary?year=${summaryYear}&month=${summaryMonth}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setMonthlySummary(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [summaryYear, summaryMonth]);

  // Tab-based data trigger
  useEffect(() => {
    fetchWorkers();
    if (activeTab === "attendance") {
      fetchDailySheet();
    } else if (activeTab === "activities") {
      fetchActivities();
    } else if (activeTab === "summary") {
      fetchMonthlySummary();
    }
  }, [activeTab, fetchWorkers, fetchDailySheet, fetchActivities, fetchMonthlySummary]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };
  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Mark/Update Single Worker Attendance
  const handleUpdateAttendance = async (
    workerId: string,
    status: WorkerAttendanceStatus,
    overrideHours?: number,
    cropCycleId?: string
  ) => {
    try {
      const res = await fetch("/api/workers/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId,
          date: selectedDate,
          status,
          hoursWorked: overrideHours,
          cropCycleId: cropCycleId !== undefined ? cropCycleId : undefined,
        }),
      });
      if (res.ok) {
        fetchDailySheet();
        setActionAlert({
          type: "success",
          text: `Attendance and wage computed for ${selectedDate}.`,
        });
      }
    } catch (e: any) {
      setActionAlert({ type: "error", text: e.message || "Failed to update attendance." });
    }
  };

  // Bulk Mark All Present
  const handleBulkMarkPresent = async () => {
    if (!dailySheet?.workers) return;
    try {
      setLoading(true);
      await Promise.all(
        dailySheet.workers
          .filter((w) => w.active)
          .map((w) =>
            fetch("/api/workers/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workerId: w.id,
                date: selectedDate,
                status: "PRESENT",
                hoursWorked: 8,
              }),
            })
          )
      );
      fetchDailySheet();
      setActionAlert({
        type: "success",
        text: `Marked all active workers as PRESENT for ${selectedDate}!`,
      });
    } catch (e: any) {
      setActionAlert({ type: "error", text: "Error updating attendance." });
    } finally {
      setLoading(false);
    }
  };

  // Bulk Mark All as Sunday Leave (0 wage, no absent)
  const handleBulkMarkSundayLeave = async () => {
    if (!dailySheet?.workers) return;
    try {
      setLoading(true);
      await Promise.all(
        dailySheet.workers
          .filter((w) => w.active)
          .map((w) =>
            fetch("/api/workers/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workerId: w.id,
                date: selectedDate,
                status: "LEAVE",
                hoursWorked: 0,
                notes: "Sunday (Weekly Off / Leave)",
              }),
            })
          )
      );
      fetchDailySheet();
      setActionAlert({
        type: "success",
        text: `Calculated all active workers as LEAVE for Sunday ${selectedDate} (No salary, absent not marked).`,
      });
    } catch (e: any) {
      setActionAlert({ type: "error", text: "Error updating attendance." });
    } finally {
      setLoading(false);
    }
  };



  // Delete Worker
  const handleDeleteWorker = async (workerId: string, workerName: string) => {
    if (!confirm(`Are you sure you want to remove worker "${workerName}" and all associated attendance/wage records?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/workers/${workerId}`, { method: "DELETE" });
      if (res.ok) {
        fetchWorkers();
        fetchDailySheet();
        setActionAlert({ type: "success", text: `Worker "${workerName}" removed successfully.` });
      } else {
        const err = await res.json();
        setActionAlert({ type: "error", text: err.error || "Failed to remove worker." });
      }
    } catch (e: any) {
      setActionAlert({ type: "error", text: e.message || "Failed to remove worker." });
    }
  };

  // Create Worker Activity Log
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actWorkerId || !actPlotId || !actDailyLogId || !actDescription.trim()) {
      setActionAlert({
        type: "error",
        text: "Worker, Plot, Daily Log and Description are required.",
      });
      return;
    }
    try {
      const res = await fetch("/api/workers/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: actWorkerId,
          plotId: actPlotId,
          dailyLogId: actDailyLogId,
          cropCycleId: actCropCycleId || null,
          activityDescription: actDescription,
          timeSpentHours: Number(actHours) || 8,
        }),
      });
      if (res.ok) {
        setIsActivityModalOpen(false);
        setActDescription("");
        fetchActivities();
        fetchDailySheet();
        setActionAlert({ type: "success", text: "Worker activity logged successfully." });
      }
    } catch (e: any) {
      setActionAlert({ type: "error", text: e.message || "Failed to log activity." });
    }
  };

  // Delete Worker Activity
  const handleDeleteActivity = async (actId: string) => {
    if (!confirm("Are you sure you want to delete this activity log?")) return;
    try {
      const res = await fetch(`/api/workers/activities?id=${actId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchActivities();
        setActionAlert({ type: "success", text: "Activity log removed." });
      }
    } catch (e: any) {
      setActionAlert({ type: "error", text: e.message || "Failed to delete activity." });
    }
  };



  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Workforce Operations
              </span>
              <span className="text-xs text-emerald-300/80 font-mono">
                {todayStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Daily Attendance & Tracking
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              id="employees-roster-btn"
              href="/employees"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 shadow-md transition-all hover:scale-[1.02]"
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Employees Roster</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          id="worker-feedback-alert"
          className={`p-4 rounded-2xl flex items-center justify-between shadow-xs transition-all ${
            actionAlert.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : actionAlert.type === "warning"
              ? "bg-amber-50 text-amber-900 border border-amber-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : actionAlert.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <X className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{actionAlert.text}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-full sm:w-fit">
        <button
          id="tab-attendance"
          onClick={() => setActiveTab("attendance")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "attendance"
              ? "bg-white text-emerald-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Attendance</span>
        </button>
        <button
          id="tab-activities"
          onClick={() => setActiveTab("activities")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "activities"
              ? "bg-white text-emerald-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Worker Activities</span>
        </button>

        <button
          id="tab-summary"
          onClick={() => setActiveTab("summary")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "summary"
              ? "bg-white text-emerald-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Monthly Summary &amp; CSV</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE & HOURS TRACKING */}
      {/* ========================================================================= */}
      {activeTab === "attendance" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Date Selector & Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="prev-date-btn"
                onClick={handlePrevDay}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                id="attendance-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                id="next-date-btn"
                onClick={handleNextDay}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                id="today-btn"
                onClick={() => setSelectedDate(todayStr)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Today
              </button>
              {new Date(selectedDate + "T00:00:00").getDay() === 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  <span>Sunday - Weekly Off (Leave)</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {new Date(selectedDate + "T00:00:00").getDay() === 0 && (
                <button
                  id="bulk-mark-sunday-leave-btn"
                  onClick={handleBulkMarkSundayLeave}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Mark All Sunday Leave</span>
                </button>
              )}
              <button
                id="bulk-mark-present-btn"
                onClick={handleBulkMarkPresent}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                <span>Mark All Present (8 hrs)</span>
              </button>
            </div>
          </div>

          {/* Daily Metric Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Present</span>
              <span className="text-xl font-extrabold text-emerald-700">
                {dailySheet?.summary?.presentCount || 0}
              </span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Half-Day</span>
              <span className="text-xl font-extrabold text-amber-700">
                {dailySheet?.summary?.halfDayCount || 0}
              </span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Absent</span>
              <span className="text-xl font-extrabold text-rose-700">
                {dailySheet?.summary?.absentCount || 0}
              </span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Leave</span>
              <span className="text-xl font-extrabold text-sky-700">
                {dailySheet?.summary?.leaveCount || 0}
              </span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Hours</span>
              <span className="text-xl font-extrabold text-indigo-700">
                {dailySheet?.summary?.totalHoursWorked || 0} hrs
              </span>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Wages Owed</span>
              <span className="text-xl font-black text-slate-900" id="daily-total-wages-badge">
                ₹{(dailySheet?.summary?.totalWagesComputed || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" id="attendance-table">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Worker</th>
                    <th className="py-3 px-4">Daily Rate</th>
                    <th className="py-3 px-4 text-center">Attendance Status</th>
                    <th className="py-3 px-4 text-center">Hours Worked</th>
                    <th className="py-3 px-4">Crop Cycle Link (Labor Expense)</th>
                    <th className="py-3 px-4 text-right">Computed Wage</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {dailySheet?.workers && dailySheet.workers.length > 0 ? (
                    dailySheet.workers.map((w) => {
                      const currentStatus = w.attendance?.status;
                      const hours = w.attendance ? w.attendance.hoursWorked : 0;
                      const wage = w.wage ? w.wage.computedAmount : 0;
                      const cycleId = w.wage?.cropCycleId || "";

                      return (
                        <tr
                          key={w.id}
                          className="hover:bg-slate-50/60 transition-colors"
                          id={`worker-row-${w.id}`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{w.name}</div>
                            <div className="text-[11px] text-slate-500">{w.role || "Worker"}</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            ₹{w.dailyWageRate.toLocaleString()}/day
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                              <button
                                id={`btn-present-${w.id}`}
                                onClick={() => handleUpdateAttendance(w.id, "PRESENT", 8, cycleId)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  currentStatus === "PRESENT"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-emerald-700"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                id={`btn-halfday-${w.id}`}
                                onClick={() => handleUpdateAttendance(w.id, "HALF_DAY", 4, cycleId)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  currentStatus === "HALF_DAY"
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-amber-700"
                                }`}
                              >
                                Half-Day
                              </button>
                              <button
                                id={`btn-absent-${w.id}`}
                                onClick={() => handleUpdateAttendance(w.id, "ABSENT", 0, cycleId)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  currentStatus === "ABSENT"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-rose-700"
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                id={`btn-leave-${w.id}`}
                                onClick={() => handleUpdateAttendance(w.id, "LEAVE", 0, cycleId)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  currentStatus === "LEAVE"
                                    ? "bg-sky-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-sky-700"
                                }`}
                              >
                                Leave
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              value={w.attendance ? w.attendance.hoursWorked : ""}
                              placeholder="0"
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (currentStatus) {
                                  handleUpdateAttendance(w.id, currentStatus, val, cycleId);
                                }
                              }}
                              className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-center font-bold text-slate-800 text-xs"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={cycleId}
                              onChange={(e) => {
                                const newCycle = e.target.value;
                                if (currentStatus) {
                                  handleUpdateAttendance(w.id, currentStatus, hours, newCycle);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 w-48"
                            >
                              <option value="">-- No cycle sync --</option>
                              {cropCycles.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.cropName} ({c.plotName || "Plot"})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className="text-sm font-black text-slate-900"
                              id={`worker-wage-${w.id}`}
                            >
                              ₹{wage.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              id={`delete-worker-${w.id}`}
                              onClick={() => handleDeleteWorker(w.id, w.name)}
                              title={`Delete worker ${w.name}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No active employees found. Please register employees in the{" "}
                        <Link href="/employees" className="underline font-bold text-emerald-700 hover:text-emerald-800">
                          Employees Roster
                        </Link>
                        .
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKER ACTIVITIES BREAKDOWN */}
      {/* ========================================================================= */}
      {activeTab === "activities" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Granular Field Activities</h2>
            </div>
            <button
              id="log-activity-btn"
              onClick={() => setIsActivityModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Worker Activity</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" id="activities-table">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Worker</th>
                    <th className="py-3 px-4">Plot</th>
                    <th className="py-3 px-4">Crop Cycle</th>
                    <th className="py-3 px-4">Activity Description</th>
                    <th className="py-3 px-4 text-center">Time Spent</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {activitiesList.length > 0 ? (
                    activitiesList.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{act.workerName}</td>
                        <td className="py-3 px-4">{act.plotName}</td>
                        <td className="py-3 px-4 text-emerald-700 font-semibold">
                          {act.cropName || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          {act.activityDescription}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-700">
                          {act.timeSpentHours} hrs
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteActivity(act.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No worker activity logs recorded yet. Click &ldquo;Log Worker Activity&rdquo;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* TAB 4: MONTHLY SUMMARY & CSV EXPORT */}
      {/* ========================================================================= */}
      {activeTab === "summary" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                id="summary-month-select"
                value={summaryMonth}
                onChange={(e) => setSummaryMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1, 1).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
              <select
                id="summary-year-select"
                value={summaryYear}
                onChange={(e) => setSummaryYear(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            <a
              id="export-csv-btn"
              href={`/api/workers/summary?year=${summaryYear}&month=${summaryMonth}&format=csv`}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Monthly Summary CSV</span>
            </a>
          </div>

          {/* Monthly Rollup KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Labor Hours"
              value={`${monthlySummary?.estateTotals?.totalHours || 0} hrs`}
              subtitle={`For ${monthlySummary?.monthName || "Selected Month"} ${summaryYear}`}
            />
            <StatCard
              title="Total Wages Earned"
              value={`₹${(monthlySummary?.estateTotals?.totalWagesEarned || 0).toLocaleString()}`}
              subtitle="All workers cumulative"
            />
            <StatCard
              title="Total Wages Paid"
              value={`₹${(monthlySummary?.estateTotals?.totalWagesPaid || 0).toLocaleString()}`}
              subtitle="Cash/Bank settlements"
            />
            <StatCard
              title="Net Balance Due"
              value={`₹${(monthlySummary?.estateTotals?.totalBalanceDue || 0).toLocaleString()}`}
              isPositive={(monthlySummary?.estateTotals?.totalBalanceDue || 0) === 0}
              change={(monthlySummary?.estateTotals?.totalBalanceDue || 0) === 0 ? "ALL SETTLED" : "OUTSTANDING"}
            />
          </div>

          {/* Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" id="monthly-summary-table">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Worker</th>
                    <th className="py-3 px-4 text-right">Daily Rate</th>
                    <th className="py-3 px-4 text-center">Days</th>
                    <th className="py-3 px-4 text-center">Present</th>
                    <th className="py-3 px-4 text-center">Half-Day</th>
                    <th className="py-3 px-4 text-center">Attendance %</th>
                    <th className="py-3 px-4 text-center">Total Hours</th>
                    <th className="py-3 px-4 text-right">Earned (₹)</th>
                    <th className="py-3 px-4 text-right">Paid (₹)</th>
                    <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {monthlySummary?.summaries && monthlySummary.summaries.length > 0 ? (
                    monthlySummary.summaries.map((s: any) => (
                      <tr key={s.workerId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.workerName}</div>
                          <div className="text-[11px] text-slate-500">{s.role}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          ₹{s.dailyWageRate.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">{s.totalDaysRecorded}</td>
                        <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                          {s.presentDays}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-amber-700">
                          {s.halfDays}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {s.attendancePercent}%
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-700">
                          {s.totalHoursWorked} hrs
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ₹{s.totalWagesEarned.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          ₹{s.totalWagesPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-700">
                          ₹{s.balanceDue.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No monthly records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}





      {/* ========================================================================= */}
      {/* MODAL 2: LOG WORKER ACTIVITY MODAL */}
      {/* ========================================================================= */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Worker Field Activity</h3>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Worker *</label>
                <select
                  id="act-worker-select"
                  value={actWorkerId}
                  onChange={(e) => setActWorkerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role || "Worker"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Plot *</label>
                <select
                  id="act-plot-select"
                  value={actPlotId}
                  onChange={(e) => setActPlotId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  <option value="">-- Choose Plot --</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Daily Log Link *</label>
                <select
                  id="act-daily-log-select"
                  value={actDailyLogId}
                  onChange={(e) => setActDailyLogId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  <option value="">-- Choose Daily Log --</option>
                  {dailyLogs.map((dl) => (
                    <option key={dl.id} value={dl.id}>
                      Log: {dl.date} ({dl.plotName || "Plot"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Crop Cycle (Optional)</label>
                <select
                  id="act-cycle-select"
                  value={actCropCycleId}
                  onChange={(e) => setActCropCycleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  <option value="">-- No crop cycle link --</option>
                  {cropCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cropName} ({c.plotName || "Plot"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Activity Description *</label>
                <input
                  id="act-desc-input"
                  type="text"
                  required
                  placeholder="e.g. Trellising vines, spraying neem oil..."
                  value={actDescription}
                  onChange={(e) => setActDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Time Spent (Hours) *</label>
                <input
                  id="act-hours-input"
                  type="number"
                  step="0.5"
                  required
                  value={actHours}
                  onChange={(e) => setActHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  id="save-activity-btn"
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                >
                  Save Activity Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
