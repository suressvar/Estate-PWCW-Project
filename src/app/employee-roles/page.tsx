"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Plus, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { EmployeeRoleItem } from "@/lib/hr-data";

export default function EmployeeRolesPage() {
  const [roles, setRoles] = useState<EmployeeRoleItem[]>([]);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/employee-roles");
      const data = await res.json();
      setRoles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return;
    try {
      const res = await fetch("/api/employee-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleName, description }),
      });
      if (res.ok) {
        setMsg({ type: "success", text: "New employee role created successfully!" });
        setRoleName("");
        setDescription("");
        fetchRoles();
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to create role" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete role "${name}"?`)) return;
    const res = await fetch(`/api/employee-roles?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Role deleted successfully" });
      fetchRoles();
      setTimeout(() => setMsg(null), 4000);
    } else {
      const err = await res.json();
      setMsg({ type: "error", text: err.error || "Cannot delete role assigned to active staff" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/employees"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Employee Roles & Designations</h1>
            <p className="text-xs text-slate-500 font-medium">Standardized operational job titles for estate personnel.</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Inline Add Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Designation</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Milking Operator, Watchman"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-emerald-600"
            />
          </div>
          <div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role description & duties..."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Save Role
            </button>
          </div>
        </form>
      </div>

      {/* Roles List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Role Designation</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900">{r.roleName}</td>
                <td className="p-3.5 text-slate-600">{r.description || "-"}</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleDelete(r.id, r.roleName)}
                    className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
