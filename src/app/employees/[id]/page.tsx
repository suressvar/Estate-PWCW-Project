"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  UserCheck,
} from "lucide-react";
import type { AttendanceRecord, LeaveRecord, WageRecord } from "@/lib/db-storage";
import { EmployeeItem } from "@/lib/hr-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [wages, setWages] = useState<WageRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"attendance" | "wages" | "leaves">("attendance");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
        if (!empRes.ok) {
          setLoadError(empRes.status === 404 ? "Employee not found." : "Unable to load employee profile.");
          return;
        }
        const attData = await attRes.json();
        const wagesData = await wagesRes.json();
        const leavesData = await leavesRes.json();

        setEmployee(empData);
        if (attData.records) {
          setAttendance(attData.records.filter((r: AttendanceRecord) => r.employeeId === id));
        }
        setWages(wagesData.filter((w: WageRecord) => w.employeeId === id));
        setLeaves(leavesData.filter((l: LeaveRecord) => l.employeeId === id));
      } catch (e) {
        console.error(e);
        setLoadError("Unable to load employee profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loadError) return <div role="alert" className="p-12 text-center text-[#64748B] text-sm">{loadError}</div>;
  if (loading || !employee) {
    return <div className="p-12 text-center text-[#64748B] text-sm font-medium">Loading employee profile...</div>;
  }

  return (
    <PageContainer>
      <PageHeader
        title={employee.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Staff Roster", href: "/employees" },
          { label: employee.name },
        ]}
        actions={
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg hover:bg-[#F8FAFC] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" /> Back to Staff Roster
          </button>
        }
      />

      {/* Profile Overview Card */}
      <ContentCard>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8] flex items-center justify-center font-bold text-xl shadow-2xs">
              {employee.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#111827]">{employee.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                  {employee.roleName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    employee.status === "ACTIVE"
                      ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
                      : "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                  }`}
                >
                  {employee.status}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                {employee.wageType} wage (₹{employee.wageRate.toLocaleString()})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto text-xs">
            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">Phone Contact</span>
              <div className="font-mono font-medium text-[#111827] mt-0.5">{employee.phone || "No phone"}</div>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">Aadhaar Card</span>
              <div className="font-mono font-medium text-[#111827] mt-0.5">{employee.aadhaarNo || "Not provided"}</div>
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-[#174D3C]" /> Address & Location
          </div>
          <p className="text-[#475569]">{employee.address || "Quarters allocation not specified"}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
            <Phone className="w-3.5 h-3.5 text-[#174D3C]" /> Emergency Contact
          </div>
          <div className="text-[#111827] font-medium">{employee.emergencyContact || "None"}</div>
          <div className="text-[#64748B] font-mono">{employee.emergencyPhone || "—"}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
            <Building className="w-3.5 h-3.5 text-[#174D3C]" /> Bank & Settlement
          </div>
          <div className="text-[#111827] font-medium">{employee.bankName || "No Bank Listed"}</div>
          <div className="text-[#64748B] font-mono text-[11px]">
            A/c: {employee.bankAccountNo || "—"} | IFSC: {employee.ifscCode || "—"}
          </div>
        </div>
      </div>

      {/* History Tabs Card */}
      <ContentCard
        title="Employment Records & Logs"
        actions={
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "attendance" ? "bg-white text-[#111827] shadow-2xs font-semibold" : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Attendance ({attendance.length})
            </button>
            <button
              onClick={() => setActiveTab("wages")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "wages" ? "bg-white text-[#111827] shadow-2xs font-semibold" : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Wages ({wages.length})
            </button>
            <button
              onClick={() => setActiveTab("leaves")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "leaves" ? "bg-white text-[#111827] shadow-2xs font-semibold" : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Leaves ({leaves.length})
            </button>
          </div>
        }
      >
        <div>
          {activeTab === "attendance" && (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Date</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Check-in / Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 px-4 text-center text-[#64748B]">No attendance entries recorded for this employee.</td>
                    </tr>
                  ) : (
                    attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 font-medium text-[#111827]">{a.attendanceDate}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium text-[10px] border ${
                              a.status === "PRESENT"
                                ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
                                : a.status === "HALF_DAY"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-red-50 text-red-800 border-red-200"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#64748B] font-mono">{a.checkInTime || "—"} → {a.checkOutTime || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "wages" && (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Period</th>
                    <th className="py-2.5 px-4 font-medium">Present Days</th>
                    <th className="py-2.5 px-4 font-medium text-right">Gross Salary</th>
                    <th className="py-2.5 px-4 font-medium text-center">Bonus / Deduct</th>
                    <th className="py-2.5 px-4 font-medium text-right">Net Payable</th>
                    <th className="py-2.5 px-4 font-medium text-center">Status</th>
                    <th className="py-2.5 px-4 font-medium">Payment Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                  {wages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 px-4 text-center text-[#64748B]">No salary calculations recorded yet.</td>
                    </tr>
                  ) : (
                    wages.map((w) => (
                      <tr key={w.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 font-medium text-[#111827]">{w.month}/{w.year}</td>
                        <td className="py-2.5 px-4 text-[#475569]">{w.presentDays} days</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#111827]">₹{Number(w.grossSalary).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-center text-[#64748B]">+₹{w.bonus} / -₹{w.deductions}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#174D3C]">₹{Number(w.netSalary).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium text-[10px] border ${
                              w.status === "PAID"
                                ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#64748B] font-mono text-[11px]">{w.paymentReference || "Pending"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "leaves" && (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Leave Type</th>
                    <th className="py-2.5 px-4 font-medium">Date Range</th>
                    <th className="py-2.5 px-4 font-medium text-center">Days</th>
                    <th className="py-2.5 px-4 font-medium">Reason</th>
                    <th className="py-2.5 px-4 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 px-4 text-center text-[#64748B]">No leave applications logged.</td>
                    </tr>
                  ) : (
                    leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 font-medium text-[#111827]">{l.leaveType}</td>
                        <td className="py-2.5 px-4 text-[#475569]">{l.fromDate} → {l.toDate}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-medium">{l.totalDays} d</td>
                        <td className="py-2.5 px-4 text-[#64748B]">{l.reason}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8]">
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
      </ContentCard>
    </PageContainer>
  );
}
