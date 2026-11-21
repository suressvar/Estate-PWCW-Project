"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Edit2,
  Eye,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { EmployeeItem, EmployeeRoleItem, EmployeeStatus, WageType } from "@/lib/hr-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { StatCard } from "@/components/ui/stat-card";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [roles, setRoles] = useState<EmployeeRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [roleId, setRoleId] = useState("");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [wageType, setWageType] = useState<WageType>("DAILY");
  const [wageRate, setWageRate] = useState<number | "">(500);
  const [status, setStatus] = useState<EmployeeStatus>("ACTIVE");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [empRes, roleRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/employee-roles"),
      ]);
      const empData = await empRes.json();
      const roleData = await roleRes.json();
      setEmployees(empData);
      setRoles(roleData);
      if (roleData.length > 0 && !roleId) {
        setRoleId(roleData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

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
    setEditingId(null);
    setName("");
    setPhone("");
    setAddress("");
    if (roles.length > 0) setRoleId(roles[0].id);
    setJoinDate(new Date().toISOString().split("T")[0]);
    setWageType("DAILY");
    setWageRate(500);
    setStatus("ACTIVE");
    setEmergencyContact("");
    setEmergencyPhone("");
    setAadhaarNo("");
    setBankAccountNo("");
    setBankName("State Bank of India");
    setIfscCode("");
    setNotes("");
    setShowModal(true);
  };

  const openEdit = (emp: EmployeeItem) => {
    setEditingId(emp.id);
    setName(emp.name);
    setPhone(emp.phone || "");
    setAddress(emp.address || "");
    setRoleId(emp.roleId || (roles[0]?.id || ""));
    setJoinDate(emp.joinDate || "");
    setWageType(emp.wageType);
    setWageRate(emp.wageRate);
    setStatus(emp.status);
    setEmergencyContact(emp.emergencyContact || "");
    setEmergencyPhone(emp.emergencyPhone || "");
    setAadhaarNo(emp.aadhaarNo || "");
    setBankAccountNo(emp.bankAccountNo || "");
    setBankName(emp.bankName || "");
    setIfscCode(emp.ifscCode || "");
    setNotes(emp.notes || "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        phone,
        address,
        roleId,
        joinDate,
        wageType,
        wageRate: Number(wageRate),
        status,
        emergencyContact,
        emergencyPhone,
        aadhaarNo,
        bankAccountNo,
        bankName,
        ifscCode,
        notes,
      };

      let res;
      if (editingId) {
        res = await fetch(`/api/employees/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setMsg({ type: "success", text: `Employee profile ${editingId ? "updated" : "created"} successfully!` });
        setShowModal(false);
        fetchData();
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save employee" });
      }
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    if (!confirm(`Are you sure you want to remove employee "${empName}"?`)) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Employee removed successfully" });
      fetchData();
      setTimeout(() => setMsg(null), 4000);
    } else {
      const err = await res.json();
      setMsg({ type: "error", text: err.error || "Cannot delete employee" });
    }
  };

  const filtered = employees.filter((emp) => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || (emp.phone || "").includes(search);
    const matchRole = roleFilter === "ALL" || emp.roleId === roleFilter;
    const matchStatus = statusFilter === "ALL" || emp.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const dailyCount = employees.filter((e) => e.wageType === "DAILY").length;
  const monthlyCount = employees.filter((e) => e.wageType === "MONTHLY").length;

  return (
    <PageContainer>
      <PageHeader
        title="Staff & Workforce Directory"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Staff Roster" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/employee-roles"
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg transition-colors shadow-2xs"
            >
              Manage Roles
            </Link>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Employee
            </button>
          </div>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff"
          value={employees.length}
          subtitle="Enrolled workforce"
          icon={Users}
        />
        <StatCard
          title="Active Personnel"
          value={activeCount}
          subtitle="Current active roster"
          isPositive={true}
        />
        <StatCard
          title="Daily Wage"
          value={dailyCount}
          subtitle="Daily rate compensation"
        />
        <StatCard
          title="Salaried Staff"
          value={monthlyCount}
          subtitle="Monthly payroll compensation"
        />
      </div>

      {/* Main Table Card */}
      <ContentCard
        title="Employee Roster"
        badge={`${filtered.length} persons`}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.roleName}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive</option>
              <option value="RESIGNED">Resigned</option>
            </select>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search employee name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white transition-all"
            />
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">Employee</th>
                  <th className="py-2.5 px-4 font-medium">Role</th>
                  <th className="py-2.5 px-4 font-medium">Phone</th>
                  <th className="py-2.5 px-4 font-medium">Join Date</th>
                  <th className="py-2.5 px-4 font-medium">Compensation</th>
                  <th className="py-2.5 px-4 font-medium text-center">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center text-[#64748B]">Loading staff roster...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center text-[#64748B]">No employees found.</td>
                  </tr>
                ) : (
                  filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8] flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#111827] text-xs">{emp.name}</div>
                            <div className="text-[10px] text-[#94A3B8] font-mono">ID: {emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                          {emp.roleName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#475569] text-xs">{emp.phone || "—"}</td>
                      <td className="py-3 px-4 text-[#475569] text-xs">{emp.joinDate || "—"}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#111827] font-mono text-xs">₹{emp.wageRate.toLocaleString()}</span>
                        <span className="text-[#64748B] text-[10px] ml-1">({emp.wageType === "DAILY" ? "/ Day" : emp.wageType === "MONTHLY" ? "/ Month" : "/ Hour"})</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            emp.status === "ACTIVE"
                              ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
                              : "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/employees/${emp.id}`}
                            className="p-1 text-[#174D3C] hover:bg-[#EAF3EE] rounded transition-colors"
                            title="View Profile & History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => openEdit(emp)}
                            className="p-1 text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] rounded transition-colors"
                            title="Edit Employee"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="p-1 text-[#94A3B8] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ContentCard>

      {/* Employee Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-3xl w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-semibold text-[#111827] text-sm">
                {editingId ? "Edit Employee Profile" : "Register New Employee"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#111827] text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">Personal & Contact Info</span>
                  <div>
                    <label className="block text-[#111827] font-medium text-xs mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Murugan K."
                      className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#111827] font-medium text-xs mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98421 XXXXX"
                      className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#111827] font-medium text-xs mb-1">Residential Address</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Quarters / Village location..."
                      className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">Emergency Name</label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Spouse / Parent"
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">Emergency Phone</label>
                      <input
                        type="text"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="+91 XXXXX"
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#111827] font-medium text-xs mb-1">Aadhaar Card / ID No</label>
                    <input
                      type="text"
                      value={aadhaarNo}
                      onChange={(e) => setAadhaarNo(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] font-mono"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">Employment & Payroll Structure</span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">Designated Role *</label>
                      <select
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                      >
                        <option value="">-- Select Role --</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.roleName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">Join Date</label>
                      <input
                        type="date"
                        value={joinDate}
                        onChange={(e) => setJoinDate(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">Wage Basis *</label>
                      <select
                        value={wageType}
                        onChange={(e) => setWageType(e.target.value as typeof wageType)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                      >
                        <option value="DAILY">Daily Wage</option>
                        <option value="MONTHLY">Monthly Salary</option>
                        <option value="HOURLY">Hourly Rate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">
                        Rate (₹ {wageType === "DAILY" ? "/ Day" : wageType === "MONTHLY" ? "/ Month" : "/ Hour"}) *
                      </label>
                      <input
                        type="number"
                        required
                        value={wageRate}
                        onChange={(e) => setWageRate(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#174D3C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="SBI, Canara, IOB"
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">Account No</label>
                      <input
                        type="text"
                        value={bankAccountNo}
                        onChange={(e) => setBankAccountNo(e.target.value)}
                        placeholder="Account number"
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="RESIGNED">Resigned</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#111827] font-medium text-xs mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="SBIN000XXXX"
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] font-mono"
                      />
                    </div>
                  </div>
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#174D3C] hover:bg-[#103C30] rounded-lg shadow-2xs transition-colors"
                >
                  Save Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
