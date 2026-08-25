"use client";

import React, { useState, useEffect } from "react";
import { ExpenseLedgerItem, LedgerGroupItem } from "@/lib/accounting-data";
import { BookOpen, Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, Search, Filter } from "lucide-react";

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

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
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
    const matchSearch = l.ledgerName.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === "ALL" || l.groupId === groupFilter;
    return matchSearch && matchGroup;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Chart of Accounts: Particulars & Ledgers</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Accounts used in all Purchase Vouchers and Sales transactions with automated group links.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Account
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
            placeholder="Search ledger account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Filter Group:</span>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Groups ({ledgers.length})</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.groupName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Ledger Name</th>
                <th className="p-3.5">Parent Ledger Group</th>
                <th className="p-3.5">Account Type</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">Loading ledger accounts...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">No ledger accounts found.</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{l.ledgerName}</td>
                    <td className="p-3.5 font-semibold text-emerald-800">{l.groupName}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {l.groupType}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">{l.description || "-"}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(l)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id, l.ledgerName)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
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

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingId ? "Edit Ledger Account" : "Create New Ledger Account"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Ledger Name *</label>
                <input
                  type="text"
                  required
                  value={ledgerName}
                  onChange={(e) => setLedgerName(e.target.value)}
                  placeholder="e.g. Feed Expenses, Harvest Sales, EB Power"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Parent Ledger Group *</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.groupName} ({g.groupType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Account purpose or notes..."
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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
