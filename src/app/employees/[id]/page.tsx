"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Phone,
  MapPin,
  Building,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { EmployeeItem } from "@/lib/hr-data";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [wages, setWages] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"attendance" | "wages" | "leaves">("attendance");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [empRes, attRes, wagesRes, leavesRes] = await Promise.all([
          fetch(`/api/employees/${id}`),
          fetch(`/api/attendance/grid`),
          fetch(`/api/wages`),
          fetch(`/api/leaves`),
        ]);

        const empData = await empRes.json();
        const attData = await attRes.json();
        const wagesData = await wagesRes.json();
        const leavesData = await leavesRes.json();

        setEmployee(empData);
        if (attData.records) {
          setAttendance(attData.records.filter((r: any) => r.employeeId === id));
        }
        setWages(wagesData.filter((w: any) => w.employeeId === id));
        setLeaves(leavesData.filter((l: any) => l.employeeId === id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading || !employee) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading employee profile...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-2xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Staff Roster
        </button>

        <div className="text-xs text-slate-500 font-medium">
          Employee ID: <span className="font-mono font-bold text-slate-800">{employee.id}</span>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-900 text-emerald-200 flex items-center justify-center font-bold text-2xl shadow-sm">
            {employee.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50/60 text-emerald-800 border border-emerald-200/50">
                {employee.roleName}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${employee.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-300"}`}>
                {employee.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Joined {employee.joinDate || "N/A"} • {employee.wageType} wage (₹{employee.wageRate.toLocaleString()})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full md:w-auto text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Contact</span>
            <div className="font-mono font-semibold text-slate-800 mt-0.5">{employee.phone || "No phone"}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Aadhaar Card</span>
            <div className="font-mono font-semibold text-slate-800 mt-0.5">{employee.aadhaarNo || "Not provided"}</div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Address & Location
          </div>
          <p className="text-slate-600">{employee.address || "Quarters allocation not specified"}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
            <Phone className="w-3.5 h-3.5 text-emerald-700" /> Emergency Contact
          </div>
          <div className="text-slate-900 font-semibold">{employee.emergencyContact || "None"}</div>
          <div className="text-slate-500 font-mono">{employee.emergencyPhone || "-"}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
            <Building className="w-3.5 h-3.5 text-emerald-700" /> Bank & Settlement
          </div>
          <div className="text-slate-900 font-semibold">{employee.bankName || "No Bank Listed"}</div>
          <div className="text-slate-500 font-mono text-[11px]">
            A/c: {employee.bankAccountNo || "-"} | IFSC: {employee.ifscCode || "-"}
          </div>
        </div>
      </div>

      {/* Activity History Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "attendance" ? "border-emerald-800 text-emerald-900 bg-white rounded-t-lg" : "border-transparent text-slate-600 hover:text-slate-900"}`}
          >
            <UserCheck className="w-4 h-4" /> Attendance Records ({attendance.length})
          </button>
          <button
            onClick={() => setActiveTab("wages")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "wages" ? "border-emerald-800 text-emerald-900 bg-white rounded-t-lg" : "border-transparent text-slate-600 hover:text-slate-900"}`}
          >
            <DollarSign className="w-4 h-4" /> Wage Settlements ({wages.length})
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "leaves" ? "border-emerald-800 text-emerald-900 bg-white rounded-t-lg" : "border-transparent text-slate-600 hover:text-slate-900"}`}
          >
            <Calendar className="w-4 h-4" /> Leave Logs ({leaves.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4">
          {activeTab === "attendance" && (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Check-in / Out</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">No attendance entries recorded for this employee.</td>
                    </tr>
                  ) : (
                    attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{a.attendanceDate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${a.status === "PRESENT" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : a.status === "HALF_DAY" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">{a.checkInTime || "-"} → {a.checkOutTime || "-"}</td>
                        <td className="p-3 text-slate-500">{a.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "wages" && (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Period</th>
                    <th className="p-3">Present Days</th>
                    <th className="p-3">Gross Salary</th>
                    <th className="p-3">Bonus / Deduct</th>
                    <th className="p-3">Net Payable</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payment Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">No salary calculations recorded yet.</td>
                    </tr>
                  ) : (
                    wages.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{w.month}/{w.year}</td>
                        <td className="p-3 font-semibold text-slate-700">{w.presentDays} days</td>
                        <td className="p-3 text-slate-800 font-semibold">₹{Number(w.grossSalary).toLocaleString()}</td>
                        <td className="p-3 text-slate-600">+₹{w.bonus} / -₹{w.deductions}</td>
                        <td className="p-3 font-bold text-emerald-900">₹{Number(w.netSalary).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${w.status === "PAID" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{w.paymentReference || "Pending"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "leaves" && (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Total Days</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">No leave requests recorded for this employee.</td>
                    </tr>
                  ) : (
                    leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{l.leaveType}</td>
                        <td className="p-3 text-slate-700">{l.fromDate} → {l.toDate}</td>
                        <td className="p-3 font-semibold text-emerald-800">{l.totalDays} days</td>
                        <td className="p-3 text-slate-500">{l.reason || "-"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
