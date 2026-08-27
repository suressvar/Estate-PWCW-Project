"use client";

import React, { useState, useEffect } from "react";
import { LedgerGroupItem, GroupType, PnLSide } from "@/lib/accounting-data";
import { FolderTree, Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, Search, Filter, Tags, X, Tag } from "lucide-react";

export default function LedgerGroupsPage() {
  const [groups, setGroups] = useState<LedgerGroupItem[]>([]);
  const [groupTypes, setGroupTypes] = useState<string[]>(["EXPENSE", "INCOME", "ASSET", "LIABILITY"]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<string>("EXPENSE");
  const [pnlSide, setPnlSide] = useState<PnLSide>("DEBIT");
  const [description, setDescription] = useState("");
  const [isCreatingInlineType, setIsCreatingInlineType] = useState(false);
  const [inlineTypeName, setInlineTypeName] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manage Types Modal
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newManagerType, setNewManagerType] = useState("");
  const [typeManagerMsg, setTypeManagerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchGroupsAndTypes = async () => {
    try {
      const [groupsRes, typesRes] = await Promise.all([
        fetch("/api/ledger-groups"),
        fetch("/api/group-types"),
      ]);
      const [groupsData, typesData] = await Promise.all([
        groupsRes.json(),
        typesRes.json(),
      ]);
      setGroups(groupsData);
      if (Array.isArray(typesData) && typesData.length > 0) {
        setGroupTypes(typesData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupsAndTypes();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setGroupName("");
    setGroupType(groupTypes[0] || "EXPENSE");
    setPnlSide("DEBIT");
    setDescription("");
    setIsCreatingInlineType(false);
    setInlineTypeName("");
    setShowModal(true);
  };

  const openEdit = (g: LedgerGroupItem) => {
    setEditingId(g.id);
    setGroupName(g.groupName);
    setGroupType(g.groupType);
    setPnlSide(g.pnlSide);
    setDescription(g.description || "");
    setIsCreatingInlineType(false);
    setInlineTypeName("");
    setShowModal(true);
  };

  const handleAddInlineType = async () => {
    const trimmed = inlineTypeName.trim().toUpperCase();
    if (!trimmed) return;
    try {
      await fetch("/api/group-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupType: trimmed }),
      });
      if (!groupTypes.includes(trimmed)) {
        setGroupTypes((prev) => [...prev, trimmed]);
      }
      setGroupType(trimmed);
      setIsCreatingInlineType(false);
      setInlineTypeName("");
    } catch (err) {
      console.error("Failed to add group type", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizedType = (groupType || "EXPENSE").trim().toUpperCase();
      const payload = { groupName, groupType: normalizedType, pnlSide, description };
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
        fetchGroupsAndTypes();
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
      fetchGroupsAndTypes();
      setTimeout(() => setMsg(null), 4000);
    } else {
      const err = await res.json();
      setMsg({ type: "error", text: err.error || "Could not delete group" });
    }
  };

  // Group Type Manager Handlers
  const handleCreateManagerType = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newManagerType.trim().toUpperCase();
    if (!trimmed) return;
    if (groupTypes.includes(trimmed)) {
      setTypeManagerMsg({ type: "error", text: "This group type already exists." });
      return;
    }
    try {
      const res = await fetch("/api/group-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupType: trimmed }),
      });
      if (res.ok) {
        setGroupTypes((prev) => [...prev, trimmed]);
        setNewManagerType("");
        setTypeManagerMsg({ type: "success", text: `Group type "${trimmed}" created successfully!` });
        setTimeout(() => setTypeManagerMsg(null), 3000);
      }
    } catch (err) {
      setTypeManagerMsg({ type: "error", text: "Failed to create group type." });
    }
  };

  const handleDeleteManagerType = async (typeName: string) => {
    const isUsed = groups.some((g) => g.groupType.toUpperCase() === typeName.toUpperCase());
    if (isUsed) {
      alert(`Cannot delete "${typeName}" because active ledger groups are using this classification.`);
      return;
    }
    if (confirm(`Are you sure you want to remove the "${typeName}" group type?`)) {
      try {
        await fetch(`/api/group-types?type=${encodeURIComponent(typeName)}`, {
          method: "DELETE",
        });
        setGroupTypes((prev) => prev.filter((t) => t !== typeName));
        if (typeFilter === typeName) {
          setTypeFilter("ALL");
        }
      } catch (err) {
        console.error("Failed to delete group type:", err);
      }
    }
  };

  const getBadgeStyle = (type: string) => {
    const upper = (type || "").toUpperCase();
    switch (upper) {
      case "EXPENSE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "INCOME":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ASSET":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "LIABILITY":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const filtered = groups.filter((g) => {
    const matchSearch = g.groupName.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || g.groupType.toUpperCase() === typeFilter.toUpperCase();
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTypeManager(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-all"
            title="Manage Group Types"
          >
            <Tags className="w-4 h-4 text-emerald-700" /> Manage Types
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Group
          </button>
        </div>
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
            {groupTypes.map((t) => {
              const count = groups.filter((g) => g.groupType.toUpperCase() === t.toUpperCase()).length;
              return (
                <option key={t} value={t}>
                  {t} ({count})
                </option>
              );
            })}
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
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 font-medium">Loading ledger groups...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">No ledger groups found matching filter.</td>
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

      {/* Modal Dialog (Create / Edit Group) */}
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">Group Type *</label>
                  {!isCreatingInlineType && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineType(true)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      + New Type
                    </button>
                  )}
                </div>

                {isCreatingInlineType ? (
                  <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-900 block uppercase tracking-wider">
                      Create New Group Type
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={inlineTypeName}
                        onChange={(e) => setInlineTypeName(e.target.value)}
                        placeholder="e.g. DIRECT COST, CAPITAL, STATUTORY"
                        className="flex-1 p-1.5 bg-white border border-emerald-300 rounded-md text-xs text-slate-900 focus:outline-emerald-600 uppercase"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddInlineType();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddInlineType}
                        disabled={!inlineTypeName.trim()}
                        className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-semibold text-xs rounded-md transition-colors"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingInlineType(false);
                          setInlineTypeName("");
                        }}
                        className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        value={groupType}
                        onChange={(e) => {
                          if (e.target.value === "__NEW_CUSTOM__") {
                            setIsCreatingInlineType(true);
                          } else {
                            const val = e.target.value;
                            setGroupType(val);
                            setPnlSide(val === "EXPENSE" || val === "ASSET" ? "DEBIT" : "CREDIT");
                          }
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                      >
                        {groupTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                        <option value="__NEW_CUSTOM__" className="text-emerald-700 font-bold">
                          + Add New Type...
                        </option>
                      </select>
                    </div>

                    <div>
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
                )}
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

      {/* Group Type Manager Modal */}
      {showTypeManager && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Manage Group Types
                </h3>
              </div>
              <button
                onClick={() => setShowTypeManager(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {typeManagerMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  typeManagerMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {typeManagerMsg.text}
              </div>
            )}

            {/* Add Type Form */}
            <form onSubmit={handleCreateManagerType} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Add New Group Type
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newManagerType}
                  onChange={(e) => setNewManagerType(e.target.value)}
                  placeholder="e.g. DIRECT COST, CAPITAL, STATUTORY"
                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-emerald-600 uppercase"
                />
                <button
                  type="submit"
                  disabled={!newManagerType.trim()}
                  className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Type
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Registered Group Types ({groupTypes.length})
              </label>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {groupTypes.map((t) => {
                  const usageCount = groups.filter(
                    (g) => g.groupType.toUpperCase() === t.toUpperCase()
                  ).length;

                  return (
                    <div
                      key={t}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${getBadgeStyle(t)}`}>
                          {t}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({usageCount} {usageCount === 1 ? "group" : "groups"})
                        </span>
                      </div>

                      {usageCount === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteManagerType(t)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete unused group type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          In Use
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTypeManager(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
