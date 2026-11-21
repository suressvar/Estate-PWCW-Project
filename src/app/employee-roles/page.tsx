"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { EmployeeRoleItem } from "@/lib/hr-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

export default function EmployeeRolesPage() {
  const [roles, setRoles] = useState<EmployeeRoleItem[]>([]);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [, setLoading] = useState(true);
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
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchRoles();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
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
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
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
    <PageContainer>
      <PageHeader
        title="Employee Roles & Designations"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Staff Roster", href: "/employees" },
          { label: "Roles & Designations" },
        ]}
        actions={
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Back to Staff Roster</span>
          </Link>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inline Add Form */}
        <div className="md:col-span-1">
          <ContentCard title="Add Designation" badge="New Role">
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Milking Operator, Watchman"
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities overview..."
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Role
              </button>
            </form>
          </ContentCard>
        </div>

        {/* Roles List */}
        <div className="md:col-span-2">
          <ContentCard title="Configured Roles" badge={`${roles.length} designations`}>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Designation Title</th>
                    <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                  {roles.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111827] text-xs">{r.roleName}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(r.id, r.roleName)}
                          className="p-1 text-[#94A3B8] hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete Designation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageContainer>
  );
}
