"use client";

import { ExpenseModal } from "@/components/expenses/expense-modal";
import { ExpenseRegister } from "@/components/expenses/expense-register";
import { PettyCashLedger } from "@/components/expenses/petty-cash-ledger";
import { PettyCashTopUpModal } from "@/components/expenses/petty-cash-top-up-modal";
import { useExpensesPage } from "@/components/expenses/use-expenses-page";
import { StatCard } from "@/components/ui/stat-card";
import { VoucherSlipModal } from "@/components/voucher-slip-modal";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import {
      DollarSign,
  Plus,
  Receipt,
  RefreshCw,
  Sprout,
  TrendingDown,
  TrendingUp,
  } from "lucide-react";

export default function ExpensesAndPettyCashPage() {
  const page = useExpensesPage();
  const {
    setShowTopUpModal,
    openNewExpenseModal,
    fetchData,
    loading,
    pettyStatus,
    expenseSummary,
    setActiveTab,
    activeTab,
    expenses,
    pettyLedger,
    activeModalVoucher,
    setActiveModalVoucher,
  } = page;

  return (
    <PageContainer>
      {/* Standardized Page Header */}
      <PageHeader
        title="Expenses & Petty Cash Tracker"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Expenses & Cash" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#16805D]" />
              <span>Top Up Petty Cash</span>
            </button>

            <button
              onClick={() => openNewExpenseModal("PETTY_CASH")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Petty Cash Spend</span>
            </button>

            <button
              onClick={() => openNewExpenseModal("GENERAL")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#174D3C] hover:bg-[#103C30] text-white shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log General Expense</span>
            </button>

            <button
              onClick={fetchData}
              title="Refresh"
              className="p-1.5 border border-slate-200/90 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#16805D]" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Enterprise Petty Cash Running Balance Card */}
      <ContentCard
        title="Live Petty Cash Balance"
        actions={
          <button
            onClick={() => setShowTopUpModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#EAF3EE] hover:bg-[#d8ece0] text-[#174D3C] font-semibold text-xs transition-colors border border-[#16805D]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cash</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Current Cash In Hand
            </span>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              ₹{pettyStatus.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16805D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16805D]" /> Verified Balance
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Total Inflow (Top-Ups)
            </span>
            <div className="text-lg font-bold font-mono text-[#16805D]">
              +₹{pettyStatus.totalInflow.toLocaleString()}
            </div>
            {pettyStatus.lastTopUpDate && (
              <p className="text-[10px] text-slate-400">Last: {pettyStatus.lastTopUpDate}</p>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Total Outflow (Spends)
            </span>
            <div className="text-lg font-bold font-mono text-[#DC3545]">
              -₹{pettyStatus.totalOutflow.toLocaleString()}
            </div>
            {pettyStatus.lastExpenseDate && (
              <p className="text-[10px] text-slate-400">Last: {pettyStatus.lastExpenseDate}</p>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Reconciled Days
            </span>
            <div className="text-lg font-bold font-mono text-slate-900">
              {pettyStatus.ledgerCount} Days
            </div>
            <p className="text-[10px] text-slate-400">Audit trail active</p>
          </div>
        </div>
      </ContentCard>

      {/* Structured 4-Column KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Farm Expenses"
          value={`₹${(expenseSummary?.totalExpenses || 0).toLocaleString()}`}
          icon={<Receipt className="w-4 h-4 text-[#16805D]" />}
          variant="emerald"
        />
        <StatCard
          title="Petty Cash Outflow"
          value={`₹${(expenseSummary?.pettyCashExpensesTotal || 0).toLocaleString()}`}
          icon={<TrendingDown className="w-4 h-4 text-amber-600" />}
          variant="amber"
        />
        <StatCard
          title="General Overheads"
          value={`₹${(expenseSummary?.generalExpensesTotal || 0).toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4 text-blue-600" />}
          variant="blue"
        />
        <StatCard
          title="Allocated to Crops"
          value={`₹${(expenseSummary?.taggedToCropCyclesTotal || 0).toLocaleString()}`}
          icon={<Sprout className="w-4 h-4 text-purple-600" />}
          variant="violet"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "expenses"
              ? "border-[#174D3C] text-[#174D3C]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Expenses Register ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("petty_ledger")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "petty_ledger"
              ? "border-[#174D3C] text-[#174D3C]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Daily Petty Cash Ledger ({pettyLedger.length})
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "summary"
              ? "border-[#174D3C] text-[#174D3C]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Category Breakdown & Analytics
        </button>
      </div>

      {/* TAB 1: EXPENSES REGISTER */}
      <ExpenseRegister {...page} />

      {/* TAB 2: DAILY PETTY CASH LEDGER */}
      <PettyCashLedger {...page} />

      {/* TAB 3: SUMMARY & BREAKDOWN */}
      {activeTab === "summary" && expenseSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ContentCard
            title="Category Spend Breakdown"
          >
            <div className="space-y-3">
              {expenseSummary.categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.category}</span>
                    <span className="font-mono text-slate-600 font-medium">
                      ₹{item.amount.toLocaleString()} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                      className="h-full rounded-full bg-[#174D3C]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>

          <ContentCard
            title="Cost Attribution by Crop / Plot"
          >
            {(!expenseSummary.cropAllocationBreakdown || expenseSummary.cropAllocationBreakdown.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No expenses currently tagged to crop cycles.
              </p>
            ) : (
              <div className="space-y-3">
                {(expenseSummary.cropAllocationBreakdown || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.cropName}</p>
                      <p className="text-[11px] text-slate-500">{item.plotName}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{item.totalAmount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ContentCard>
        </div>
      )}

      {/* Modals */}
      <ExpenseModal {...page} />
      <PettyCashTopUpModal {...page} />
      {activeModalVoucher && (
        <VoucherSlipModal
          voucher={activeModalVoucher}
          onClose={() => setActiveModalVoucher(null)}
        />
      )}
    </PageContainer>
  );
}
