"use client";

import type { VoucherSlipData } from "@/components/voucher-slip-modal";
import type {
  CropCycleItem,
  ExpenseCategory,
  GeneralExpenseItem,
  PettyCashLedgerItem,
} from "@/types/storage";
import type { PlotItem } from "@/types/estate";
import type { ExpenseReportSummary, PettyCashStatus } from "@/lib/expenses-data";
import React, { useCallback, useEffect, useState } from "react";



export function useExpensesPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<"expenses" | "petty_ledger" | "summary">("expenses");
  const [expenseViewMode, setExpenseViewMode] = useState<"cards" | "table">("cards");
  const [pettyViewMode, setPettyViewMode] = useState<"cards" | "table">("cards");

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
  const [activeModalVoucher, setActiveModalVoucher] = useState<VoucherSlipData | null>(null);

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
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchData();
      })();
    }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
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

  const openExpenseVoucher = (exp: GeneralExpenseItem) => {
    const vchNo = exp.receiptRef && exp.receiptRef.trim() !== ""
      ? exp.receiptRef
      : `EXP-VCH-${exp.id.slice(-6).toUpperCase()}`;

    const voucher: VoucherSlipData = {
      voucherType: "EXPENSE",
      voucherNo: vchNo,
      date: exp.date,
      title: `${exp.category} Expense Payment Voucher`,
      category: exp.category,
      partyName: exp.paidBy && exp.paidBy.trim() !== "" ? exp.paidBy : "Estate Operations / Payee",
      partyAddress: "Estate Field Office, Tamil Nadu",
      vendorBillNo: exp.receiptRef || undefined,
      plotName: exp.plotName || "General Estate (Overheads)",
      cropActivityName: exp.cropName || (exp.cropCycleId ? "Crop Cycle Allocation" : "General Administration"),
      items: [
        {
          id: exp.id,
          description: exp.description || `${exp.category} Expense Payment`,
          quantity: 1,
          unit: "entry",
          rate: Number(exp.amount) || 0,
          amount: Number(exp.amount) || 0,
        },
      ],
      subtotal: Number(exp.amount) || 0,
      totalAmount: Number(exp.amount) || 0,
      paymentMode: exp.category === "PETTY_CASH" ? "Petty Cash" : "Cash / Bank Transfer",
      paymentStatus: "PAID",
      referenceNo: exp.receiptRef || exp.id,
      loggedBy: "Estate Accounts",
      notes: exp.description,
    };
    setActiveModalVoucher(voucher);
  };

  const openPettyCashVoucher = (row: PettyCashLedgerItem) => {
    const isTopUp = row.amountIn > 0;
    const vchAmount = isTopUp ? row.amountIn : row.amountOut;
    const vchNo = `PC-VCH-${row.date.replace(/-/g, "")}-${row.id.slice(-4).toUpperCase()}`;

    const voucher: VoucherSlipData = {
      voucherType: "PETTY_CASH",
      voucherNo: vchNo,
      date: row.date,
      title: isTopUp ? "Petty Cash Imprest / Top-Up Voucher" : "Petty Cash Daily Outflow Voucher",
      category: "Petty Cash Ledger",
      partyName: isTopUp ? "Farm Imprest Replenishment (Cash Received)" : "Daily Field & Farm Cash Disbursals",
      partyAddress: "Central Estate Cash Desk",
      plotName: "Central Estate Office",
      cropActivityName: "Daily Petty Cash Register",
      items: [
        {
          id: row.id,
          description: row.notes || (isTopUp ? "Petty cash fund replenishment" : "Cumulative day disbursement for routine field operations"),
          quantity: 1,
          unit: "day-trans",
          rate: vchAmount,
          amount: vchAmount,
        },
      ],
      subtotal: vchAmount,
      totalAmount: vchAmount,
      paymentMode: "Cash in Hand",
      paymentStatus: "PAID",
      referenceNo: row.id,
      loggedBy: "Petty Cash Custodian",
      notes: `Day Opening Balance: ₹${row.openingBalance.toLocaleString()} | Day Closing Balance: ₹${row.closingBalance.toLocaleString()} | Remarks: ${row.notes || "Recorded in Day Book"}`,
    };
    setActiveModalVoucher(voucher);
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

  return {
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
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    plotFilter,
    setPlotFilter,
    plots,
    totalFilteredAmount,
    setExpenseViewMode,
    expenseViewMode,
    filteredExpenses,
    openExpenseVoucher,
    openEditExpenseModal,
    handleDeleteExpense,
    setPettyViewMode,
    pettyViewMode,
    openPettyCashVoucher,
    showExpenseModal,
    editingExpense,
    setShowExpenseModal,
    handleExpenseSubmit,
    expenseForm,
    setExpenseForm,
    cropCycles,
    showTopUpModal,
    handleTopUpSubmit,
    topUpForm,
    setTopUpForm,
    activeModalVoucher,
    setActiveModalVoucher,
  };
}

export type ExpensesPageState = ReturnType<typeof useExpensesPage>;
