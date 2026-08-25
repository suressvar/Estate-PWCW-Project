"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle2, ShieldAlert, Layers } from "lucide-react";
import { ManualStockValuationItem } from "@/lib/inventory-data";

export default function StockValuationsPage() {
  const [valuations, setValuations] = useState<ManualStockValuationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [periodName, setPeriodName] = useState("FY 2026-27");
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [openingStock, setOpeningStock] = useState<number | "">(450000);
  const [closingStock, setClosingStock] = useState<number | "">(680000);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchValuations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stock-valuations");
      const data = await res.json();
      setValuations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuations();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setPeriodName(`FY ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setFromDate("2026-04-01");
    setToDate("2027-03-31");
    setOpeningStock(450000);
    setClosingStock(680000);
    setShowModal(true);
  };

  const openEdit = (v: ManualStockValuationItem) => {
    setEditingId(v.id);
    setPeriodName(v.periodName);
    setFromDate(v.fromDate);
    setToDate(v.toDate);
    setOpeningStock(v.openingStock);
    setClosingStock(v.closingStock);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        periodName,
        fromDate,
        toDate,
        openingStock: Number(openingStock),
        closingStock: Number(closingStock),
      };

      let res;
      if (editingId) {
        res = await fetch(`/api/stock-valuations/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/stock-valuations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setMsg({ type: "success", text: `Stock valuation ${editingId ? "updated" : "saved"} successfully!` });
        setShowModal(false);
        fetchValuations();
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save valuation" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this valuation record?")) return;
    const res = await fetch(`/api/stock-valuations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Valuation record deleted" });
      fetchValuations();
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/reports/pnl"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Periodic Stock Valuations</h1>
            <p className="text-xs text-slate-500 font-medium">
              Opening & closing livestock/produce valuations applied directly to Profit & Loss statements.
            </p>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Add Valuation Period
        </button>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Period Name</th>
              <th className="p-3.5">Date Range</th>
              <th className="p-3.5">Opening Stock (₹)</th>
              <th className="p-3.5">Closing Stock (₹)</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {valuations.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900">{v.periodName}</td>
                <td className="p-3.5 text-slate-600">{v.fromDate} → {v.toDate}</td>
                <td className="p-3.5 font-bold text-slate-800 font-mono">₹{Number(v.openingStock).toLocaleString()}</td>
                <td className="p-3.5 font-bold text-emerald-900 font-mono">₹{Number(v.closingStock).toLocaleString()}</td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEdit(v)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingId ? "Edit Valuation Period" : "Record Stock Valuation"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Period Name *</label>
                <input
                  type="text"
                  required
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="e.g. FY 2026-27 Q1"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Opening Stock (₹) *</label>
                  <input
                    type="number"
                    required
                    value={openingStock}
                    onChange={(e) => setOpeningStock(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Closing Stock (₹) *</label>
                  <input
                    type="number"
                    required
                    value={closingStock}
                    onChange={(e) => setClosingStock(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900"
                  />
                </div>
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
                  Save Valuation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
