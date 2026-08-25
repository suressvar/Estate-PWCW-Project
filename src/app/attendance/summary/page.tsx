"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, Calendar, Filter, Users, TrendingUp } from "lucide-react";

export default function AttendanceSummaryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [workingDays, setWorkingDays] = useState(26);

  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance/summary?year=${year}&month=${month}&workingDays=${workingDays}`);
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [year, month, workingDays]);

  const exportCSV = () => {
    if (summary.length === 0) return;
    const headers = ["Employee", "Role", "WageType", "Rate", "PresentDays", "HalfDays", "AbsentDays", "LeaveDays", "EffectivePresent", "WorkingDays", "AttendancePercent"];
    const rows = summary.map((s) => [
      s.employeeName,
      s.roleName,
      s.wageType,
      s.wageRate,
      s.presentDays,
      s.halfDays,
      s.absentDays,
      s.leaveDays,
      s.effectivePresentDays,
      s.workingDays,
      `${s.attendancePercent}%`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_summary_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/attendance"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Attendance Summary & Performance Report</h1>
            <p className="text-xs text-slate-500 font-medium">Aggregated staff working day percentages for payroll verification.</p>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
            >
              {monthNames.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Year:</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Month Working Days:</span>
            <input
              type="number"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="w-16 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-emerald-800 bg-emerald-50 text-[11px] font-bold border border-emerald-200">
            &gt;90% Excellent
          </span>
          <span className="px-2.5 py-1 rounded-full text-amber-800 bg-amber-50 text-[11px] font-bold border border-amber-200">
            75-90% Moderate
          </span>
          <span className="px-2.5 py-1 rounded-full text-red-800 bg-red-50 text-[11px] font-bold border border-red-200">
            &lt;75% Low
          </span>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Designation</th>
                <th className="p-3.5">Wage Type & Rate</th>
                <th className="p-3.5 text-center">Present</th>
                <th className="p-3.5 text-center">Half Days</th>
                <th className="p-3.5 text-center">Absent</th>
                <th className="p-3.5 text-center">Leaves</th>
                <th className="p-3.5 text-center">Effective Days</th>
                <th className="p-3.5 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">Computing summary aggregations...</td>
                </tr>
              ) : (
                summary.map((s) => (
                  <tr key={s.employeeId} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{s.employeeName}</td>
                    <td className="p-3.5 font-medium text-slate-600">{s.roleName}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">₹{s.wageRate}</span>
                      <span className="text-slate-500 text-[11px] ml-1">({s.wageType})</span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-800">{s.presentDays}</td>
                    <td className="p-3.5 text-center font-semibold text-amber-700">{s.halfDays}</td>
                    <td className="p-3.5 text-center font-semibold text-rose-700">{s.absentDays}</td>
                    <td className="p-3.5 text-center font-semibold text-sky-700">{s.leaveDays}</td>
                    <td className="p-3.5 text-center font-bold text-slate-900 font-mono">
                      {s.effectivePresentDays} / {s.workingDays}
                    </td>
                    <td className="p-3.5 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                          s.attendancePercent >= 90
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : s.attendancePercent >= 75
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-red-50 text-red-800 border-red-200"
                        }`}
                      >
                        {s.attendancePercent}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
