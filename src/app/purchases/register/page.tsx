"use client";

import React, { useEffect, useState } from "react";
import { csvDocument, csvDataUri } from "@/lib/csv";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCard } from "@/components/ui/content-card";
import { VoucherSlipData, VoucherSlipModal } from "@/components/voucher-slip-modal";
import type { PurchaseVoucherItem } from "@/types/estate";
import { DEFAULT_PURCHASE_CATEGORIES } from "@/types/estate";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutGrid,
  List,
  Maximize2,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

export default function PurchaseRegisterPage() {
  const [logs, setLogs] = useState<PurchaseVoucherItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    ...DEFAULT_PURCHASE_CATEGORIES,
  ]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "grouped" | "table">("cards");
  const [activeModalVoucher, setActiveModalVoucher] =
    useState<VoucherSlipData | null>(null);

  // Category Management Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const fetchLogsAndCats = async () => {
    try {
      setLoading(true);
      const [logsRes, catsRes] = await Promise.all([
        fetch("/api/purchase-vouchers"),
        fetch("/api/purchase-categories"),
      ]);
      const logsData: PurchaseVoucherItem[] = await logsRes.json();
      const catsData = await catsRes.json().catch(() => []);

      setLogs(Array.isArray(logsData) ? logsData : []);
      if (Array.isArray(catsData) && catsData.length > 0) {
        setCategories(catsData);
      }
    } catch (err) {
      console.error("Error loading purchase vouchers for register:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchLogsAndCats();
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
      const res = await fetch("/api/purchase-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCatName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        setNewCatName("");
        setMsg({
          type: "success",
          text: `Category "${newCatName.trim()}" created successfully!`,
        });
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
      const res = await fetch(
        `/api/purchase-categories?category=${encodeURIComponent(cat)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        if (categoryFilter === cat) setCategoryFilter("ALL");
        setMsg({ type: "success", text: `Category "${cat}" removed.` });
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to void / delete this purchase voucher record?"
      )
    )
      return;
    try {
      const res = await fetch(`/api/purchase-vouchers?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMsg({
          type: "success",
          text: "Purchase voucher deleted successfully",
        });
        fetchLogsAndCats();
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (e) {
      console.error("Failed to delete voucher", e);
    }
  };

  // Filter records by date, search, and category
  const filteredLogs = (() => {
    return logs.filter((log) => {
      const d = log.date || "";
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;

      const recordCat = log.category || "General";
      if (categoryFilter !== "ALL" && recordCat !== categoryFilter) {
        return false;
      }

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PAID" &&
          (log.paymentStatus === "PAID" || !log.paymentStatus)) ||
        (statusFilter === "PENDING" && log.paymentStatus === "PENDING") ||
        (statusFilter === "PARTIAL" && log.paymentStatus === "PARTIAL");
      if (!matchesStatus) return false;

      const query = searchTerm.toLowerCase().trim();
      if (!query) return true;

      const voucher = (log.voucherNo || "").toLowerCase();
      const vendor = (log.vendorName || "").toLowerCase();
      const bill = (log.vendorBillNo || "").toLowerCase();
      const desc = (log.description || "").toLowerCase();
      const plot = (log.plotName || "").toLowerCase();
      const cat = recordCat.toLowerCase();

      return (
        voucher.includes(query) ||
        vendor.includes(query) ||
        bill.includes(query) ||
        desc.includes(query) ||
        plot.includes(query) ||
        cat.includes(query)
      );
    });
  })();

  const exportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      "Voucher No",
      "Date",
      "Category",
      "Vendor",
      "Vendor Bill No",
      "Plot",
      "Description",
      "Amount (INR)",
      "Payment Mode",
      "Status",
      "Logged By",
    ];

    const rows = filteredLogs.map((l) => [
      l.voucherNo || `PUR-${l.id}`,
      l.date || "",
      l.category || "General",
      l.vendorName || "General Supplier",
      l.vendorBillNo || "",
      l.plotName || "General Estate",
      l.description || "",
      String(l.cost || 0),
      l.paymentMode || "Cash",
      l.paymentStatus || "PAID",
      l.loggedBy || "Estate Admin",
    ]);

    const encodedUri = csvDataUri(csvDocument(headers, rows));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `purchase_register_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCost = filteredLogs.reduce(
    (acc, l) => acc + (Number(l.cost) || 0),
    0
  );
  const totalTransactions = filteredLogs.length;

  // Category wise breakdown for summary & grouped view
  const categoryGroups = (() => {
    const map = new Map<string, PurchaseVoucherItem[]>();

    categories.forEach((cat) => map.set(cat, []));

    filteredLogs.forEach((l) => {
      const cat = l.category || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(l);
    });

    const groups: {
      name: string;
      records: PurchaseVoucherItem[];
      totalCost: number;
    }[] = [];
    map.forEach((items, name) => {
      if (categoryFilter === "ALL" || categoryFilter === name) {
        if (items.length > 0 || categoryFilter === name) {
          groups.push({
            name,
            records: items,
            totalCost: items.reduce(
              (sum, item) => sum + Number(item.cost || 0),
              0
            ),
          });
        }
      }
    });

    return groups.sort((a, b) => b.totalCost - a.totalCost);
  })();

  const openSlipModal = (log: PurchaseVoucherItem) => {
    const slipData: VoucherSlipData = {
      voucherType: "PURCHASE",
      voucherNo: log.voucherNo || `PUR-${log.id}`,
      date: log.date,
      title: `${log.category || "Estate Purchase"} Voucher`,
      category: log.category,
      partyName: log.vendorName || "General Supplier",
      partyContact: log.vendorContact || "—",
      vendorBillNo: log.vendorBillNo || "—",
      vendorGstin: log.vendorGstin || "—",
      plotName: log.plotName || "General Estate",
      cropActivityName: log.cropActivityName || "N/A",
      paymentMode: log.paymentMode || "Bank Transfer",
      paymentStatus: log.paymentStatus || "PAID",
      items:
        log.items && log.items.length > 0
          ? log.items
          : [
              {
                id: "1",
                description: log.description || "General Purchase Item",
                quantity: 1,
                unit: "units",
                rate: log.cost || 0,
                amount: log.cost || 0,
              },
            ],
      subtotal: log.subtotal || log.cost || 0,
      taxPercent: log.taxPercent || 0,
      taxAmount: log.taxAmount || 0,
      discount: log.discount || 0,
      totalAmount: log.cost || 0,
      loggedBy: log.loggedBy || "Estate Admin",
      notes: log.notes,
    };
    setActiveModalVoucher(slipData);
  };

  return (
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title="Purchase & Expense Voucher Register"
        breadcrumbs={[
          { label: "Purchases & Expenses", href: "/purchases" },
          { label: "Voucher Register" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCatModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Manage Categories</span>
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/purchases/retailers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Retailers</span>
            </Link>

            <Link
              href="/purchases"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Voucher</span>
            </Link>
          </div>
        }
      />

      {/* Notification Toast */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            msg.type === "success"
              ? "bg-[#EAF3EE] text-[#174D3C] border-[#174D3C]/20"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#174D3C]" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Voucher Expenses"
          value={`₹${totalCost.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}`}
          icon={<DollarSign className="w-5 h-5 text-[#174D3C]" />}
        />
        <StatCard
          title="Total Recorded Entries"
          value={totalTransactions}
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Active Categories"
          value={categories.length}
          icon={<Tag className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Category Wise Filter Pills */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#174D3C]" />
            <span>Filter by Category</span>
          </span>
          <button
            onClick={() => setCatModalOpen(true)}
            className="text-xs font-semibold text-[#174D3C] hover:text-[#103C30]"
          >
            + Create New Category
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              categoryFilter === "ALL"
                ? "bg-[#174D3C] text-white"
                : "bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Categories ({logs.length})
          </button>

          {categories.map((cat) => {
            const count = logs.filter(
              (l) => (l.category || "General") === cat
            ).length;
            const isSelected = categoryFilter === cat;

            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#174D3C] text-white"
                    : "bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar & View Mode Switcher */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by voucher #, vendor, category, plot, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#174D3C]"
          />
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#174D3C]"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#174D3C]"
          />
          {(startDate || endDate || searchTerm || categoryFilter !== "ALL") && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchTerm("");
                setCategoryFilter("ALL");
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* View Mode Toggle: Cards, Category Grouped, Table */}
        <div className="flex items-center bg-[#F8FAFC] p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              viewMode === "cards"
                ? "bg-white text-[#174D3C] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Display vouchers as interactive cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode("grouped")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              viewMode === "grouped"
                ? "bg-white text-[#174D3C] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Display vouchers grouped Category-wise"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Category</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              viewMode === "table"
                ? "bg-white text-[#174D3C] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Display as flat ledger table"
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading purchase vouchers...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No purchase vouchers found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the Purchase Voucher form to record your first transaction and generate an official Ranga Estate voucher.
          </p>
          <Link
            href="/purchases"
            className="inline-block px-4 py-2 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Go to Purchase Voucher
          </Link>
        </div>
      ) : viewMode === "cards" ? (
        /* VOUCHER CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#174D3C]/30 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Card Header: Voucher No, Date, Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-[#EAF3EE] text-[#174D3C]">
                      <Receipt className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        VOUCHER NO
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {log.voucherNo || `VCH-${log.id}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.paymentStatus === "PAID" || !log.paymentStatus
                          ? "bg-[#EAF3EE] text-[#174D3C]"
                          : log.paymentStatus === "PENDING"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-[#EAF3EE] text-[#174D3C]"
                      }`}
                    >
                      {log.paymentStatus || "PAID"}
                    </span>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {log.date}
                    </div>
                  </div>
                </div>

                {/* Vendor & Amount */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                      {log.vendorName || "General Supplier"}
                    </h3>
                    <span className="font-mono font-bold text-slate-900 text-base">
                      ₹{Number(log.cost || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {log.vendorBillNo && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Bill/Inv: {log.vendorBillNo}
                    </div>
                  )}
                </div>

                {/* Category & Plot Box */}
                <div className="bg-[#F8FAFC] rounded-lg p-3 space-y-1 text-xs text-slate-600 mb-4 border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-semibold text-slate-800">
                      {log.category || "General"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plot:</span>
                    <span className="font-semibold text-[#174D3C]">
                      {log.plotName || "General Estate"}
                    </span>
                  </div>
                  {log.description && (
                    <div className="pt-1 text-[11px] text-slate-500 truncate">
                      {log.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openSlipModal(log)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  title="Expand Voucher to Full Page View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Voucher</span>
                </button>

                <button
                  onClick={() => openSlipModal(log)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                  title="Print Voucher Slip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "grouped" ? (
        /* CATEGORY-WISE DISPLAYED VOUCHERS */
        <div className="space-y-6">
          {categoryGroups.map((group) => {
            if (group.records.length === 0) return null;

            return (
              <ContentCard
                key={group.name}
                title={group.name}
                action={
                  <div className="text-xs font-mono font-bold text-[#174D3C]">
                    Total: ₹{group.totalCost.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                }
              >
                <div className="overflow-x-auto -mx-6 -mb-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Voucher No</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Vendor / Supplier</th>
                        <th className="py-3 px-4">Plot Allocation</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 text-right">Voucher Cost</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Print / Slip</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {group.records.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                            <button
                              onClick={() => openSlipModal(log)}
                              className="hover:underline text-left flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#174D3C]" />
                              {log.voucherNo || `PUR-${log.id}`}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {log.date}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">
                              {log.vendorName || "General Supplier"}
                            </div>
                            {log.vendorBillNo && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                Bill: {log.vendorBillNo}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {log.plotName || "General Estate"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                            {log.description}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                            ₹{Number(log.cost || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                log.paymentStatus === "PAID" || !log.paymentStatus
                                  ? "bg-[#EAF3EE] text-[#174D3C]"
                                  : log.paymentStatus === "PENDING"
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-[#EAF3EE] text-[#174D3C]"
                              }`}
                            >
                              {log.paymentStatus === "PENDING" ? (
                                <Clock className="w-2.5 h-2.5" />
                              ) : log.paymentStatus === "PARTIAL" ? (
                                <AlertCircle className="w-2.5 h-2.5" />
                              ) : (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              )}
                              {log.paymentStatus || "PAID"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openSlipModal(log)}
                              title="View Official Voucher Slip"
                              className="p-1.5 bg-[#F8FAFC] hover:bg-[#EAF3EE] text-slate-600 hover:text-[#174D3C] rounded-lg transition-colors border border-slate-200 inline-flex items-center justify-center"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteVoucher(log.id)}
                              title="Void Voucher"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ContentCard>
            );
          })}
        </div>
      ) : (
        /* FLAT TABLE VIEW */
        <ContentCard
          title={`All Purchase Vouchers (${filteredLogs.length})`}
        >
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category Head</th>
                  <th className="py-3 px-4">Vendor / Supplier</th>
                  <th className="py-3 px-4">Plot Allocation</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Voucher Cost</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Print / Slip</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      <button
                        onClick={() => openSlipModal(log)}
                        className="hover:underline text-left flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#174D3C]" />
                        {log.voucherNo || `PUR-${log.id}`}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{log.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {log.category || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {log.vendorName || "General Supplier"}
                      </div>
                      {log.vendorBillNo && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Bill: {log.vendorBillNo}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {log.plotName || "General Estate"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                      ₹{Number(log.cost || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.paymentStatus === "PAID" || !log.paymentStatus
                            ? "bg-[#EAF3EE] text-[#174D3C]"
                            : log.paymentStatus === "PENDING"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-[#EAF3EE] text-[#174D3C]"
                        }`}
                      >
                        {log.paymentStatus === "PENDING" ? (
                          <Clock className="w-2.5 h-2.5" />
                        ) : log.paymentStatus === "PARTIAL" ? (
                          <AlertCircle className="w-2.5 h-2.5" />
                        ) : (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        )}
                        {log.paymentStatus || "PAID"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openSlipModal(log)}
                        title="View Official Voucher Slip"
                        className="p-1.5 bg-[#F8FAFC] hover:bg-[#EAF3EE] text-slate-600 hover:text-[#174D3C] rounded-lg transition-colors border border-slate-200 inline-flex items-center justify-center"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteVoucher(log.id)}
                        title="Void Voucher"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      {/* MODAL: MANAGE PURCHASE CATEGORIES */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#EAF3EE] text-[#174D3C] flex items-center justify-center text-xs font-bold">
                  <Tag className="w-4 h-4" />
                </span>
                <span>Manage Purchase Categories</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCatModalOpen(false);
                  setNewCatName("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="New Category (e.g. Irrigation Spares, Packaging, Tools)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
              />
              <button
                type="submit"
                disabled={savingCat || !newCatName.trim()}
                className="px-4 py-2 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{savingCat ? "Adding..." : "Add"}</span>
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Configured Categories ({categories.length})
              </div>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="p-2.5 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                      <Tag className="w-3.5 h-3.5 text-[#174D3C]" />
                      <span>{cat}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCatModalOpen(false);
                  setNewCatName("");
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Official Voucher Slip Modal */}
      <VoucherSlipModal
        isOpen={!!activeModalVoucher}
        onClose={() => setActiveModalVoucher(null)}
        voucher={activeModalVoucher}
      />
    </PageContainer>
  );
}
