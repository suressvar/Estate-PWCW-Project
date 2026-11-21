"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Edit2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { ManualStockValuationItem } from "@/lib/inventory-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

export default function StockValuationsPage() {
  const [valuations, setValuations] = useState<ManualStockValuationItem[]>([]);
  const [, setLoading] = useState(true);
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
      setValuations(Array.isArray(data) ? data : []);
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
        fetchValuations();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
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
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
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
    <PageContainer>
      <PageHeader
        title="Periodic Stock Valuations"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Financial Reports", href: "/reports/pnl" },
          { label: "Stock Valuations" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/reports/pnl"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Back to P&amp;L Report</span>
            </Link>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Valuation Period
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
      <ContentCard title="Valuation Periods" badge={`${valuations.length} periods`}>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Period Name</th>
                <th className="py-2.5 px-4 font-medium">Date Range</th>
                <th className="py-2.5 px-4 font-medium text-right">Opening Stock (₹)</th>
                <th className="py-2.5 px-4 font-medium text-right">Closing Stock (₹)</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
              {valuations.map((v) => (
                <tr key={v.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#111827] text-xs">{v.periodName}</td>
                  <td className="py-3 px-4 text-[#475569] text-xs font-mono">
                    {v.fromDate} → {v.toDate}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#111827] font-mono text-xs">
                    ₹{Number(v.openingStock).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#174D3C] font-mono text-xs">
                    ₹{Number(v.closingStock).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(v)}
                        className="p-1 text-[#64748B] hover:text-[#111827] rounded transition-colors"
                        title="Edit Valuation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1 text-[#94A3B8] hover:text-red-700 rounded transition-colors"
                        title="Delete Valuation"
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
      </ContentCard>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-semibold text-[#111827] text-sm">
                {editingId ? "Edit Valuation Period" : "Record Stock Valuation"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#111827] text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#111827] font-medium text-xs mb-1">Period Name *</label>
                <input
                  type="text"
                  required
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="e.g. FY 2026-27 Q1"
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#111827] font-medium text-xs mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                  />
                </div>
                <div>
                  <label className="block text-[#111827] font-medium text-xs mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#111827] font-medium text-xs mb-1">Opening Stock (₹) *</label>
                  <input
                    type="number"
                    required
                    value={openingStock}
                    onChange={(e) => setOpeningStock(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827]"
                  />
                </div>
                <div>
                  <label className="block text-[#111827] font-medium text-xs mb-1">Closing Stock (₹) *</label>
                  <input
                    type="number"
                    required
                    value={closingStock}
                    onChange={(e) => setClosingStock(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#174D3C]"
                  />
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
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
