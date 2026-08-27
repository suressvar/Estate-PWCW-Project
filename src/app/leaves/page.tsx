"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  Clock,
  UserCheck,
} from "lucide-react";
import { LeaveRecord, LeaveType, LeaveStatus, EmployeeItem } from "@/lib/hr-data";

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("CASUAL");
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<LeaveStatus>("APPROVED");
  const [approvedBy, setApprovedBy] = useState("Estate Manager");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    try {
      const [leavesRes, empRes] = await Promise.all([
        fetch("/api/leaves"),
        fetch("/api/employees"),
      ]);
      const leavesData = await leavesRes.json();
      const empData = await empRes.json();
      setLeaves(leavesData);
      setEmployees(empData);
      if (empData.length > 0 && !employeeId) {
        setEmployeeId(empData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    if (employees.length > 0) setEmployeeId(employees[0].id);
    setLeaveType("CASUAL");
    setFromDate(new Date().toISOString().split("T")[0]);
    setToDate(new Date().toISOString().split("T")[0]);
    setReason("");
    setStatus("APPROVED");
    setApprovedBy("Estate Manager");
    setNotes("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          leaveType,
          fromDate,
          toDate,
          reason,
          status,
          approvedBy,
          notes,
        }),
      });

      if (res.ok) {
        setMsg({ type: "success", text: "Leave application recorded and synchronized to attendance!" });
        setShowModal(false);
        fetchData();
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to record leave" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave entry?")) return;
    const res = await fetch(`/api/leaves/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Leave record deleted successfully" });
      fetchData();
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const calculateDays = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return 1;
    const diff = Math.ceil(Math.abs(to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff || 1;
  };

  const filtered = leaves.filter((l) => {
    const matchType = typeFilter === "ALL" || l.leaveType === typeFilter;
    const matchStatus = statusFilter === "ALL" || l.status === statusFilter;
    return matchType && matchStatus;
  });

  const totalLeaveDays = filtered.reduce((acc, l) => acc + Number(l.totalDays || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <Calendar className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">HR: Leave Management & Authorizations</h1>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Apply / Record Leave
        </button>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Leave Days</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{totalLeaveDays} Days Sanctioned</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Approved Requests</span>
          <div className="text-lg font-bold text-emerald-800 mt-0.5">
            {leaves.filter((l) => l.status === "APPROVED").length} Approved
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Staff Registered</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{employees.length} Personnel</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Leave Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="ALL">All Types</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Leave Type</th>
                <th className="p-3.5">Date Range</th>
                <th className="p-3.5 text-center">Days</th>
                <th className="p-3.5">Reason & Purpose</th>
                <th className="p-3.5">Sanctioned By</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">Loading leave records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">No leave entries recorded.</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{l.employeeName}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${l.leaveType === "SICK" ? "bg-red-50 text-red-800 border-red-200" : l.leaveType === "CASUAL" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                        {l.leaveType}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">
                      {l.fromDate} → {l.toDate}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900 font-mono">{l.totalDays} d</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">{l.reason || "-"}</td>
                    <td className="p-3.5 text-slate-600 font-medium">{l.approvedBy || "Admin"}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Sanction & Record Employee Leave</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Employee *</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.roleName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Leave Classification *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick / Medical Leave (SL)</option>
                  <option value="EMERGENCY">Emergency Family Leave</option>
                  <option value="UNPAID">Loss of Pay / Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-semibold flex items-center justify-between">
                <span>Calculated Duration:</span>
                <span className="font-bold font-mono">{calculateDays()} Days</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Reason / Purpose</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for absence..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="APPROVED">Approved (Syncs Grid)</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Sanctioned By</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm & Sync Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
