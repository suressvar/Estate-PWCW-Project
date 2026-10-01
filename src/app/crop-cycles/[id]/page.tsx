"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CircleDollarSign,
  Plus,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Receipt,
  FileText,
  Trash2,
  Sparkles,
  Layers,
  ChevronRight,
  Clock,
  Sprout,
  Package,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import {
  CropCycleItem,
  CropExpenseItem,
  CropIncomeItem,
  CropCycleStatus,
  CropExpenseCategory,
  CropIncomeSource,
} from "@/lib/db-storage";
import { CropCycleFinancialSummary } from "@/lib/crop-cycle-data";

const EXPENSE_CATEGORIES: { label: string; value: CropExpenseCategory; color: string }[] = [
  { label: "Seeds & Saplings", value: "SEEDS", color: "bg-emerald-500" },
  { label: "Fertilizers & Nutrients", value: "FERTILIZER", color: "bg-teal-500" },
  { label: "Pesticides & Sprays", value: "PESTICIDE", color: "bg-amber-500" },
  { label: "Field Labor", value: "LABOR", color: "bg-blue-500" },
  { label: "Machinery & Fuel", value: "MACHINERY", color: "bg-indigo-500" },
  { label: "Irrigation & Water", value: "IRRIGATION", color: "bg-cyan-500" },
  { label: "Transport & Cartage", value: "TRANSPORT", color: "bg-purple-500" },
  { label: "Miscellaneous", value: "MISC", color: "bg-slate-500" },
];

const INCOME_SOURCES: { label: string; value: CropIncomeSource; color: string }[] = [
  { label: "Market / Mandi Sale", value: "MARKET_SALE", color: "bg-emerald-600" },
  { label: "Direct Buyer / Retailer", value: "DIRECT_BUYER", color: "bg-teal-600" },
  { label: "Government Subsidy / Scheme", value: "GOVERNMENT_SCHEME", color: "bg-indigo-600" },
  { label: "Other Receipts", value: "OTHER", color: "bg-slate-600" },
];

export default function CropCycleDetailPage() {
  const routeParams = useParams();
  const id = (routeParams?.id as string) || "";

  const [cycle, setCycle] = useState<CropCycleItem | null>(null);
  const [financials, setFinancials] = useState<CropCycleFinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<CropExpenseItem[]>([]);
  const [incomes, setIncomes] = useState<CropIncomeItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<{ id: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "incomes" | "timeline">("expenses");
  const [actionAlert, setActionAlert] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expCategory, setExpCategory] = useState<CropExpenseCategory>("SEEDS");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [expDesc, setExpDesc] = useState<string>("");
  const [expDailyLogId, setExpDailyLogId] = useState<string>("");
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Income Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incSource, setIncSource] = useState<CropIncomeSource>("MARKET_SALE");
  const [incQuantity, setIncQuantity] = useState<string>("");
  const [incUnit, setIncUnit] = useState<string>("kg");
  const [incRate, setIncRate] = useState<string>("");
  const [incDate, setIncDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [incBuyer, setIncBuyer] = useState<string>("");
  const [incInvoice, setIncInvoice] = useState<string>("");
  const [isSubmittingIncome, setIsSubmittingIncome] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchCycleData = useCallback(async () => {
    try {
      if (!cycle) {
        setLoading(true);
      }
      const res = await fetch(`/api/crop-cycles/${id}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setCycle(data.cycle);
        setFinancials(data.financials);
        setExpenses(data.expenses || []);
        setIncomes(data.incomes || []);

        // Load daily logs for plot to enable linking
        if (data.cycle?.plotId) {
          const dlRes = await fetch(`/api/daily-log?plotId=${data.cycle.plotId}&skipAuto=true`, {
            cache: "no-store",
          });
          if (dlRes.ok) {
            const dlData = await dlRes.json();
            setDailyLogs(dlData);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load crop cycle details", e);
    } finally {
      setLoading(false);
    }
  }, [id, cycle]);

  useEffect(() => {
    fetchCycleData();
  }, [fetchCycleData]);

  // Update Status
  const handleStatusChange = async (newStatus: CropCycleStatus) => {
    try {
      const res = await fetch(`/api/crop-cycles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCycle(updated);
        setActionAlert({ type: "success", text: `Cycle status updated to ${newStatus}` });
        fetchCycleData();
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  // Sync operations
  const handleSyncOperations = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/crop-cycles/${id}/sync-operations`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setActionAlert({
          type: "success",
          text: `Auto-pulled ${data.syncedCount} operational labor & machine entries (₹${data.totalExpensesAdded.toLocaleString()})!`,
        });
        fetchCycleData();
      } else {
        setActionAlert({ type: "error", text: data.error || "Failed to sync operations." });
      }
    } catch (e: any) {
      setActionAlert({ type: "error", text: e.message || "Error syncing operations." });
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0 || !expDesc.trim()) {
      setActionAlert({ type: "error", text: "Please enter a valid amount and description." });
      return;
    }

    try {
      setIsSubmittingExpense(true);
      const res = await fetch(`/api/crop-cycles/${id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: expCategory,
          amount: Number(expAmount),
          date: expDate,
          description: expDesc,
          linkedDailyLogId: expDailyLogId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsExpenseModalOpen(false);
        setExpAmount("");
        setExpDesc("");
        setExpDailyLogId("");
        if (data.expense) {
          setExpenses((prev) => [data.expense, ...prev.filter((e) => e.id !== data.expense.id)]);
        }
        if (data.financials) {
          setFinancials(data.financials);
        }
        if (data.warning) {
          setActionAlert({ type: "warning", text: data.warning });
        } else {
          setActionAlert({ type: "success", text: "Expense recorded in cycle ledger." });
        }
        fetchCycleData();
      } else {
        setActionAlert({ type: "error", text: data.error || "Failed to log expense." });
      }
    } catch (e: any) {
      setActionAlert({ type: "error", text: e.message || "Error logging expense." });
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Submit Income
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(incQuantity);
    const rate = Number(incRate);
    if (qty <= 0 || rate <= 0) {
      setActionAlert({ type: "error", text: "Quantity and rate must be greater than zero." });
      return;
    }

    try {
      setIsSubmittingIncome(true);
      const res = await fetch(`/api/crop-cycles/${id}/incomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: incSource,
          quantitySold: qty,
          unit: incUnit,
          ratePerUnit: rate,
          date: incDate,
          buyerName: incBuyer,
          invoiceNo: incInvoice,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsIncomeModalOpen(false);
        setIncQuantity("");
        setIncRate("");
        setIncBuyer("");
        setIncInvoice("");
        if (data.income) {
          setIncomes((prev) => [data.income, ...prev.filter((i) => i.id !== data.income.id)]);
        }
        if (data.financials) {
          setFinancials(data.financials);
        }
        setActiveTab("incomes");
        if (data.warning) {
          setActionAlert({ type: "warning", text: data.warning });
        } else {
          setActionAlert({ type: "success", text: "Harvest sales income recorded." });
        }
        fetchCycleData();
      } else {
        setActionAlert({ type: "error", text: data.error || "Failed to log income." });
      }
    } catch (e: any) {
      setActionAlert({ type: "error", text: e.message || "Error logging income." });
    } finally {
      setIsSubmittingIncome(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/crop-cycles/${id}/expenses?expenseId=${expenseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActionAlert({ type: "success", text: "Expense removed." });
        fetchCycleData();
      }
    } catch (e) {
      console.error("Failed to delete expense", e);
    }
  };

  // Delete Income
  const handleDeleteIncome = async (incomeId: string) => {
    if (!confirm("Are you sure you want to delete this sales income entry?")) return;
    try {
      const res = await fetch(`/api/crop-cycles/${id}/incomes?incomeId=${incomeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActionAlert({ type: "success", text: "Income entry removed." });
        fetchCycleData();
      }
    } catch (e) {
      console.error("Failed to delete income", e);
    }
  };

  if (loading || !cycle) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-sm font-bold">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
        Loading Crop Cycle Financial Ledger...
      </div>
    );
  }

  const totalExpenses = financials?.totalExpenses || 0;
  const totalIncome = financials?.totalIncome || 0;
  const netProfitLoss = financials?.netProfitLoss || 0;
  const isProfitable = netProfitLoss >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/crop-cycles"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Crop Cycles Overview</span>
        </Link>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          id="cycle-feedback-alert"
          className={`p-4 rounded-2xl flex items-center justify-between shadow-xs transition-all ${
            actionAlert.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : actionAlert.type === "warning"
              ? "bg-amber-50 text-amber-900 border border-amber-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : actionAlert.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <X className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{actionAlert.text}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-[#14532D] to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                {cycle.plotName}
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                Sown: {cycle.sowingDate}
              </span>
            </div>
            <h1 id="cycle-detail-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {cycle.cropName}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl">
              Seed-to-harvest ledger &bull;{" "}
              {cycle.actualHarvestDate ? `Harvested on ${cycle.actualHarvestDate}` : `Target harvest: ${cycle.expectedHarvestDate}`}
              {cycle.notes ? ` &bull; ${cycle.notes}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector */}
            <div className="bg-emerald-900/80 rounded-xl p-1 border border-emerald-700/60 flex items-center gap-1.5 text-xs font-bold">
              <span className="pl-2 text-emerald-300 text-[11px] uppercase tracking-wider">Status:</span>
              <select
                id="cycle-status-dropdown"
                value={cycle.status}
                onChange={(e) => handleStatusChange(e.target.value as CropCycleStatus)}
                className="bg-emerald-950 px-3 py-1.5 rounded-lg text-white font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="SOWN">Sown</option>
                <option value="GROWING">Growing</option>
                <option value="HARVESTED">Harvested</option>
                <option value="SOLD">Sold</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Sync Operational Costs button */}
            <button
              id="sync-operations-btn"
              onClick={handleSyncOperations}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 shadow-sm transition-all disabled:opacity-50"
              title="Auto-pull labor and machinery usage costs matching this plot and timeframe"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-cyan-300 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Operational Costs"}</span>
            </button>

            {/* Log Expense Button */}
            <button
              id="add-expense-modal-btn"
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>

            {/* Log Income Button */}
            <button
              id="add-income-modal-btn"
              onClick={() => setIsIncomeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Log Harvest Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* P&L Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString()}`}
          subtitle={`${expenses.length} ledger entries`}
        />
        <StatCard
          title="Total Harvest Revenue"
          value={`₹${totalIncome.toLocaleString()}`}
          subtitle={`${incomes.length} sales entries`}
        />
        <StatCard
          title="Net Profit / Loss"
          value={`₹${netProfitLoss.toLocaleString()}`}
          isPositive={isProfitable}
          change={isProfitable ? "PROFIT" : "NET LOSS"}
        />
        <StatCard
          title="Financial Return"
          value={`${financials?.roiPercent || 0}%`}
          subtitle={`Margin: ${financials?.profitMarginPercent || 0}%`}
          isPositive={(financials?.roiPercent || 0) >= 0}
        />
      </div>

      {/* Visual Analytics & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown (Custom SVG/Tailwind Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Receipt className="w-4 h-4 text-rose-600" />
              <span>Expense Breakdown by Category</span>
            </div>
            <span className="text-xs font-bold text-slate-600">₹{totalExpenses.toLocaleString()} Total</span>
          </div>

          {financials?.expenseBreakdown && financials.expenseBreakdown.length > 0 ? (
            <div className="space-y-3 pt-1">
              {financials.expenseBreakdown.map((item) => {
                const catDef = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-bold">{catDef?.label || item.category}</span>
                      <span className="text-slate-900 font-bold">
                        ₹{item.amount.toLocaleString()}{" "}
                        <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${catDef?.color || "bg-emerald-600"} transition-all duration-500`}
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-8 italic">
              No expenses recorded yet. Click &ldquo;Log Expense&rdquo; or &ldquo;Sync Operational Costs&rdquo;.
            </p>
          )}
        </div>

        {/* Income Sources Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <CircleDollarSign className="w-4 h-4 text-emerald-600" />
              <span>Income Breakdown by Source</span>
            </div>
            <span className="text-xs font-bold text-emerald-700">₹{totalIncome.toLocaleString()} Total</span>
          </div>

          {financials?.incomeBreakdown && financials.incomeBreakdown.length > 0 ? (
            <div className="space-y-3 pt-1">
              {financials.incomeBreakdown.map((item) => {
                const srcDef = INCOME_SOURCES.find((s) => s.value === item.source);
                return (
                  <div key={item.source} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-bold">{srcDef?.label || item.source}</span>
                      <span className="text-slate-900 font-bold">
                        ₹{item.amount.toLocaleString()}{" "}
                        <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${srcDef?.color || "bg-emerald-600"} transition-all duration-500`}
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-8 italic">
              No harvest sales income recorded yet. Click &ldquo;Log Harvest Sale&rdquo;.
            </p>
          )}
        </div>
      </div>

      {/* Ledger Entries Section & Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Controls */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 border-b border-slate-200">
          <button
            id="tab-btn-expenses"
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "expenses"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Expense Ledger ({expenses.length})
          </button>
          <button
            id="tab-btn-incomes"
            onClick={() => setActiveTab("incomes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "incomes"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Income Ledger ({incomes.length})
          </button>
          <button
            id="tab-btn-timeline"
            onClick={() => setActiveTab("timeline")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "timeline"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Seed-to-Harvest Timeline ({financials?.timeline.length || 0})
          </button>
        </div>

        {/* Tab 1: Expense Ledger */}
        {activeTab === "expenses" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="expenses-table">
              <thead>
                <tr className="bg-slate-50/60 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Daily Log Link</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-900 font-semibold">{exp.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{exp.description}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {exp.linkedDailyLogId ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Linked Log
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{Number(exp.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No expense entries recorded in this cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Income Ledger */}
        {activeTab === "incomes" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="incomes-table">
              <thead>
                <tr className="bg-slate-50/60 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sales Source</th>
                  <th className="py-3 px-4">Buyer / Invoice</th>
                  <th className="py-3 px-4 text-right">Quantity & Rate</th>
                  <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {incomes.length > 0 ? (
                  incomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-900 font-semibold">{inc.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {inc.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">
                        {inc.buyerName || "Direct Market"}
                        {inc.invoiceNo && <span className="text-slate-400 text-[10px] block">Inv: {inc.invoiceNo}</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {inc.quantitySold} {inc.unit} @ ₹{inc.ratePerUnit}/{inc.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">
                        ₹{Number(inc.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteIncome(inc.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete income"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No sales income entries recorded for this cycle yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Seed-to-Harvest Timeline */}
        {activeTab === "timeline" && (
          <div className="p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Chronological Cycle Progression
            </h4>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
              {financials?.timeline.map((item) => (
                <div key={item.id} className="relative pl-6">
                  {/* Indicator Dot */}
                  <div
                    className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                      item.type === "SOWING"
                        ? "bg-emerald-600"
                        : item.type === "HARVEST"
                        ? "bg-teal-600"
                        : item.type === "INCOME"
                        ? "bg-sky-600"
                        : "bg-rose-500"
                    }`}
                  />
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-mono text-slate-400 block">{item.date}</span>
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-800">{item.title}</h5>
                      {item.amount !== undefined && (
                        <span
                          className={`text-xs font-extrabold ${
                            item.type === "INCOME" ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {item.type === "INCOME" ? "+" : "-"}₹{item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {item.subtitle && <p className="text-xs text-slate-500">{item.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Log Crop Cycle Expense</h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Expense Category *</label>
                <select
                  id="expense-cat-select"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as CropExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Amount (₹) *</label>
                <input
                  id="expense-amount-input"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4500"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Date *</label>
                <input
                  id="expense-date-input"
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description / Details *</label>
                <input
                  id="expense-desc-input"
                  type="text"
                  required
                  placeholder="e.g. 5 bags urea, seedling purchase, tractor plowing..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Link to Daily Log (Optional)</label>
                <select
                  id="expense-daily-log-select"
                  value={expDailyLogId}
                  onChange={(e) => setExpDailyLogId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">-- No linked daily log --</option>
                  {dailyLogs.map((dl) => (
                    <option key={dl.id} value={dl.id}>
                      Daily Log: {dl.date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-expense-btn"
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmittingExpense ? "Recording..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Income Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CircleDollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Log Harvest Sale Income</h3>
              </div>
              <button
                onClick={() => setIsIncomeModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Sales Channel / Source *</label>
                <select
                  id="income-source-select"
                  value={incSource}
                  onChange={(e) => setIncSource(e.target.value as CropIncomeSource)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {INCOME_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quantity Sold *</label>
                  <input
                    id="income-qty-input"
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1500"
                    value={incQuantity}
                    onChange={(e) => setIncQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Unit *</label>
                  <input
                    id="income-unit-input"
                    type="text"
                    required
                    placeholder="kg, tons, boxes"
                    value={incUnit}
                    onChange={(e) => setIncUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Rate per Unit (₹) *</label>
                  <input
                    id="income-rate-input"
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 22"
                    value={incRate}
                    onChange={(e) => setIncRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Computed Total</label>
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-emerald-700">
                    ₹
                    {(
                      (Number(incQuantity) || 0) * (Number(incRate) || 0)
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Date *</label>
                <input
                  id="income-date-input"
                  type="date"
                  required
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Buyer Name</label>
                  <input
                    id="income-buyer-input"
                    type="text"
                    placeholder="e.g. Reliance Fresh, Local Mandi"
                    value={incBuyer}
                    onChange={(e) => setIncBuyer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Invoice / Bill No.</label>
                  <input
                    id="income-invoice-input"
                    type="text"
                    placeholder="e.g. INV-2026-09"
                    value={incInvoice}
                    onChange={(e) => setIncInvoice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-income-btn"
                  type="submit"
                  disabled={isSubmittingIncome}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmittingIncome ? "Recording..." : "Record Harvest Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
