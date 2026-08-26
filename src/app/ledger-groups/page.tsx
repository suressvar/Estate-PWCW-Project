"use client";

import React, { useState, useEffect } from "react";
import { LedgerGroupItem, GroupType, PnLSide } from "@/lib/accounting-data";
import { FolderTree, Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, Search, Filter } from "lucide-react";

export default function LedgerGroupsPage() {
  const [groups, setGroups] = useState<LedgerGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("EXPENSE");
  const [pnlSide, setPnlSide] = useState<PnLSide>("DEBIT");
  const [description, setDescription] = useState("");
  const [linkedCategory, setLinkedCategory] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/ledger-groups");
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setGroupName("");
    setGroupType("EXPENSE");
    setPnlSide("DEBIT");
    setDescription("");
    setLinkedCategory("Direct Expenses");
    setShowModal(true);
  };

  const openEdit = (g: LedgerGroupItem) => {
    setEditingId(g.id);
    setGroupName(g.groupName);
    setGroupType(g.groupType);
    setPnlSide(g.pnlSide);
    setDescription(g.description || "");
    setLinkedCategory(g.linkedCategory || "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { groupName, groupType, pnlSide, description, linkedCategory };
      let res;
      if (editingId) {
        res = await fetch(`/api/ledger-groups/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/ledger-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setMsg({ type: "success", text: `Ledger Group ${editingId ? "updated" : "created"} successfully!` });
        setShowModal(false);
        fetchGroups();
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save group" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const res = await fetch(`/api/ledger-groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Ledger group deleted successfully!" });
      fetchGroups();
      setTimeout(() => setMsg(null), 4000);
    } else {
      const err = await res.json();
      setMsg({ type: "error", text: err.error || "Could not delete group" });
    }
  };

  const getBadgeStyle = (type: GroupType) => {
    switch (type) {
      case "EXPENSE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "INCOME":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ASSET":
        return "bg-emerald-50/50 text-emerald-800 border-emerald-200/50";
      case "LIABILITY":
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const filtered = groups.filter((g) => {
    const matchSearch = g.groupName.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || g.groupType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <FolderTree className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Chart of Accounts: Ledger Groups</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Master P&L categories and account classifications for double-entry financial grouping.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Group
        </button>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search group name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Types ({groups.length})</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Group Name</th>
                <th className="p-3.5">Classification</th>
                <th className="p-3.5">P&L Side</th>
                <th className="p-3.5">Linked Reporting Category</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 font-medium">Loading ledger groups...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">No ledger groups found matching filter.</td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{g.groupName}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${getBadgeStyle(g.groupType)}`}>
                        {g.groupType}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      <span className={`font-mono px-2 py-0.5 rounded ${g.pnlSide === "DEBIT" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {g.pnlSide}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-600">{g.linkedCategory || "-"}</td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">{g.description || "-"}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(g)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Edit Group"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id, g.groupName)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Group"
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

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingId ? "Edit Ledger Group" : "Create New Ledger Group"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Direct Expenses, Selling Overheads"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Group Type *</label>
                  <select
                    value={groupType}
                    onChange={(e) => {
                      const val = e.target.value as GroupType;
                      setGroupType(val);
                      setPnlSide(val === "EXPENSE" || val === "ASSET" ? "DEBIT" : "CREDIT");
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">P&L Side *</label>
                  <select
                    value={pnlSide}
                    onChange={(e) => setPnlSide(e.target.value as PnLSide)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    <option value="DEBIT">Debit (DR)</option>
                    <option value="CREDIT">Credit (CR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Linked Category</label>
                <input
                  type="text"
                  value={linkedCategory}
                  onChange={(e) => setLinkedCategory(e.target.value)}
                  placeholder="e.g. Direct Expenses, Capital Account"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of ledger group intent..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                />
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
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
