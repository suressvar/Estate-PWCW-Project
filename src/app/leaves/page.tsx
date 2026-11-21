"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { EmployeeItem, LeaveRecord, LeaveStatus, LeaveType } from "@/lib/hr-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { StatCard } from "@/components/ui/stat-card";

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

  const fetchData = useCallback(async () => {
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
  }, [employeeId]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchData();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [fetchData]);

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
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
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
    <PageContainer>
      <PageHeader
        title="Leave Management & Authorizations"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Staff Roster", href: "/employees" },
          { label: "Leave Management" },
        ]}
        actions={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Apply / Record Leave
          </button>
        }
      />

      {msg && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-[#174D3C]" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Sanctioned Leave Days"
          value={`${totalLeaveDays} Days`}
          subtitle="Cumulative duration"
          icon={Calendar}
        />
        <StatCard
          title="Approved Requests"
          value={leaves.filter((l) => l.status === "APPROVED").length}
          subtitle="Sanctioned applications"
          isPositive={true}
        />
        <StatCard
          title="Registered Personnel"
          value={employees.length}
          subtitle="Total workforce strength"
        />
      </div>

      {/* Main Table Card */}
      <ContentCard
        title="Leave Records Register"
        badge={`${filtered.length} entries`}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              <option value="ALL">All Types</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Employee</th>
                <th className="py-2.5 px-4 font-medium">Type</th>
                <th className="py-2.5 px-4 font-medium">Date Range</th>
                <th className="py-2.5 px-4 font-medium text-center">Days</th>
                <th className="py-2.5 px-4 font-medium">Reason</th>
                <th className="py-2.5 px-4 font-medium">Sanctioned By</th>
                <th className="py-2.5 px-4 font-medium text-center">Status</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-[#64748B]">Loading leave records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-[#64748B]">No leave entries recorded.</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#111827] text-xs">{l.employeeName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          l.leaveType === "SICK"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : l.leaveType === "CASUAL"
                            ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {l.leaveType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#475569] text-xs">
                      {l.fromDate} → {l.toDate}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-[#111827] text-xs">{l.totalDays} d</td>
                    <td className="py-3 px-4 text-[#64748B] max-w-xs truncate text-xs">{l.reason || "—"}</td>
                    <td className="py-3 px-4 text-[#475569] text-xs">{l.approvedBy || "Admin"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8]">
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="p-1 text-[#94A3B8] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Delete Leave Record"
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
      </ContentCard>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-semibold text-[#111827] text-sm">Sanction Employee Leave</h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#111827] font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Employee *</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.roleName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Leave Classification *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as typeof leaveType)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick / Medical Leave (SL)</option>
                  <option value="EMERGENCY">Emergency Family Leave</option>
                  <option value="UNPAID">Loss of Pay / Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#111827] font-medium text-xs mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                  />
                </div>
                <div>
                  <label className="block text-[#111827] font-medium text-xs mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-[#EAF3EE] text-[#174D3C] rounded-lg font-medium flex items-center justify-between">
                <span>Calculated Duration:</span>
                <span className="font-bold font-mono">{calculateDays()} Days</span>
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Reason / Purpose</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for absence..."
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#111827] font-medium text-xs mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                  >
                    <option value="APPROVED">Approved (Syncs Grid)</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#111827] font-medium text-xs mb-1">Sanctioned By</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors"
                >
                  Confirm & Sync Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
