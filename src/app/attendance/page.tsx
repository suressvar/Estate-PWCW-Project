
"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { AttendanceRecord } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { AttendanceStatus, EmployeeItem } from "@/lib/hr-data";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ContentCard } from "@/components/ui/content-card";
import {
  CheckCircle2,
  FileSpreadsheet,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";

export default function AttendanceGridPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Cell Click Modal
  const [modalData, setModalData] = useState<{
    employeeId: string;
    employeeName: string;
    dateStr: string;
    status: AttendanceStatus;
    notes?: string;
    checkInTime?: string;
    checkOutTime?: string;
  } | null>(null);

  const [bulkDate, setBulkDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Days in month calculation
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const fetchGrid = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance/grid?year=${year}&month=${month}`);
      const data = await res.json();
      setEmployees(data.employees || []);
      setRecords(data.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchGrid();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [year, month, fetchGrid]);

  const isSunday = (day: number) => {
    return new Date(year, month - 1, day).getDay() === 0;
  };

  const getRecordForCell = (
    empId: string,
    day: number
  ): Partial<AttendanceRecord> | undefined => {
    const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const found = records.find(
      (r) => r.employeeId === empId && r.attendanceDate === dayStr
    );
    if (!found && isSunday(day)) {
      return {
        id: `sunday_${empId}_${dayStr}`,
        employeeId: empId,
        attendanceDate: dayStr,
        status: "LEAVE" as AttendanceStatus,
        notes: "Sunday (Weekly Off / Leave)",
      };
    }
    return found;
  };

  const handleCellClick = (emp: EmployeeItem, day: number) => {
    const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const rec = getRecordForCell(emp.id, day);
    setModalData({
      employeeId: emp.id,
      employeeName: emp.name,
      dateStr: dayStr,
      status: rec?.status || (isSunday(day) ? "LEAVE" : "PRESENT"),
      notes: rec?.notes || "",
      checkInTime: rec?.checkInTime || "08:00",
      checkOutTime: rec?.checkOutTime || "17:00",
    });
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData) return;

    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: modalData.employeeId,
          attendanceDate: modalData.dateStr,
          status: modalData.status,
          notes: modalData.notes,
          checkInTime: modalData.checkInTime,
          checkOutTime: modalData.checkOutTime,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        // Live state update without reload
        setRecords((prev) => {
          const idx = prev.findIndex(
            (r) =>
              r.employeeId === saved.employeeId &&
              r.attendanceDate === saved.attendanceDate
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        });
        setModalData(null);
      }
    } catch (err) {
      alert("Error marking attendance: " + getErrorMessage(err));
    }
  };

  const handleBulkMark = async () => {
    if (!confirm(`Mark ALL active PWCW employees as PRESENT for ${bulkDate}?`))
      return;
    try {
      const res = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceDate: bulkDate,
          status: "PRESENT",
        }),
      });
      if (res.ok) {
        setMsg({
          type: "success",
          text: `Marked all active employees as Present for ${bulkDate}`,
        });
        fetchGrid();
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
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
        title="Monthly Attendance Matrix Grid"
        breadcrumbs={[
          { label: "HR & Workforce", href: "/employees" },
          { label: "Attendance Matrix" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Month / Year picker */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs text-xs font-semibold">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent text-slate-800 focus:outline-none cursor-pointer"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
              <input
                type="date"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className="px-2 py-0.5 text-xs border border-slate-200 rounded text-slate-800 font-medium"
              />
              <button
                onClick={handleBulkMark}
                className="px-3 py-1 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                Mark All Present
              </button>
            </div>

            <Link
              href="/attendance/summary"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#174D3C]" />
              Summary View
            </Link>
          </div>
        }
      />

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success"
            ? "bg-[#EAF3EE] text-[#174D3C] border-[#174D3C]/20"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#174D3C]" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          )}
          {msg.text}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700">Status Badges:</span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-5 h-5 rounded bg-[#174D3C] text-white font-bold flex items-center justify-center text-[10px]">
              P
            </span>{" "}
            Present (1.0)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-5 h-5 rounded bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">
              H
            </span>{" "}
            Half Day (0.5)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-5 h-5 rounded bg-rose-600 text-white font-bold flex items-center justify-center text-[10px]">
              A
            </span>{" "}
            Absent (0.0)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-5 h-5 rounded bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px]">
              L
            </span>{" "}
            Leave
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-5 h-5 rounded bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px]">
              -
            </span>{" "}
            Not Logged
          </span>
        </div>
        <span className="text-slate-400 text-xs">
          Showing {monthNames[month - 1]} {year}
        </span>
      </div>

      {/* Attendance Matrix Table */}
      <ContentCard
        title={`${monthNames[month - 1]} ${year} Daily Timesheet`}
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 text-left sticky left-0 bg-[#F8FAFC] z-10 min-w-[200px] border-r border-slate-200">
                  Staff Member & Role
                </th>
                {dayNumbers.map((d) => (
                  <th
                    key={d}
                    className="p-2 min-w-[32px] border-r border-slate-200/60 font-mono text-[11px]"
                  >
                    {d}
                  </th>
                ))}
                <th className="p-3 min-w-[80px] bg-[#F8FAFC] font-semibold">Present</th>
                <th className="p-3 min-w-[70px] bg-[#F8FAFC] font-semibold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={daysInMonth + 3}
                    className="p-12 text-center text-slate-400 font-medium"
                  >
                    Loading attendance matrix...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={daysInMonth + 3}
                    className="p-12 text-center text-slate-400 font-medium"
                  >
                    No active employees registered.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  let pCount = 0;
                  let hCount = 0;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      {/* Sticky Employee Name */}
                      <td className="p-3 text-left sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {emp.roleName} • ₹{emp.wageRate}
                        </div>
                      </td>

                      {/* Day Cells */}
                      {dayNumbers.map((d) => {
                        const rec = getRecordForCell(emp.id, d);
                        let badgeBg = "bg-slate-100 text-slate-400";
                        let letter = "-";

                        if (rec) {
                          if (rec.status === "PRESENT") {
                            badgeBg = "bg-[#174D3C] text-white font-bold";
                            letter = "P";
                            pCount++;
                          } else if (rec.status === "HALF_DAY") {
                            badgeBg = "bg-amber-500 text-white font-bold";
                            letter = "H";
                            hCount++;
                          } else if (rec.status === "ABSENT") {
                            badgeBg = "bg-rose-600 text-white font-bold";
                            letter = "A";
                          } else if (rec.status === "LEAVE") {
                            badgeBg = "bg-emerald-800 text-white font-bold";
                            letter = "L";
                          }
                        }

                        return (
                          <td
                            key={d}
                            onClick={() => handleCellClick(emp, d)}
                            className="p-1 border-r border-slate-100 cursor-pointer hover:bg-[#EAF3EE]/50 transition-colors"
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] mx-auto ${badgeBg}`}
                            >
                              {letter}
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary calculations */}
                      <td className="p-2 font-semibold text-slate-800 bg-[#F8FAFC] font-mono">
                        {(pCount + hCount * 0.5).toFixed(1)} d
                      </td>
                      <td className="p-2 font-semibold bg-[#F8FAFC] font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pCount + hCount * 0.5 >= 20
                            ? "bg-[#EAF3EE] text-[#174D3C]"
                            : "bg-amber-50 text-amber-800"
                            }`}
                        >
                          {Math.round(((pCount + hCount * 0.5) / 26) * 100)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Cell Status Popover Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Mark Attendance
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {modalData.employeeName}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  {modalData.dateStr}
                </div>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Status *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    ["PRESENT", "HALF_DAY", "ABSENT", "LEAVE"] as AttendanceStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalData({ ...modalData, status: st })}
                      className={`p-2 rounded-lg font-semibold border transition-all text-center ${modalData.status === st
                        ? "bg-[#174D3C] text-white border-[#174D3C] shadow-xs"
                        : "bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      {st === "PRESENT"
                        ? "Present (P)"
                        : st === "HALF_DAY"
                          ? "Half Day (H)"
                          : st === "ABSENT"
                            ? "Absent (A)"
                            : "Leave (L)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Check In
                  </label>
                  <input
                    type="text"
                    value={modalData.checkInTime}
                    onChange={(e) =>
                      setModalData({ ...modalData, checkInTime: e.target.value })
                    }
                    placeholder="08:00"
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-[#174D3C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Check Out
                  </label>
                  <input
                    type="text"
                    value={modalData.checkOutTime}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        checkOutTime: e.target.value,
                      })
                    }
                    placeholder="17:00"
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-[#174D3C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalData(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
