"use client";
import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit2,
  Filter,
    Plus,
  Search,
  ShieldAlert,
  Tags,
  Trash2,
} from "lucide-react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { LedgerGroupItem, PnLSide } from "@/lib/accounting-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

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
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchGroupsAndTypes();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
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
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
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
    } catch {
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
        return "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]";
      case "ASSET":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "LIABILITY":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const filtered = groups.filter((g) => {
    const matchSearch =
      g.groupName.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || g.groupType.toUpperCase() === typeFilter.toUpperCase();
    return matchSearch && matchType;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Chart of Accounts: Ledger Groups"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Chart of Accounts" },
          { label: "Ledger Groups" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTypeManager(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#111827] text-xs font-medium rounded-lg border border-[#E2E8F0] shadow-2xs transition-colors"
              title="Manage Group Types"
            >
              <Tags className="w-3.5 h-3.5 text-[#174D3C]" /> Manage Types
            </button>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Group
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
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#174D3C]" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Table Card */}
      <ContentCard
        title="Ledger Groups Register"
        badge={`${filtered.length} groups`}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
            >
              <option value="ALL">All Types ({groups.length})</option>
              {groupTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search ledger group name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
            />
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">Group Name</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium">P&amp;L Treatment</th>
                  <th className="py-2.5 px-4 font-medium">Description</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-[#64748B]">Loading groups...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-[#64748B]">No ledger groups found.</td>
                  </tr>
                ) : (
                  filtered.map((g) => (
                    <tr key={g.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111827] text-xs">{g.groupName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getBadgeStyle(g.groupType)}`}>
                          {g.groupType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#475569] text-xs font-mono">{g.pnlSide}</span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] text-xs">{g.description || "—"}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(g)}
                            className="p-1 text-[#64748B] hover:text-[#111827] rounded transition-colors"
                            title="Edit Group"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(g.id, g.groupName)}
                            className="p-1 text-[#94A3B8] hover:text-red-700 rounded transition-colors"
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
      </ContentCard>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-semibold text-[#111827] text-sm">
                {editingId ? "Edit Ledger Group" : "Create New Ledger Group"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#111827] text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Direct Expenses, Selling Overheads"
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Account Classification *</label>
                {!isCreatingInlineType ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={groupType}
                      onChange={(e) => setGroupType(e.target.value)}
                      className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                    >
                      {groupTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineType(true)}
                      className="px-2.5 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111827] rounded-lg font-medium shrink-0"
                    >
                      + Custom
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="NEW TYPE"
                      value={inlineTypeName}
                      onChange={(e) => setInlineTypeName(e.target.value.toUpperCase())}
                      className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827]"
                    />
                    <button
                      type="button"
                      onClick={handleAddInlineType}
                      className="px-2.5 py-2 bg-[#174D3C] text-white rounded-lg font-medium shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineType(false)}
                      className="px-2 py-2 text-[#64748B] hover:text-[#111827]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">P&amp;L Accounting Treatment</label>
                <select
                  value={pnlSide}
                  onChange={(e) => setPnlSide(e.target.value as PnLSide)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                >
                  <option value="DEBIT">Debit (Expense / Asset Increase)</option>
                  <option value="CREDIT">Credit (Income / Liability Increase)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Classification details..."
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                />
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
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Type Manager Modal */}
      {showTypeManager && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-semibold text-[#111827] text-sm">Manage Group Classifications</h3>
              <button onClick={() => setShowTypeManager(false)} className="text-[#64748B] hover:text-[#111827] text-sm font-bold">✕</button>
            </div>

            {typeManagerMsg && (
              <div className={`p-2.5 rounded-lg border text-xs font-medium ${typeManagerMsg.type === "success" ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]" : "bg-red-50 text-red-800 border-red-200"}`}>
                {typeManagerMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateManagerType} className="flex gap-2">
              <input
                type="text"
                required
                value={newManagerType}
                onChange={(e) => setNewManagerType(e.target.value.toUpperCase())}
                placeholder="e.g. STATUTORY_RESERVES"
                className="flex-1 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-semibold shrink-0"
              >
                Add Type
              </button>
            </form>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {groupTypes.map((t) => (
                <div key={t} className="p-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#111827]">{t}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteManagerType(t)}
                    className="p-1 text-[#94A3B8] hover:text-red-700 rounded"
                    title="Delete Type"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setShowTypeManager(false)}
                className="px-3.5 py-1.5 text-xs font-medium bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111827] rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
