"use client";

import { useCallback, useEffect, useState } from "react";
import { csvDocument, csvDataUri } from "@/lib/csv";
import type { AttendanceSummary } from "@/types/api";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { FileSpreadsheet, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AttendanceSummaryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [workingDays, setWorkingDays] = useState(26);

  const [summary, setSummary] = useState<AttendanceSummary>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/attendance/summary?year=${year}&month=${month}&workingDays=${workingDays}`
      );
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, workingDays, year]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchSummary();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [year, month, workingDays, fetchSummary]);

  const exportCSV = () => {
    if (summary.length === 0) return;
    const headers = [
      "Employee",
      "Role",
      "WageType",
      "Rate",
      "PresentDays",
      "HalfDays",
      "AbsentDays",
      "LeaveDays",
      "EffectivePresent",
      "WorkingDays",
      "AttendancePercent",
    ];
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

    const encodedUri = csvDataUri(csvDocument(headers, rows));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_summary_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Attendance Summary & Performance Report"
        breadcrumbs={[
          { label: "HR & Workforce", href: "/employees" },
          { label: "Attendance Grid", href: "/attendance" },
          { label: "Performance Summary" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Matrix View
            </Link>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV Report
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-2.5 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#174D3C]"
            >
              {monthNames.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Year:</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-2.5 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#174D3C]"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Month Working Days:</span>
            <input
              type="number"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 text-center focus:outline-none focus:border-[#174D3C]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[#174D3C] bg-[#EAF3EE] text-[10px] font-bold">
            &gt;90% Excellent
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-amber-800 bg-amber-50 text-[10px] font-bold">
            75-90% Moderate
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-rose-800 bg-rose-50 text-[10px] font-bold">
            &lt;75% Low
          </span>
        </div>
      </div>

      {/* Summary Table */}
      <ContentCard
        title={`${monthNames[month - 1]} ${year} Workforce Attendance Audit`}
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Wage Type & Rate</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Half Days</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-center">Leaves</th>
                <th className="py-3 px-4 text-center">Effective Days</th>
                <th className="py-3 px-4 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-slate-400 font-medium"
                  >
                    Computing summary aggregations...
                  </td>
                </tr>
              ) : summary.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-slate-400 font-medium"
                  >
                    No attendance records logged for this period.
                  </td>
                </tr>
              ) : (
                summary.map((s) => (
                  <tr key={s.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {s.employeeName}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {s.roleName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        ₹{s.wageRate}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-1">
                        ({s.wageType})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#174D3C]">
                      {s.presentDays}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-amber-700">
                      {s.halfDays}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-rose-600">
                      {s.absentDays}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-emerald-700">
                      {s.leaveDays}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                      {s.effectivePresentDays} / {s.workingDays}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          s.attendancePercent >= 90
                            ? "bg-[#EAF3EE] text-[#174D3C]"
                            : s.attendancePercent >= 75
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-800"
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
      </ContentCard>
    </PageContainer>
  );
}
