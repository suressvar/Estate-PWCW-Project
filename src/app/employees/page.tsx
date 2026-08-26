"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { EmployeeItem, EmployeeRoleItem, WageType, EmployeeStatus } from "@/lib/hr-data";

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

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
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
  const inactiveCount = employees.filter((e) => e.status !== "ACTIVE").length;
  const dailyCount = employees.filter((e) => e.wageType === "DAILY").length;
  const monthlyCount = employees.filter((e) => e.wageType === "MONTHLY").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <Users className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">HR: Farm Staff & Employee Management</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Staff roster, compensation structures, emergency contacts, and banking details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/employee-roles"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            Manage Roles
          </Link>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Staff</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{employees.length} Persons</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Employees</span>
          <div className="text-lg font-bold text-emerald-800 mt-0.5">{activeCount} Active</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Daily Wage Workers</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{dailyCount} Workers</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Salaried Staff</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{monthlyCount} Monthly</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-600">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.roleName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive</option>
              <option value="RESIGNED">Resigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Join Date</th>
                <th className="p-3.5">Compensation Rate</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">Loading staff roster...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">No employees found.</td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-200 flex items-center justify-center font-bold text-xs shadow-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50/60 text-emerald-800 border border-emerald-200/50">
                        {emp.roleName}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700 font-mono">{emp.phone || "-"}</td>
                    <td className="p-3.5 text-slate-600">{emp.joinDate || "-"}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900">₹{emp.wageRate.toLocaleString()}</span>
                      <span className="text-slate-500 text-[11px] ml-1">({emp.wageType === "DAILY" ? "/ Day" : emp.wageType === "MONTHLY" ? "/ Month" : "/ Hour"})</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-300"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
                          title="View Profile & History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openEdit(emp)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
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

      {/* Employee Add/Edit 2-Column Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingId ? "Edit Employee Profile" : "Register New Farm Employee"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Personal & Contact Info</span>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Murugan K."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98421 XXXXX"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Residential Address</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Quarters / Village location..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Emergency Name</label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Spouse / Parent"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Emergency Phone</label>
                      <input
                        type="text"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="+91 XXXXX"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Aadhaar Card / ID No</label>
                    <input
                      type="text"
                      value={aadhaarNo}
                      onChange={(e) => setAadhaarNo(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employment & Payroll Structure</span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Designated Role *</label>
                      <select
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.roleName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Join Date</label>
                      <input
                        type="date"
                        value={joinDate}
                        onChange={(e) => setJoinDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Wage Basis *</label>
                      <select
                        value={wageType}
                        onChange={(e) => setWageType(e.target.value as any)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      >
                        <option value="DAILY">Daily Wage</option>
                        <option value="MONTHLY">Monthly Salary</option>
                        <option value="HOURLY">Hourly Rate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Rate (₹ {wageType === "DAILY" ? "per Day" : wageType === "MONTHLY" ? "per Month" : "per Hour"}) *
                      </label>
                      <input
                        type="number"
                        required
                        value={wageRate}
                        onChange={(e) => setWageRate(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="SBI, Canara, IOB"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Account No</label>
                      <input
                        type="text"
                        value={bankAccountNo}
                        onChange={(e) => setBankAccountNo(e.target.value)}
                        placeholder="Account number"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="RESIGNED">Resigned</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="SBIN000XXXX"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
