"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  CheckCircle2,
  Calendar,
  Filter,
  FileSpreadsheet,
  Check,
  CreditCard,
  Building,
  ShieldAlert,
} from "lucide-react";
import { WageRecord } from "@/lib/hr-data";

export default function WagesRegisterPage() {
  const [wages, setWages] = useState<WageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedWage, setSelectedWage] = useState<WageRecord | null>(null);

  // Mark as paid form
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [paymentReference, setPaymentReference] = useState("IMPS-2026-");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchWages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wages");
      const data = await res.json();
      setWages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWages();
  }, []);

  const openPayModal = (w: WageRecord) => {
    setSelectedWage(w);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMode("Bank Transfer");
    setPaymentReference(`IMPS-${Date.now().toString().slice(-6)}`);
    setNotes(`Salary settlement for ${w.month}/${w.year}`);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWage) return;
    try {
      const res = await fetch(`/api/salary/pay/${selectedWage.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentDate,
          paymentMode,
          paymentReference,
          notes,
        }),
      });
      if (res.ok) {
        setMsg({ type: "success", text: `Payment of ₹${Number(selectedWage.netSalary).toLocaleString()} marked as Settled!` });
        setSelectedWage(null);
        fetchWages();
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const filtered = wages.filter((w) => statusFilter === "ALL" || w.status === statusFilter);

  const totalPaid = wages.filter((w) => w.status === "PAID").reduce((a, b) => a + Number(b.netSalary), 0);
  const totalPending = wages.filter((w) => w.status === "PENDING").reduce((a, b) => a + Number(b.netSalary), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <DollarSign className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">HR: Wages & Salary Payment Register</h1>
          </div>
        </div>

        <Link
          href="/salary/calculate"
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          Compute New Month
        </Link>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Disbursed (Paid)</span>
          <div className="text-lg font-bold text-emerald-800 mt-0.5">₹{totalPaid.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pending Payouts</span>
          <div className="text-lg font-bold text-amber-700 mt-0.5">₹{totalPending.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Records</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{wages.length} Calculations</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-700">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
          >
            <option value="ALL">All Records</option>
            <option value="PENDING">Pending Only</option>
            <option value="PAID">Paid Only</option>
          </select>
        </div>
      </div>

      {/* Wages Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Period</th>
                <th className="p-3.5">Employee Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Days Present</th>
                <th className="p-3.5">Net Salary (₹)</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Disbursement Ref</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">Loading wage history...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">No wage records found matching filter.</td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-800">{w.month}/{w.year}</td>
                    <td className="p-3.5 font-bold text-slate-900">{w.employeeName}</td>
                    <td className="p-3.5 text-slate-600">{w.roleName}</td>
                    <td className="p-3.5 font-mono text-slate-700">{w.presentDays} d</td>
                    <td className="p-3.5 font-extrabold text-emerald-900">₹{Number(w.netSalary).toLocaleString()}</td>
                    <td className="p-3.5 text-slate-700">{w.paymentMode || "-"}</td>
                    <td className="p-3.5 font-mono text-slate-500">{w.paymentReference || "-"}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${w.status === "PAID" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {w.status === "PENDING" ? (
                        <button
                          onClick={() => openPayModal(w)}
                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs shadow-xs transition-all"
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center justify-end gap-1 text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark As Paid Modal */}
      {selectedWage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Confirm Wage Disbursement</span>
                <h3 className="font-bold text-slate-900 text-sm">{selectedWage.employeeName}</h3>
                <div className="text-xs text-emerald-800 font-bold mt-0.5">
                  Amount: ₹{Number(selectedWage.netSalary).toLocaleString()}
                </div>
              </div>
              <button onClick={() => setSelectedWage(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Disbursement Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="UPI / QR">UPI / QR Code</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Transaction Ref / Cheque No</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UTR-9982182741"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>



              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedWage(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
