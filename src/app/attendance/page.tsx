"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  ShieldAlert,
} from "lucide-react";
import { AttendanceStatus, EmployeeItem } from "@/lib/hr-data";

export default function AttendanceGridPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [records, setRecords] = useState<any[]>([]);
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

  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Days in month calculation
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const fetchGrid = async () => {
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
  };

  useEffect(() => {
    fetchGrid();
  }, [year, month]);

  const getRecordForCell = (empId: string, day: number) => {
    const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return records.find((r) => r.employeeId === empId && r.attendanceDate === dayStr);
  };

  const handleCellClick = (emp: EmployeeItem, day: number) => {
    const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const rec = getRecordForCell(emp.id, day);
    setModalData({
      employeeId: emp.id,
      employeeName: emp.name,
      dateStr: dayStr,
      status: rec?.status || "PRESENT",
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
            (r) => r.employeeId === saved.employeeId && r.attendanceDate === saved.attendanceDate
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
    } catch (err: any) {
      alert("Error marking attendance: " + err.message);
    }
  };

  const handleBulkMark = async () => {
    if (!confirm(`Mark ALL active farm employees as PRESENT for ${bulkDate}?`)) return;
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
        setMsg({ type: "success", text: `Marked all active employees as Present for ${bulkDate}` });
        fetchGrid();
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="max-w-[95rem] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <Calendar className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">HR: Monthly Attendance Matrix Grid</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Click any cell to log or adjust daily present, half-day, absent or leave status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month / Year picker */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs text-xs font-bold">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="p-1 bg-transparent text-slate-800 focus:outline-none"
            >
              {monthNames.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="p-1 bg-transparent text-slate-800 focus:outline-none"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs">
            <input
              type="date"
              value={bulkDate}
              onChange={(e) => setBulkDate(e.target.value)}
              className="p-1 text-xs border border-slate-200 rounded text-slate-800 font-medium"
            />
            <button
              onClick={handleBulkMark}
              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
            >
              Mark All Present
            </button>
          </div>

          <Link
            href="/attendance/summary"
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Summary View
          </Link>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-700">Status Badges:</span>
          <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">P</span> Present (1.0)</span>
          <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">H</span> Half Day (0.5)</span>
          <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-rose-600 text-white font-bold flex items-center justify-center text-[10px]">A</span> Absent (0.0)</span>
          <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-sky-600 text-white font-bold flex items-center justify-center text-[10px]">L</span> Leave</span>
          <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-slate-300 text-slate-600 font-bold flex items-center justify-center text-[10px]">-</span> Not Logged</span>
        </div>
        <span className="text-slate-500 text-[11px] italic">Showing {monthNames[month - 1]} {year}</span>
      </div>

      {/* Attendance Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 text-left sticky left-0 bg-slate-100 z-10 min-w-[200px] border-r border-slate-200 shadow-xs">
                  Staff Member & Role
                </th>
                {dayNumbers.map((d) => (
                  <th key={d} className="p-2 min-w-[32px] border-r border-slate-200/60 font-mono text-[11px]">
                    {d}
                  </th>
                ))}
                <th className="p-3 min-w-[90px] bg-slate-100 font-bold">Present</th>
                <th className="p-3 min-w-[80px] bg-slate-100 font-bold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={daysInMonth + 3} className="p-8 text-center text-slate-400 font-medium">
                    Loading attendance matrix...
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  let pCount = 0;
                  let hCount = 0;
                  let aCount = 0;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      {/* Sticky Employee Name */}
                      <td className="p-3 text-left sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-xs">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-500">{emp.roleName} • ₹{emp.wageRate}</div>
                      </td>

                      {/* Day Cells */}
                      {dayNumbers.map((d) => {
                        const rec = getRecordForCell(emp.id, d);
                        let badgeBg = "bg-slate-100 text-slate-400";
                        let letter = "-";

                        if (rec) {
                          if (rec.status === "PRESENT") {
                            badgeBg = "bg-emerald-600 text-white font-bold shadow-xs";
                            letter = "P";
                            pCount++;
                          } else if (rec.status === "HALF_DAY") {
                            badgeBg = "bg-amber-500 text-white font-bold shadow-xs";
                            letter = "H";
                            hCount++;
                          } else if (rec.status === "ABSENT") {
                            badgeBg = "bg-rose-600 text-white font-bold shadow-xs";
                            letter = "A";
                            aCount++;
                          } else if (rec.status === "LEAVE") {
                            badgeBg = "bg-sky-600 text-white font-bold shadow-xs";
                            letter = "L";
                          }
                        }

                        return (
                          <td
                            key={d}
                            onClick={() => handleCellClick(emp, d)}
                            className="p-1 border-r border-slate-100 cursor-pointer hover:bg-emerald-50 transition-colors"
                          >
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] mx-auto ${badgeBg}`}>
                              {letter}
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary calculations */}
                      <td className="p-2 font-bold text-slate-800 bg-slate-50/50 font-mono">
                        {(pCount + hCount * 0.5).toFixed(1)} d
                      </td>
                      <td className="p-2 font-bold bg-slate-50/50 font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${(pCount + hCount * 0.5) >= 20 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
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
      </div>

      {/* Cell Status Popover Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mark Attendance</span>
                <h3 className="font-bold text-slate-900 text-sm">{modalData.employeeName}</h3>
                <div className="text-xs text-slate-500 font-mono">{modalData.dateStr}</div>
              </div>
              <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Status *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["PRESENT", "HALF_DAY", "ABSENT", "LEAVE"] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalData({ ...modalData, status: st })}
                      className={`p-2 rounded-xl font-bold border transition-all text-center ${modalData.status === st ? "bg-emerald-900 text-white border-emerald-900 shadow-xs" : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"}`}
                    >
                      {st === "PRESENT" ? "Present (P)" : st === "HALF_DAY" ? "Half Day (H)" : st === "ABSENT" ? "Absent (A)" : "Leave (L)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Check In</label>
                  <input
                    type="text"
                    value={modalData.checkInTime}
                    onChange={(e) => setModalData({ ...modalData, checkInTime: e.target.value })}
                    placeholder="08:00"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Check Out</label>
                  <input
                    type="text"
                    value={modalData.checkOutTime}
                    onChange={(e) => setModalData({ ...modalData, checkOutTime: e.target.value })}
                    placeholder="17:00"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  value={modalData.notes}
                  onChange={(e) => setModalData({ ...modalData, notes: e.target.value })}
                  placeholder="Task, illness, reason..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalData(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
