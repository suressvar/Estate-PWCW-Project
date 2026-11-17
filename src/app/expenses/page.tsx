"use client";

import { ExpenseModal } from "@/components/expenses/expense-modal";
import { ExpenseRegister } from "@/components/expenses/expense-register";
import { PettyCashLedger } from "@/components/expenses/petty-cash-ledger";
import { PettyCashTopUpModal } from "@/components/expenses/petty-cash-top-up-modal";
import { useExpensesPage } from "@/components/expenses/use-expenses-page";
import { StatCard } from "@/components/ui/stat-card";
import { VoucherSlipModal } from "@/components/voucher-slip-modal";
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  Plus,
  Receipt,
  RefreshCw,
  Sprout,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react";
import Link from "next/link";

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
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Financial Operations
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            General & Petty Cash Expense Tracker
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowTopUpModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-foreground shadow-sm transition-all"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Top Up Petty Cash
          </button>
          <button
            onClick={() => openNewExpenseModal("PETTY_CASH")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Petty Cash Spend
          </button>
          <button
            onClick={() => openNewExpenseModal("GENERAL")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Log General Expense
          </button>
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 border border-border rounded-lg bg-card hover:bg-muted text-muted-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Live Petty Cash Running Balance Banner */}
      <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-emerald-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-xs uppercase tracking-wider font-semibold text-emerald-300 flex items-center justify-center md:justify-start gap-1.5">
            <Wallet className="w-4 h-4" /> Live Petty Cash Balance
          </div>
          <div className="text-3xl md:text-4xl font-extrabold tracking-tight font-mono">
            ₹{pettyStatus.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-200/80">
            Chronologically recalculated running balance across {pettyStatus.ledgerCount} recorded days.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-center md:text-left border-t md:border-t-0 md:border-l border-emerald-700/60 pt-4 md:pt-0 md:pl-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Total Inflow</div>
            <div className="text-lg font-bold font-mono text-emerald-200">
              +₹{pettyStatus.totalInflow.toLocaleString()}
            </div>
            {pettyStatus.lastTopUpDate && (
              <div className="text-[10px] text-emerald-300/60">Last: {pettyStatus.lastTopUpDate}</div>
            )}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Total Outflow</div>
            <div className="text-lg font-bold font-mono text-rose-300">
              -₹{pettyStatus.totalOutflow.toLocaleString()}
            </div>
            {pettyStatus.lastExpenseDate && (
              <div className="text-[10px] text-emerald-300/60">Last: {pettyStatus.lastExpenseDate}</div>
            )}
          </div>
          <div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-4 py-2 rounded-xl bg-white text-emerald-950 font-semibold text-xs shadow hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              Add Cash
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Farm Expenses"
          value={`₹${(expenseSummary?.totalExpenses || 0).toLocaleString()}`}
          description="All recorded overheads"
          icon={<Receipt className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Petty Cash Outflow"
          value={`₹${(expenseSummary?.pettyCashExpensesTotal || 0).toLocaleString()}`}
          description="Cash spent on daily needs"
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title="General Overheads"
          value={`₹${(expenseSummary?.generalExpensesTotal || 0).toLocaleString()}`}
          description="Bank / invoice expenses"
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Allocated to Crops"
          value={`₹${(expenseSummary?.taggedToCropCyclesTotal || 0).toLocaleString()}`}
          description="Synced into crop P&L"
          icon={<Sprout className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/40 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === "expenses"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Expenses Register ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("petty_ledger")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === "petty_ledger"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Daily Petty Cash Ledger ({pettyLedger.length})
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === "summary"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
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
          <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Category Spend Breakdown
            </h3>
            <div className="space-y-3">
              {expenseSummary.categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{item.category}</span>
                    <span className="font-mono text-muted-foreground">
                      ₹{item.amount.toLocaleString()} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600" />
              Allocation & Tracking
            </h3>
            <div className="divide-y divide-border/40 text-xs">
              <div className="py-3 flex justify-between">
                <span className="text-muted-foreground">Total Tagged to Plots:</span>
                <span className="font-mono font-bold text-foreground">
                  ₹{expenseSummary.taggedToPlotsTotal.toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-muted-foreground">Total Tagged to Crop Cycles:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ₹{expenseSummary.taggedToCropCyclesTotal.toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-muted-foreground">General Estate Overheads:</span>
                <span className="font-mono font-bold text-foreground">
                  ₹{expenseSummary.generalExpensesTotal.toLocaleString()}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-muted-foreground">Petty Cash Disbursements:</span>
                <span className="font-mono font-bold text-amber-600">
                  ₹{expenseSummary.pettyCashExpensesTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG / EDIT EXPENSE */}
      <ExpenseModal {...page} />

      {/* MODAL: TOP UP PETTY CASH */}
      <PettyCashTopUpModal {...page} />

      {/* Official Voucher Slip Modal for Expense & Petty Cash */}
      <VoucherSlipModal
        isOpen={!!activeModalVoucher}
        onClose={() => setActiveModalVoucher(null)}
        voucher={activeModalVoucher}
      />
    </div>
  );
}
