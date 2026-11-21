"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  LayoutGrid,
  List,
  Maximize2,
  Plus,
  Printer,
  Receipt,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { csvDocument, csvDataUri } from "@/lib/csv";
import type { SaleRow } from "@/types/api";
import { StatCard } from "@/components/ui/stat-card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { VoucherSlipData, VoucherSlipModal } from "@/components/voucher-slip-modal";

export default function MainSalesRegisterPage() {
  const [records, setRecords] = useState<SaleRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "grouped" | "table">("cards");
  const [activeModalVoucher, setActiveModalVoucher] = useState<VoucherSlipData | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Category Management Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const fetchSalesAndCats = async () => {
    try {
      setLoading(true);
      const [salesRes, catsRes] = await Promise.all([
        fetch("/api/sales/other"),
        fetch("/api/sales-categories"),
      ]);
      const salesData = await salesRes.json();
      const catsData = await catsRes.json().catch(() => ({ categories: [] }));

      setRecords(Array.isArray(salesData) ? salesData : []);
      setCategories(Array.isArray(catsData.categories) ? catsData.categories : []);
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
        fetchSalesAndCats();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setSavingCat(true);
      const res = await fetch("/api/sales-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCatName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        setNewCatName("");
        setMsg({ type: "success", text: `Category "${newCatName.trim()}" created successfully!` });
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (!confirm(`Are you sure you want to delete category "${cat}"?`)) return;
    try {
      const res = await fetch(`/api/sales-categories?category=${encodeURIComponent(cat)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        if (selectedCategory === cat) setSelectedCategory("ALL");
        setMsg({ type: "success", text: `Category "${cat}" removed.` });
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale record?")) return;
    const res = await fetch(`/api/sales/other?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Sale record deleted successfully" });
      fetchSalesAndCats();
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to remove ALL sales entries? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/sales/other", { method: "DELETE" });
      if (res.ok) {
        setMsg({ type: "success", text: "All sales entries have been removed." });
        fetchSalesAndCats();
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = [
      "SrNo",
      "Date",
      "Category",
      "ItemName",
      "Quantity",
      "Unit",
      "PricePerUnit",
      "TotalAmount",
      "BuyerName",
      "City",
      "Contact",
    ];
    const rows = filtered.map((r) => [
      r.srNo || "",
      r.dateOfSale || "",
      r.category || "General Estate Sales",
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
    link.setAttribute("download", `ranga_estate_sales_register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openSalesVoucher = (r: SaleRow) => {
    const slipData: VoucherSlipData = {
      voucherType: "SALES",
      voucherNo: r.srNo || `SAL-VCH-${String(r.id).slice(-6).toUpperCase()}`,
      date: r.dateOfSale || new Date().toISOString().split("T")[0],
      title: "Official Produce Sales Voucher",
      category: r.category || "Produce Sales",
      partyName: r.buyerName || "Walk-in Retail Buyer",
      partyContact: r.buyerContact || undefined,
      partyAddress: r.buyerCity || undefined,
      plotName: r.plotName || "Ranga Estate Harvest Fields",
      cropActivityName: r.itemName || "Crop Harvest Sale",
      items: [
        {
          id: r.id,
          description: `${r.itemName} (${r.particularName || r.category || "Estate Harvest"})`,
          quantity: Number(r.quantity) || 1,
          unit: r.unit || "kg",
          rate: Number(r.pricePerUnit) || Number(r.totalAmount) || 0,
          amount: Number(r.totalAmount) || 0,
        },
      ],
      subtotal: Number(r.totalAmount) || 0,
      totalAmount: Number(r.totalAmount) || 0,
      paymentMode: r.paymentMode || "Cash",
      paymentStatus: "PAID",
      referenceNo: r.invoiceGroupId || r.id,
      loggedBy: "Sales Accounts Division",
      notes: `Official sale of ${r.itemName} recorded in estate registry. ${r.notes || ""}`,
    };
    setActiveModalVoucher(slipData);
  };

  // Filter records by date, search, and category tab
  const filtered = (() => {
    return records.filter((r) => {
      const d = r.dateOfSale || "";
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;

      const recordCat = r.category || "General Estate Sales";
      if (selectedCategory !== "ALL" && recordCat !== selectedCategory) {
        return false;
      }

      const query = search.toLowerCase();
      const buyer = (r.buyerName || "").toLowerCase();
      const item = (r.itemName || "").toLowerCase();
      const sr = (r.srNo || "").toLowerCase();
      const city = (r.buyerCity || "").toLowerCase();
      const cat = recordCat.toLowerCase();

      return (
        buyer.includes(query) ||
        item.includes(query) ||
        sr.includes(query) ||
        city.includes(query) ||
        cat.includes(query)
      );
    });
  })();

  const totalRevenue = filtered.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0);
  const totalTransactions = filtered.length;

  // Category wise breakdown
  const categoryGroups = (() => {
    const map = new Map<string, SaleRow[]>();
    categories.forEach((cat) => map.set(cat, []));

    filtered.forEach((r) => {
      const cat = r.category || "General Estate Sales";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    });

    const groups: { name: string; records: SaleRow[]; totalAmount: number }[] = [];
    map.forEach((items, name) => {
      if (selectedCategory === "ALL" || selectedCategory === name) {
        if (items.length > 0 || selectedCategory === name) {
          groups.push({
            name,
            records: items,
            totalAmount: items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
          });
        }
      }
    });

    return groups.sort((a, b) => b.totalAmount - a.totalAmount);
  })();

  return (
    <PageContainer>
      <PageHeader
        title="Produce Sales Register"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Sales Register" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCatModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg transition-colors shadow-2xs"
            >
              <Tag className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Categories</span>
            </button>

            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/sales"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sales Entry</span>
            </Link>
          </div>
        }
      />

      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8]"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#174D3C]" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Sales Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtitle="Realized harvest income"
          icon={DollarSign}
        />
        <StatCard
          title="Recorded Transactions"
          value={totalTransactions}
          subtitle="Sales dispatches logged"
          icon={Layers}
        />
        <StatCard
          title="Produce Categories"
          value={categories.length}
          subtitle="Configured sales lines"
          icon={Tag}
        />
      </div>

      {/* Main Filter & View ContentCard */}
      <ContentCard
        title="Sales Vouchers"
        badge={`${filtered.length} entries`}
        actions={
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "cards" ? "bg-white text-[#111827] shadow-2xs font-semibold" : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("grouped")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "grouped" ? "bg-white text-[#111827] shadow-2xs font-semibold" : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Categories</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "table" ? "bg-white text-[#111827] shadow-2xs font-semibold" : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <List className="w-3 h-3" />
              <span>Table</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === "ALL"
                  ? "bg-[#174D3C] text-white"
                  : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#111827]"
              }`}
            >
              All Categories ({records.length})
            </button>

            {categories.map((cat) => {
              const count = records.filter(
                (r) => (r.category || "General Estate Sales") === cat
              ).length;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#174D3C] text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#111827]"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1 rounded ${
                      isSelected ? "bg-[#103C30] text-white" : "bg-[#E2E8F0] text-[#64748B]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Dates Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search buyer, item, invoice ref, category, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
              />
              <span className="text-[#64748B]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
              />
              {(startDate || endDate || search || selectedCategory !== "ALL") && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSearch("");
                    setSelectedCategory("ALL");
                  }}
                  className="text-xs text-[#64748B] hover:text-[#111827] underline ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Content Views */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748B]">
              Loading sales records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-[#111827]">No sales transactions found</p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Use the Sales Entry form to record your first transaction and generate an official invoice.
              </p>
              <Link
                href="/sales"
                className="inline-block px-3.5 py-1.5 bg-[#174D3C] text-white rounded-lg text-xs font-medium hover:bg-[#103C30]"
              >
                Go to Sales Entry
              </Link>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filtered.map((r) => {
                const invoiceId = r.invoiceGroupId || r.id;
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xs hover:shadow-xs transition-all p-4 flex flex-col justify-between group hover:border-[#174D3C]"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-[#EAF3EE] text-[#174D3C]">
                            <Receipt className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                              Voucher
                            </span>
                            <span className="font-mono font-semibold text-xs text-[#111827]">
                              {r.srNo || `SAL-${String(r.id).slice(-6).toUpperCase()}`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8]">
                            {r.category || "Produce"}
                          </span>
                          <div className="text-[10px] text-[#64748B] mt-0.5">{r.dateOfSale}</div>
                        </div>
                      </div>

                      {/* Produce Item & Amount */}
                      <div className="space-y-0.5 mb-2.5">
                        <h4 className="font-semibold text-[#111827] text-xs">{r.itemName}</h4>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-[#64748B]">
                            {r.quantity} {r.unit} @ ₹{Number(r.pricePerUnit).toFixed(2)}/{r.unit}
                          </span>
                          <span className="font-mono font-bold text-[#174D3C] text-sm">
                            ₹{Number(r.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Buyer Details */}
                      <div className="bg-[#F8FAFC] rounded-lg p-2.5 space-y-1 text-[11px] text-[#475569] mb-3 border border-[#E2E8F0]">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Buyer:</span>
                          <span className="font-semibold text-[#111827]">{r.buyerName || "Walk-in Buyer"}</span>
                        </div>
                        {(r.buyerCity || r.buyerContact) && (
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Location/Phone:</span>
                            <span>{[r.buyerCity, r.buyerContact].filter(Boolean).join(" • ")}</span>
                          </div>
                        )}
                        {r.particularName && (
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Ledger:</span>
                            <span>{r.particularName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => openSalesVoucher(r)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
                      >
                        <Maximize2 className="w-3 h-3 text-emerald-200" />
                        <span>Voucher</span>
                      </button>

                      <Link
                        href={`/sales-invoice/${invoiceId}?print=true`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] rounded-lg text-xs font-medium transition-colors shadow-2xs"
                        title="Print Bill"
                      >
                        <Printer className="w-3 h-3 text-[#64748B]" />
                        <span>Print</span>
                      </Link>

                      <Link
                        href={`/sales-invoice/${invoiceId}`}
                        className="p-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#111827] rounded-lg transition-colors shadow-2xs"
                        title="View Invoice Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === "grouped" ? (
            <div className="space-y-4">
              {categoryGroups.map((group) => {
                if (group.records.length === 0) return null;

                return (
                  <div
                    key={group.name}
                    className="border border-[#E2E8F0] rounded-xl overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#174D3C]" />
                        <span className="font-semibold text-xs text-[#111827]">{group.name}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8]">
                          {group.records.length} {group.records.length === 1 ? "Bill" : "Bills"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#174D3C] font-mono">
                        ₹{group.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] bg-white text-[11px] font-medium text-[#64748B]">
                            <th className="py-2 px-3">Ref</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Item</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Rate</th>
                            <th className="py-2 px-3 text-right">Amount</th>
                            <th className="py-2 px-3">Buyer</th>
                            <th className="py-2 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                          {group.records.map((r) => {
                            const invoiceId = r.invoiceGroupId || r.id;
                            return (
                              <tr key={r.id} className="hover:bg-[#F8FAFC]">
                                <td className="py-2 px-3 font-mono font-semibold text-xs">{r.srNo || "—"}</td>
                                <td className="py-2 px-3 text-[#475569]">{r.dateOfSale}</td>
                                <td className="py-2 px-3 font-medium text-[#111827]">{r.itemName}</td>
                                <td className="py-2 px-3 text-right font-mono">{r.quantity} {r.unit}</td>
                                <td className="py-2 px-3 text-right font-mono">₹{Number(r.pricePerUnit).toFixed(2)}</td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-[#174D3C]">
                                  ₹{Number(r.totalAmount).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-[#475569]">{r.buyerName || "Walk-in"}</td>
                                <td className="py-2 px-3 text-right">
                                  <div className="inline-flex items-center gap-1 justify-end">
                                    <Link
                                      href={`/sales-invoice/${invoiceId}?print=true`}
                                      target="_blank"
                                      className="p-1 text-[#64748B] hover:text-[#111827] rounded"
                                      title="Print Bill"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                      onClick={() => handleDelete(r.id)}
                                      className="p-1 text-[#94A3B8] hover:text-red-700 rounded"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="px-6 pb-2 flex justify-end">
                {records.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] text-red-600 hover:text-red-800 font-medium transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All Sales</span>
                  </button>
                )}
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Ref</th>
                    <th className="py-2.5 px-4 font-medium">Date</th>
                    <th className="py-2.5 px-4 font-medium">Category</th>
                    <th className="py-2.5 px-4 font-medium">Produce Item</th>
                    <th className="py-2.5 px-4 font-medium text-right">Quantity</th>
                    <th className="py-2.5 px-4 font-medium text-right">Rate</th>
                    <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                    <th className="py-2.5 px-4 font-medium">Buyer</th>
                    <th className="py-2.5 px-4 font-medium text-center">Print / View</th>
                    <th className="py-2.5 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                  {filtered.map((r) => {
                    const invoiceId = r.invoiceGroupId || r.id;
                    return (
                      <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-xs">{r.srNo || "—"}</td>
                        <td className="py-3 px-4 text-[#475569]">{r.dateOfSale}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8]">
                            {r.category || "General"}
                          </span>
                        </td>
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
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <Link
                              href={`/sales-invoice/${invoiceId}?print=true`}
                              target="_blank"
                              className="p-1 text-[#64748B] hover:text-[#111827] rounded"
                              title="Print Bill"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              href={`/sales-invoice/${invoiceId}`}
                              className="p-1 text-[#64748B] hover:text-[#111827] rounded"
                              title="View Invoice"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ContentCard>

      {/* MODAL: MANAGE SALES CATEGORIES */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4 border border-[#E2E8F0] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#174D3C]" />
                <span>Manage Sales Categories</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCatModalOpen(false);
                  setNewCatName("");
                }}
                className="p-1 rounded-md text-[#64748B] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="flex items-center gap-2 text-xs">
              <input
                type="text"
                required
                placeholder="New Category (e.g. Organic Honey, Timber, Seeds)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
              />
              <button
                type="submit"
                disabled={savingCat || !newCatName.trim()}
                className="px-3.5 py-2 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{savingCat ? "Adding..." : "Add"}</span>
              </button>
            </form>

            <div className="space-y-1.5 max-h-56 overflow-y-auto text-xs">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                Configured Categories ({categories.length})
              </div>
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="p-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-2"
                >
                  <span className="font-medium text-[#111827]">{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 text-[#94A3B8] hover:text-red-700 rounded transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCatModalOpen(false);
                  setNewCatName("");
                }}
                className="px-3.5 py-1.5 text-xs font-medium bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111827] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Sales Voucher Slip Modal */}
      <VoucherSlipModal
        isOpen={!!activeModalVoucher}
        onClose={() => setActiveModalVoucher(null)}
        voucher={activeModalVoucher}
        initialFullPage={true}
      />
    </PageContainer>
  );
}
