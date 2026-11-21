"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit2,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { ExpenseLedgerItem, LedgerGroupItem } from "@/lib/accounting-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

export default function ExpenseLedgersPage() {
  const [ledgers, setLedgers] = useState<ExpenseLedgerItem[]>([]);
  const [groups, setGroups] = useState<LedgerGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [ledgerName, setLedgerName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [ledgersRes, groupsRes] = await Promise.all([
        fetch("/api/expense-ledgers"),
        fetch("/api/ledger-groups"),
      ]);
      const ledgersData = await ledgersRes.json();
      const groupsData = await groupsRes.json();

      setLedgers(ledgersData);
      setGroups(groupsData);
      if (groupsData.length > 0 && !groupId) {
        setGroupId(groupsData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

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
    setLedgerName("");
    if (groups.length > 0) setGroupId(groups[0].id);
    setDescription("");
    setShowModal(true);
  };

  const openEdit = (l: ExpenseLedgerItem) => {
    setEditingId(l.id);
    setLedgerName(l.ledgerName);
    setGroupId(l.groupId);
    setDescription(l.description || "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ledgerName, groupId, description };
      let res;
      if (editingId) {
        res = await fetch(`/api/expense-ledgers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/expense-ledgers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setMsg({ type: "success", text: `Ledger Account ${editingId ? "updated" : "created"} successfully!` });
        setShowModal(false);
        fetchData();
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save ledger" });
      }
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ledger account "${name}"?`)) return;
    const res = await fetch(`/api/expense-ledgers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Ledger account deleted successfully!" });
      fetchData();
      setTimeout(() => setMsg(null), 4000);
    } else {
      const err = await res.json();
      setMsg({ type: "error", text: err.error || "Could not delete ledger account" });
    }
  };

  const filtered = ledgers.filter((l) => {
    const matchSearch =
      l.ledgerName.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === "ALL" || l.groupId === groupFilter;
    return matchSearch && matchGroup;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Chart of Accounts: Ledgers & Particulars"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Chart of Accounts" },
          { label: "Ledger Accounts" },
        ]}
        actions={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Account
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
        title="Ledger Accounts"
        badge={`${filtered.length} accounts`}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
            >
              <option value="ALL">All Groups ({ledgers.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.groupName}
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
              placeholder="Search ledger account name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
            />
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">Ledger Name</th>
                  <th className="py-2.5 px-4 font-medium">Parent Ledger Group</th>
                  <th className="py-2.5 px-4 font-medium">Account Type</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-[#64748B]">Loading ledger accounts...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-[#64748B]">No ledger accounts found.</td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#111827] text-xs">{l.ledgerName}</td>
                      <td className="py-3 px-4 font-medium text-[#174D3C] text-xs">{l.groupName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                          {l.groupType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(l)}
                            className="p-1 text-[#64748B] hover:text-[#111827] rounded transition-colors"
                            title="Edit Account"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(l.id, l.ledgerName)}
                            className="p-1 text-[#94A3B8] hover:text-red-700 rounded transition-colors"
                            title="Delete Account"
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
                {editingId ? "Edit Ledger Account" : "Create New Ledger Account"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#111827] text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Ledger Name *</label>
                <input
                  type="text"
                  required
                  value={ledgerName}
                  onChange={(e) => setLedgerName(e.target.value)}
                  placeholder="e.g. Feed Expenses, Harvest Sales, EB Power"
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Parent Group *</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName} ({g.groupType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes or accounting references..."
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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
