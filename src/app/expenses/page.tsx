"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  Receipt,
  Plus,
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  CreditCard,
  MapPin,
  Sprout,
  BarChart3,
  FileText,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import {
  GeneralExpenseItem,
  PettyCashLedgerItem,
  ExpenseCategory,
  PlotItem,
  CropCycleItem,
} from "@/lib/db-storage";
import { PettyCashStatus, ExpenseReportSummary } from "@/lib/expenses-data";

export default function ExpensesAndPettyCashPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<"expenses" | "petty_ledger" | "summary">("expenses");

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [plotFilter, setPlotFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data States
  const [expenses, setExpenses] = useState<GeneralExpenseItem[]>([]);
  const [pettyLedger, setPettyLedger] = useState<PettyCashLedgerItem[]>([]);
  const [pettyStatus, setPettyStatus] = useState<PettyCashStatus>({
    currentBalance: 0,
    totalInflow: 0,
    totalOutflow: 0,
    ledgerCount: 0,
  });
  const [expenseSummary, setExpenseSummary] = useState<ExpenseReportSummary | null>(null);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [cropCycles, setCropCycles] = useState<CropCycleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<GeneralExpenseItem | null>(null);

  // Form States for Expense
  const [expenseForm, setExpenseForm] = useState<{
    category: ExpenseCategory;
    amount: string;
    date: string;
    description: string;
    plotId: string;
    cropCycleId: string;
    paidBy: string;
    receiptRef: string;
  }>({
    category: "GENERAL",
    amount: "",
    date: todayStr,
    description: "",
    plotId: "",
    cropCycleId: "",
    paidBy: "",
    receiptRef: "",
  });

  // Form States for Top-up
  const [topUpForm, setTopUpForm] = useState<{
    amount: string;
    date: string;
    notes: string;
  }>({
    amount: "5000",
    date: todayStr,
    notes: "Main cash withdrawal for daily farm operations",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, pettyRes, sumRes, plotRes, cycleRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/expenses/petty-cash"),
        fetch("/api/expenses?summary=true"),
        fetch("/api/plots"),
        fetch("/api/crop-cycles"),
      ]);

      const [expData, pettyData, sumData, plotData, cycleData] = await Promise.all([
        expRes.json(),
        pettyRes.json(),
        sumRes.json(),
        plotRes.json(),
        cycleRes.json(),
      ]);

      if (expData.success) setExpenses(expData.data);
      if (pettyData.success) {
        setPettyStatus(pettyData.data.status);
        setPettyLedger(pettyData.data.ledger);
      }
      if (sumData.success) setExpenseSummary(sumData.data);
      if (plotData.success) setPlots(plotData.data);
      if (cycleData.success) setCropCycles(cycleData.data);
    } catch (err) {
      console.error("Failed to load expenses data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Expense Submit
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.date || !expenseForm.description) {
      alert("Please enter amount, date, and description.");
      return;
    }

    try {
      const payload = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount) || 0,
        plotId: expenseForm.plotId || undefined,
        cropCycleId: expenseForm.cropCycleId || undefined,
      };

      const res = await fetch("/api/expenses", {
        method: editingExpense ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingExpense ? { id: editingExpense.id, ...payload } : payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowExpenseModal(false);
        setEditingExpense(null);
        fetchData();
      } else {
        alert(data.error || "Failed to record expense");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving expense");
    }
  };

  // Handle Top-Up Submit
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(topUpForm.amount);
    if (!amountNum || amountNum <= 0) {
      alert("Please enter a valid top-up amount.");
      return;
    }

    try {
      const res = await fetch("/api/expenses/petty-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          date: topUpForm.date,
          notes: topUpForm.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowTopUpModal(false);
        fetchData();
      } else {
        alert(data.error || "Failed to top up petty cash");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing top up");
    }
  };

  // Handle Expense Delete
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense? Any linked crop expense will also be removed.")) {
      return;
    }
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete expense");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Open Modal helpers
  const openNewExpenseModal = (category: ExpenseCategory = "GENERAL") => {
    setEditingExpense(null);
    setExpenseForm({
      category,
      amount: "",
      date: todayStr,
      description: "",
      plotId: "",
      cropCycleId: "",
      paidBy: "",
      receiptRef: "",
    });
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (item: GeneralExpenseItem) => {
    setEditingExpense(item);
    setExpenseForm({
      category: item.category,
      amount: String(item.amount),
      date: item.date,
      description: item.description,
      plotId: item.plotId || "",
      cropCycleId: item.cropCycleId || "",
      paidBy: item.paidBy || "",
      receiptRef: item.receiptRef || "",
    });
    setShowExpenseModal(true);
  };

  // Filtered Expenses
  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    if (plotFilter !== "ALL" && e.plotId !== plotFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchPaid = (e.paidBy || "").toLowerCase().includes(q);
      const matchPlot = (e.plotName || "").toLowerCase().includes(q);
      const matchRef = (e.receiptRef || "").toLowerCase().includes(q);
      if (!matchDesc && !matchPaid && !matchPlot && !matchRef) return false;
    }
    return true;
  });

  const totalFilteredAmount = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

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
          <p className="text-sm text-muted-foreground mt-1">
            Track estate overheads, running petty cash balance, daily top-ups and disbursements, with auto P&L sync.
          </p>
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
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "expenses"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Expenses Register ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("petty_ledger")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "petty_ledger"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Daily Petty Cash Ledger ({pettyLedger.length})
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "summary"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Category Breakdown & Analytics
        </button>
      </div>

      {/* TAB 1: EXPENSES REGISTER */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search description, payee, receipt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Categories</option>
                <option value="GENERAL">General</option>
                <option value="PETTY_CASH">Petty Cash</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="ADMIN">Admin</option>
                <option value="OTHER">Other</option>
              </select>

              <select
                value={plotFilter}
                onChange={(e) => setPlotFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Plots</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted-foreground self-end md:self-center">
              Total Filtered:{" "}
              <span className="font-bold text-foreground font-mono">
                ₹{totalFilteredAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Plot / Crop</th>
                    <th className="py-3 px-4">Paid By</th>
                    <th className="py-3 px-4">Receipt / Bill Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Crop Sync</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-muted-foreground">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No expenses found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                          {exp.date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                              exp.category === "PETTY_CASH"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : exp.category === "MAINTENANCE"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-foreground font-medium" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-foreground">{exp.plotName || "—"}</div>
                          {exp.cropName && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              {exp.cropName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {exp.paidBy || "Estate Cash"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-muted-foreground text-[11px]">
                          {exp.receiptRef || "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-foreground font-mono">
                          ₹{Number(exp.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {exp.cropCycleId ? (
                            <span
                              title={`Synced under MISC in Crop Ledger`}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Synced
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-[11px]">Overhead</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => openEditExpenseModal(exp)}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-muted-foreground hover:text-rose-600 rounded"
                            title="Delete Expense"
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
        </div>
      )}

      {/* TAB 2: DAILY PETTY CASH LEDGER */}
      {activeTab === "petty_ledger" && (
        <div className="space-y-4">
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Chronological Petty Cash Day Book & Running Balance
                </h3>
                <p className="text-xs text-muted-foreground">
                  Opening balance + cash added - petty disbursements = closing balance per date.
                </p>
              </div>
              <button
                onClick={async () => {
                  await fetch("/api/expenses/petty-cash", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "recalculate" }),
                  });
                  fetchData();
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 border border-border px-2.5 py-1 rounded-lg bg-card hover:bg-muted"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recompute Forward Balance
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Opening Balance</th>
                    <th className="py-3 px-4 text-right text-emerald-600">Amount In (Top-ups)</th>
                    <th className="py-3 px-4 text-right text-rose-600">Amount Out (Disbursed)</th>
                    <th className="py-3 px-4 text-right font-bold text-foreground">Closing Balance</th>
                    <th className="py-3 px-4">Day Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pettyLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground">
                        <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No petty cash transactions recorded yet. Click "Top Up Petty Cash" to start.
                      </td>
                    </tr>
                  ) : (
                    pettyLedger.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                          {row.date}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-muted-foreground">
                          ₹{row.openingBalance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.amountIn > 0 ? `+₹${row.amountIn.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {row.amountOut > 0 ? `-₹${row.amountOut.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-foreground">
                          ₹{row.closingBalance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-sm truncate text-[11px]" title={row.notes || ""}>
                          {row.notes || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {editingExpense ? "Edit Expense Entry" : "Record Farm Expense"}
              </h2>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="GENERAL">General Expense</option>
                    <option value="PETTY_CASH">Petty Cash (Cash on hand)</option>
                    <option value="MAINTENANCE">Maintenance / Repairs</option>
                    <option value="ADMIN">Administrative & Office</option>
                    <option value="OTHER">Other Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Date *</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 750"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Paid By / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Field Supervisor, Cashier"
                    value={expenseForm.paidBy}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Description / Particulars *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Purchased PVC irrigation connectors, emergency diesel purchase, tea refreshments for workers..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Plot Link</label>
                  <select
                    value={expenseForm.plotId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, plotId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">General Estate / None</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Crop Cycle (Auto P&L Sync)</label>
                  <select
                    value={expenseForm.cropCycleId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, cropCycleId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">None (General Overhead)</option>
                    {cropCycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.plotName} - {c.cropName} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Receipt / Voucher Ref No.</label>
                <input
                  type="text"
                  placeholder="e.g. REC-2026-088, UPI-992102"
                  value={expenseForm.receiptRef}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receiptRef: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              {expenseForm.category === "PETTY_CASH" && (
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  ℹ️ <strong>Petty Cash Integration:</strong> This transaction will automatically deduct from the petty cash drawer on <strong>{expenseForm.date}</strong> and recompute closing balances.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
                >
                  {editingExpense ? "Save Changes" : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOP UP PETTY CASH */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Top Up Petty Cash Drawer
              </h2>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Amount to Add (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 5000"
                  value={topUpForm.amount}
                  onChange={(e) => setTopUpForm({ ...topUpForm, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono text-base font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Date *</label>
                <input
                  type="date"
                  value={topUpForm.date}
                  onChange={(e) => setTopUpForm({ ...topUpForm, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Notes / Source</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cash withdrawal from SBI current account, ATM debit..."
                  value={topUpForm.notes}
                  onChange={(e) => setTopUpForm({ ...topUpForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                ✅ Instant Cash Replenishment: This adds directly to the running opening balance of subsequent days.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
                >
                  Confirm Top Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
