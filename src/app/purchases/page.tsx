"use client";

import { PurchaseCategoriesModal } from "@/components/purchases/purchase-categories-modal";
import { PurchaseRegister } from "@/components/purchases/purchase-register";
import { PurchaseVoucherForm } from "@/components/purchases/purchase-voucher-form";
import { usePurchasesPage } from "@/components/purchases/use-purchases-page";
import { StatCard } from "@/components/ui/stat-card";
import { VoucherSlipModal } from "@/components/voucher-slip-modal";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Layers,
  LayoutGrid,
  List,
  Plus,
  Receipt,
  Search,
  Store,
  Tag
} from "lucide-react";
import Link from "next/link";

export default function PurchasesPage() {
  const page = usePurchasesPage();
  const {
    setCatModalOpen,
    exportCSV,
    filteredLogs,
    setShowCreateForm,
    msg,
    totalCost,
    totalTransactions,
    categories,
    setCategoryFilter,
    categoryFilter,
    logs,
    searchTerm,
    setSearchTerm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    setViewMode,
    viewMode,
    activeModalVoucher,
    setActiveModalVoucher,
  } = page;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-black shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Voucher Entry</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Official Voucher System
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
            <span>Retailers / Suppliers</span>
          </Link>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Voucher</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${msg.type === "success"
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
          title="Total Voucher Expenses"
          value={`₹${totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtitle="Net procurement expenditure"
          icon={DollarSign}
        />
        <StatCard
          title="Total Recorded Entries"
          value={totalTransactions}
          subtitle="Registered estate vouchers"
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${categoryFilter === "ALL"
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${isSelected
                    ? "bg-[#15803d] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isSelected ? "bg-emerald-900/40 text-white" : "bg-slate-100 text-slate-600"
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

        {/* View Mode Toggle: Cards, Category Grouped, Table */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "cards"
                ? "bg-white text-[#15803d] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
            title="Display vouchers as interactive cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards View</span>
          </button>
          <button
            onClick={() => setViewMode("grouped")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "grouped"
                ? "bg-white text-[#15803d] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
            title="Display vouchers grouped Category-wise"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Category View</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "table"
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

      <PurchaseVoucherForm {...page} />

      {/* Main Content Area: Category Grouped View OR Table View */}
      <PurchaseRegister {...page} />

      {/* ========================================================================= */}
      {/* MODAL: MANAGE PURCHASE CATEGORIES                                         */}
      {/* ========================================================================= */}
      <PurchaseCategoriesModal {...page} />

      {/* Printable Official Voucher Slip Modal */}
      <VoucherSlipModal
        isOpen={!!activeModalVoucher}
        onClose={() => setActiveModalVoucher(null)}
        voucher={activeModalVoucher}
      />

    </div>
  );
}
