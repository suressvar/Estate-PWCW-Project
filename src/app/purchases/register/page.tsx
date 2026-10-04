"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Store,
  Search,
  Calendar,
  Printer,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Layers,
  Tag,
  Plus,
  LayoutGrid,
  List,
  FileSpreadsheet,
  X,
} from "lucide-react";
import type { PurchaseVoucherItem } from "@/types/estate";
import { DEFAULT_PURCHASE_CATEGORIES } from "@/types/estate";
import { StatCard } from "@/components/ui/stat-card";
import { VoucherSlipModal, VoucherSlipData } from "@/components/voucher-slip-modal";

export default function PurchaseRegisterPage() {
  const [logs, setLogs] = useState<PurchaseVoucherItem[]>([]);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_PURCHASE_CATEGORIES]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");
  const [activeModalVoucher, setActiveModalVoucher] = useState<VoucherSlipData | null>(null);

  // Category Management Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    fetchLogsAndCats();
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
        setMsg({ type: "success", text: `Category "${newCatName.trim()}" created successfully!` });
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (!confirm(`Are you sure you want to delete category "${cat}"?`)) return;
    try {
      const res = await fetch(`/api/purchase-categories?category=${encodeURIComponent(cat)}`, {
        method: "DELETE",
      });
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
    if (!confirm("Are you sure you want to void / delete this purchase voucher record?")) return;
    try {
      const res = await fetch(`/api/purchase-vouchers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ type: "success", text: "Purchase voucher deleted successfully" });
        fetchLogsAndCats();
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (e) {
      console.error("Failed to delete voucher", e);
    }
  };

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
      (l.description || "").replace(/"/g, '""'),
      String(l.cost || 0),
      l.paymentMode || "Cash",
      l.paymentStatus || "PAID",
      l.loggedBy || "Estate Admin",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
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

  // Filter records by date, search, and category
  const filteredLogs = useMemo(() => {
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
        (statusFilter === "PAID" && (log.paymentStatus === "PAID" || !log.paymentStatus)) ||
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
  }, [logs, startDate, endDate, categoryFilter, statusFilter, searchTerm]);

  const totalCost = filteredLogs.reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
  const totalTransactions = filteredLogs.length;

  // Category wise breakdown for summary & grouped view
  const categoryGroups = useMemo(() => {
    const map = new Map<string, PurchaseVoucherItem[]>();

    categories.forEach((cat) => map.set(cat, []));

    filteredLogs.forEach((l) => {
      const cat = l.category || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(l);
    });

    const groups: { name: string; records: PurchaseVoucherItem[]; totalCost: number }[] = [];
    map.forEach((items, name) => {
      if (categoryFilter === "ALL" || categoryFilter === name) {
        if (items.length > 0 || categoryFilter === name) {
          groups.push({
            name,
            records: items,
            totalCost: items.reduce((sum, item) => sum + Number(item.cost || 0), 0),
          });
        }
      }
    });

    return groups.sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredLogs, categories, categoryFilter]);

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
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-black shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Purchase Register</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Official Ledger
              </span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manage Categories Button */}
          <button
            onClick={() => setCatModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-700" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/purchases/retailers"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-emerald-700" />
            <span>Retailers / Purchaser</span>
          </Link>

          <Link
            href="/purchases"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Voucher</span>
          </Link>
        </div>
      </div>

      {/* Notification */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Purchases Expenses"
          value={`₹${totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtitle="Net procurement expenditure"
          icon={DollarSign}
        />
        <StatCard
          title="Total Recorded Entries"
          value={totalTransactions}
          subtitle="Registered purchase vouchers"
          icon={Layers}
        />
        <StatCard
          title="Active Categories"
          value={categories.length}
          subtitle="Configured expense categories"
          icon={Tag}
        />
      </div>

      {/* Category Wise Filter Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-700" />
            <span>Filter by Category</span>
          </span>
          <button
            onClick={() => setCatModalOpen(true)}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            + Create New Category
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-[#15803d] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#15803d] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? "bg-emerald-900/40 text-white" : "bg-slate-100 text-slate-600"
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
      <div className="glass-panel p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by voucher #, vendor, category, plot, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:bg-white"
          />
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
          />
          {(startDate || endDate || searchTerm || categoryFilter !== "ALL") && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchTerm("");
                setCategoryFilter("ALL");
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline ml-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode("grouped")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "grouped"
                ? "bg-white text-[#15803d] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Display vouchers grouped Category-wise"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Category View</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-[#15803d] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Display as flat ledger table"
          >
            <List className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Category Grouped View OR Table View */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          Loading purchase vouchers...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No purchase vouchers found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the Purchase Voucher form to record your first transaction and generate an official Ranga Estate voucher.
          </p>
          <Link
            href="/purchases"
            className="inline-block px-4 py-2 bg-[#15803d] text-white rounded-lg text-xs font-bold hover:bg-[#166534] cursor-pointer"
          >
            Go to Purchase Voucher
          </Link>
        </div>
      ) : viewMode === "grouped" ? (
        /* ========================================================================= */
        /* CATEGORY-WISE DISPLAYED VOUCHERS                                          */
        /* ========================================================================= */
        <div className="space-y-6">
          {categoryGroups.map((group) => {
            if (group.records.length === 0) return null;

            return (
              <div
                key={group.name}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
              >
                {/* Category Header Banner */}
                <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#15803d] text-white flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{group.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {group.records.length} {group.records.length === 1 ? "Voucher" : "Vouchers"}
                        </span>
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-600">
                      Category Total:{" "}
                      <span className="font-extrabold text-sm text-[#15803d]">
                        ₹{group.totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table for this Category */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Voucher No</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Vendor / Supplier</th>
                        <th className="p-3.5">Plot Allocation</th>
                        <th className="p-3.5">Description</th>
                        <th className="p-3.5 text-right">Voucher Cost</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center">Print / Slip</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {group.records.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-emerald-950">
                            <button
                              onClick={() => openSlipModal(log)}
                              className="hover:underline text-left cursor-pointer flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-700" />
                              {log.voucherNo || `PUR-${log.id}`}
                            </button>
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">{log.date}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{log.vendorName || "General Supplier"}</div>
                            {log.vendorBillNo && (
                              <div className="text-[11px] text-slate-500 font-mono">Bill: {log.vendorBillNo}</div>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">{log.plotName || "General Estate"}</td>
                          <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate">
                            {log.description}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-900 text-sm text-right">
                            ₹{Number(log.cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                log.paymentStatus === "PAID" || !log.paymentStatus
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : log.paymentStatus === "PENDING"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
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
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => openSlipModal(log)}
                              title="View Official Voucher Slip"
                              className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleDeleteVoucher(log.id)}
                              title="Void Voucher"
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* FLAT TABLE VIEW                                                           */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Showing {filteredLogs.length} of {logs.length} purchase vouchers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Voucher No</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Category Head</th>
                  <th className="p-3.5">Vendor / Supplier</th>
                  <th className="p-3.5">Plot Allocation</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Voucher Cost</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Print / Slip</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-950">
                      <button
                        onClick={() => openSlipModal(log)}
                        className="hover:underline text-left cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        {log.voucherNo || `PUR-${log.id}`}
                      </button>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{log.date}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        {log.category || "General"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{log.vendorName || "General Supplier"}</div>
                      {log.vendorBillNo && (
                        <div className="text-[11px] text-slate-500 font-mono">Bill: {log.vendorBillNo}</div>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{log.plotName || "General Estate"}</td>
                    <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="p-3.5 font-mono font-black text-slate-900 text-sm text-right">
                      ₹{Number(log.cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.paymentStatus === "PAID" || !log.paymentStatus
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : log.paymentStatus === "PENDING"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
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
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => openSlipModal(log)}
                        title="View Official Voucher Slip"
                        className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDeleteVoucher(log.id)}
                        title="Void Voucher"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE PURCHASE CATEGORIES                                         */}
      {/* ========================================================================= */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
              />
              <button
                type="submit"
                disabled={savingCat || !newCatName.trim()}
                className="px-4 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{savingCat ? "Adding..." : "Add"}</span>
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Configured Categories ({categories.length})
              </div>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Tag className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{cat}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
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
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
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
    </div>
  );
}
