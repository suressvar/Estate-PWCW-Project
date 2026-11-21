"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { csvDocument, csvDataUri } from "@/lib/csv";
import type { SaleRow } from "@/types/api";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { StatCard } from "@/components/ui/stat-card";

export default function SalesRegisterPage() {
  const params = useParams();
  const s_type = (params.s_type as string) || "other";

  const [records, setRecords] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch(`/api/sales/${s_type}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [s_type]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchSales();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [fetchSales, s_type]);

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
      r.quantity ?? "",
      r.unit || "",
      r.pricePerUnit ?? "",
      r.totalAmount ?? "",
      r.buyerName || "",
      r.buyerCity || "",
      r.buyerContact || "",
    ]);

    const encodedUri = csvDataUri(csvDocument(headers, rows));
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
    <PageContainer>
      <PageHeader
        title="Harvest & Produce Sales Register"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Sales Register", href: "/sales-register" },
          { label: s_type.toUpperCase() },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#64748B]" /> Export CSV
            </button>
            <Link
              href="/sales"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Sales Voucher
            </Link>
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
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-[#174D3C]" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Filtered Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          subtitle="Realized income"
          icon={DollarSign}
        />
        <StatCard
          title="Total Volume"
          value={`${totalVolume.toLocaleString()} units`}
          subtitle="Cumulative quantity dispatched"
        />
        <StatCard
          title="Dispatches Logged"
          value={`${filtered.length} Entries`}
          subtitle="Total transactions"
          icon={Layers}
        />
      </div>

      {/* Main Table Card */}
      <ContentCard
        title="Sales Invoices"
        badge={`${filtered.length} records`}
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-[#64748B]">
              <Calendar className="w-3.5 h-3.5" />
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
              />
            </div>
            <div className="flex items-center gap-1 text-[#64748B]">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
              />
            </div>
            {(startDate || endDate || search) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSearch("");
                }}
                className="text-xs text-[#64748B] hover:text-[#111827] underline"
              >
                Reset
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search buyer, crop or Sr #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
            />
          </div>

          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">Sr #</th>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Produce Item</th>
                  <th className="py-2.5 px-4 font-medium text-right">Quantity</th>
                  <th className="py-2.5 px-4 font-medium text-right">Price / Unit</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total Amount</th>
                  <th className="py-2.5 px-4 font-medium">Buyer</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 px-4 text-center text-[#64748B]">Loading sales...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 px-4 text-center text-[#64748B]">No sales records found.</td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-xs">{r.srNo || "—"}</td>
                      <td className="py-3 px-4 text-[#475569]">{r.dateOfSale}</td>
                      <td className="py-3 px-4 font-semibold text-[#111827] text-xs">{r.itemName}</td>
                      <td className="py-3 px-4 text-right font-mono">{r.quantity} {r.unit}</td>
                      <td className="py-3 px-4 text-right font-mono">₹{Number(r.pricePerUnit).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#174D3C] text-xs">
                        ₹{Number(r.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-[#475569]">
                        <div>{r.buyerName || "Walk-in"}</div>
                        {r.buyerCity && <span className="text-[10px] text-[#94A3B8]">{r.buyerCity}</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1 text-[#94A3B8] hover:text-red-700 rounded transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ContentCard>
    </PageContainer>
  );
}
