"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Filter,
  FileSpreadsheet,
  Receipt,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function SalesRegisterPage() {
  const params = useParams();
  const s_type = (params.s_type as string) || "other";

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSales = async () => {
    try {
      const res = await fetch(`/api/sales/${s_type}`);
      const data = await res.json();
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [s_type]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale record?")) return;
    const res = await fetch(`/api/sales/${s_type}/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Sale record deleted successfully" });
      fetchSales();
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ["SrNo", "Date", "ItemName", "Quantity", "Unit", "PricePerUnit", "TotalAmount", "BuyerName", "City", "Contact"];
    const rows = filtered.map((r) => [
      r.srNo || "",
      r.dateOfSale || "",
      r.itemName || "",
      String(r.quantity || ""),
      r.unit || "",
      String(r.pricePerUnit || ""),
      String(r.totalAmount || ""),
      r.buyerName || "",
      r.buyerCity || "",
      r.buyerContact || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `harvest_produce_sales_register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = records.filter((r) => {
    const d = r.dateOfSale || "";
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;

    const query = search.toLowerCase();
    const buyer = (r.buyerName || "").toLowerCase();
    const item = (r.itemName || "").toLowerCase();
    const sr = (r.srNo || "").toLowerCase();

    return buyer.includes(query) || item.includes(query) || sr.includes(query);
  });

  const totalRevenue = filtered.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0);
  const totalVolume = filtered.reduce((acc, r) => acc + Number(r.quantity || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sales-dashboard"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Harvest & Farm Produce Sales Register
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Verified crop sales vouchers, buyer mandates, and dispatches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Export CSV
          </button>
          <Link
            href="/sales"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> New Sales Voucher
          </Link>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Filtered Revenue</span>
          <div className="text-lg font-bold text-emerald-800 mt-0.5">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Volume / Units</span>
          <div className="text-lg font-bold text-slate-800 mt-0.5">
            {totalVolume.toLocaleString()} units
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Dispatches</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{filtered.length} Entries</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search buyer, crop or Sr #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            />
          </div>

          {(startDate || endDate || search) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearch("");
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Sr #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Item / Produce</th>
                <th className="p-3.5 text-center">Quantity & Unit</th>
                <th className="p-3.5">Unit Rate (₹)</th>
                <th className="p-3.5 font-bold">Total Amount (₹)</th>
                <th className="p-3.5">Buyer & Location</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">Loading sales records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">No sales entries found matching filter.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold font-mono text-slate-900">{r.srNo}</td>
                    <td className="p-3.5 text-slate-600 font-medium">{r.dateOfSale}</td>
                    <td className="p-3.5 font-bold text-slate-900">{r.itemName}</td>
                    <td className="p-3.5 text-center font-mono text-slate-700">{r.quantity} {r.unit}</td>
                    <td className="p-3.5 font-medium text-slate-700">₹{r.pricePerUnit}</td>
                    <td className="p-3.5 font-bold text-emerald-900">₹{Number(r.totalAmount).toLocaleString()}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{r.buyerName}</div>
                      {r.buyerCity && <div className="text-[10px] text-slate-400">{r.buyerCity} • {r.buyerContact}</div>}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/sales-invoice/${r.invoiceGroupId || r.id}`}
                          className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Print / View Sales Slip"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer Totals */}
            {filtered.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={5} className="p-3.5 uppercase tracking-wider text-right">
                    Total Filtered Revenue:
                  </td>
                  <td className="p-3.5 text-emerald-950 font-extrabold">
                    ₹{totalRevenue.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
