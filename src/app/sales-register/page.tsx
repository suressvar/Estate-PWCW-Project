"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Calendar,
  FileSpreadsheet,
  Plus,
  Printer,
  Trash2,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Tag,
  FolderTree,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function MainSalesRegisterPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");
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
    fetchSalesAndCats();
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
    } catch (err: any) {
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
      String(r.quantity || ""),
      r.unit || "",
      String(r.pricePerUnit || ""),
      String(r.totalAmount || ""),
      r.buyerName || "",
      r.buyerCity || "",
      r.buyerContact || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ranga_estate_sales_register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter records by date, search, and category tab
  const filtered = useMemo(() => {
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
  }, [records, startDate, endDate, selectedCategory, search]);

  const totalRevenue = filtered.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0);
  const totalTransactions = filtered.length;

  // Category wise breakdown for summary & grouped view
  const categoryGroups = useMemo(() => {
    const map = new Map<string, any[]>();

    // Initialize all existing categories so empty ones can also be seen if desired
    categories.forEach((cat) => map.set(cat, []));

    filtered.forEach((r) => {
      const cat = r.category || "General Estate Sales";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    });

    const groups: { name: string; records: any[]; totalAmount: number }[] = [];
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
  }, [filtered, categories, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-black shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Ranga Estate Sales Register</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Official Ledger
              </span>
            </h1>
            <p className="text-xs text-slate-600">
              Audit ledger of all recorded estate produce & livestock sales with one-click official invoice printing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manage Categories Button */}
          <button
            onClick={() => setCatModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-700" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/sales"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Entry</span>
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
          title="Total Sales Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtitle="Net realized revenue"
          icon={DollarSign}
        />
        <StatCard
          title="Total Recorded Entries"
          value={totalTransactions}
          subtitle="Registered sales transactions"
          icon={Layers}
        />
        <StatCard
          title="Active Categories"
          value={categories.length}
          subtitle="Configured produce categories"
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
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
          >
            + Create New Category
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategory === "ALL"
                ? "bg-[#15803d] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
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
            placeholder="Search by buyer, produce item, invoice ref, category, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {(startDate || endDate || search || selectedCategory !== "ALL") && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearch("");
                setSelectedCategory("ALL");
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline ml-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode("grouped")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "grouped"
                ? "bg-white text-[#15803d] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Display bills grouped Category-wise"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Category View</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
          Loading sales records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No sales transactions found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the Sales Entry form to record your first transaction and generate an official Ranga Estate invoice.
          </p>
          <Link
            href="/sales"
            className="inline-block px-4 py-2 bg-[#15803d] text-white rounded-lg text-xs font-bold hover:bg-[#166534]"
          >
            Go to Sales Entry
          </Link>
        </div>
      ) : viewMode === "grouped" ? (
        /* ========================================================================= */
        /* CATEGORY-WISE DISPLAYED BILLS                                             */
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
                          {group.records.length} {group.records.length === 1 ? "Bill" : "Bills"}
                        </span>
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-600">
                      Category Total:{" "}
                      <span className="font-extrabold text-sm text-[#15803d]">
                        ₹{group.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table for this Category */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Ref / SrNo</th>
                        <th className="p-3.5">Date of Sale</th>
                        <th className="p-3.5">Produce Item</th>
                        <th className="p-3.5 text-right">Quantity</th>
                        <th className="p-3.5 text-right">Rate</th>
                        <th className="p-3.5 text-right">Total Amount</th>
                        <th className="p-3.5">Buyer Details</th>
                        <th className="p-3.5 text-center">Print / Invoice</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {group.records.map((r) => {
                        const invoiceId = r.invoiceGroupId || r.id;

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-slate-900">
                              {r.srNo || "—"}
                            </td>
                            <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">
                              {r.dateOfSale}
                            </td>
                            <td className="p-3.5 font-bold text-slate-900">
                              <div>{r.itemName}</div>
                              {r.particularName && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  Ledger: {r.particularName}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-medium text-slate-800">
                              {r.quantity} {r.unit}
                            </td>
                            <td className="p-3.5 text-right font-medium text-slate-800">
                              ₹{Number(r.pricePerUnit).toFixed(2)}
                            </td>
                            <td className="p-3.5 text-right font-bold text-[#15803d] text-sm">
                              ₹{Number(r.totalAmount).toFixed(2)}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900">{r.buyerName || "Walk-in"}</div>
                              <div className="text-[11px] text-slate-500">
                                {[r.buyerCity, r.buyerContact].filter(Boolean).join(" • ")}
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Print Invoice Bill Button */}
                                <Link
                                  href={`/sales-invoice/${invoiceId}?print=true`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-2xs transition-all"
                                  title="Print Official Invoice Bill"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print Bill</span>
                                </Link>

                                {/* View Invoice */}
                                <Link
                                  href={`/sales-invoice/${invoiceId}`}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                  title="View and customize layout"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        /* ========================================================================= */
        /* FLAT TABLE VIEW                                                           */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>All Sales Entries ({filtered.length})</span>
            </div>
            <div className="flex items-center gap-3">
              {records.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Sales</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Ref / SrNo</th>
                  <th className="p-3.5">Date of Sale</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Item Description</th>
                  <th className="p-3.5 text-right">Quantity</th>
                  <th className="p-3.5 text-right">Rate</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5">Buyer Details</th>
                  <th className="p-3.5 text-center">Print / Invoice</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((r) => {
                  const invoiceId = r.invoiceGroupId || r.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {r.srNo || "—"}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">
                        {r.dateOfSale}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {r.category || "General Estate Sales"}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{r.itemName}</div>
                        {r.particularName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Ledger: {r.particularName}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-800">
                        {r.quantity} {r.unit}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-800">
                        ₹{Number(r.pricePerUnit).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-[#15803d] text-sm">
                        ₹{Number(r.totalAmount).toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{r.buyerName || "Walk-in"}</div>
                        <div className="text-[11px] text-slate-500">
                          {[r.buyerCity, r.buyerContact].filter(Boolean).join(" • ")}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/sales-invoice/${invoiceId}?print=true`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-2xs transition-all"
                            title="Print Official Invoice Bill"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Bill</span>
                          </Link>
                          <Link
                            href={`/sales-invoice/${invoiceId}`}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE SALES CATEGORIES                                            */}
      {/* ========================================================================= */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  <Tag className="w-4 h-4" />
                </span>
                <span>Manage Sales Categories</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCatModalOpen(false);
                  setNewCatName("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="New Category (e.g. Organic Honey, Timber, Seeds)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
              />
              <button
                type="submit"
                disabled={savingCat || !newCatName.trim()}
                className="px-4 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1"
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
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
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
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
