"use client";

import React, { useCallback, useEffect, useState } from "react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCard } from "@/components/ui/content-card";
import { VoucherSlipData, VoucherSlipModal } from "@/components/voucher-slip-modal";
import { ExpenseLedgerItem, LedgerGroupItem } from "@/lib/accounting-data";
import { ExpenseUnit, OtherVoucher } from "@/lib/vouchers-data";
import {
  Calendar,
  Check,
  CheckCircle2,
  DollarSign,
  Edit2,
  Layers,
  Plus,
  Printer,
  Receipt,
  Search,
  Store,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";

export default function OtherPurchasesVoucherPage() {
  const [logs, setLogs] = useState<OtherVoucher[]>([]);
  const [ledgers, setLedgers] = useState<ExpenseLedgerItem[]>([]);
  const [groups, setGroups] = useState<LedgerGroupItem[]>([]);
  const [units, setUnits] = useState<ExpenseUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Voucher Entry
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Form Fields
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [supplierName, setSupplierName] = useState("");
  const [billDate, setBillDate] = useState("");
  const [billNo, setBillNo] = useState("");
  const [ledgerId, setLedgerId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitName, setUnitName] = useState("");
  const [amount, setAmount] = useState("");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals for inline quick-add
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState("");
  const [newLedgerGroupId, setNewLedgerGroupId] = useState("");
  const [newLedgerDescription, setNewLedgerDescription] = useState("");

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitSymbol, setNewUnitSymbol] = useState("");

  const [activeSlip, setActiveSlip] = useState<VoucherSlipData | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [logsRes, ledgersRes, groupsRes, unitsRes] = await Promise.all([
        fetch("/api/vouchers/other"),
        fetch("/api/expense-ledgers"),
        fetch("/api/ledger-groups"),
        fetch("/api/expense-units"),
      ]);

      const logsData = await logsRes.json();
      const ledgersData = await ledgersRes.json();
      const groupsData = await groupsRes.json();
      const unitsData = await unitsRes.json();

      setLogs(Array.isArray(logsData) ? logsData : []);
      setLedgers(Array.isArray(ledgersData) ? ledgersData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setUnits(Array.isArray(unitsData) ? unitsData : []);

      if (groupsData.length > 0 && !newLedgerGroupId) {
        setNewLedgerGroupId(groupsData[0].id);
      }
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setLoading(false);
    }
  }, [newLedgerGroupId]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchData();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [fetchData]);

  const openNewEntryModal = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setSupplierName("");
    setBillDate("");
    setBillNo("");
    setLedgerId("");
    setQuantity("");
    setUnitName("");
    setAmount("");
    setEditingId(null);
    setShowVoucherModal(true);
  };

  const closeVoucherModal = () => {
    setShowVoucherModal(false);
    setEditingId(null);
    setQuantity("");
    setUnitName("");
    setAmount("");
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setFeedback({ type: "error", text: "Supplier Name is required." });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setFeedback({ type: "error", text: "Please enter a valid amount." });
      return;
    }

    const selectedLedger = ledgers.find((l) => l.id === ledgerId);

    const payload = {
      voucherDate: date,
      supplierName: supplierName.trim(),
      billDate: billDate || undefined,
      billNo: billNo.trim() || undefined,
      ledgerId: ledgerId || undefined,
      particularName: selectedLedger
        ? selectedLedger.ledgerName
        : "Other Operational Expense",
      quantity: quantity ? Number(quantity) : undefined,
      unitName: unitName || undefined,
      amount: Number(amount),
      notes: undefined,
      pnlCategory:
        selectedLedger?.groupType === "EXPENSE"
          ? "Purchase"
          : "Direct Expenses",
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/vouchers/other/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update voucher");
        setFeedback({
          type: "success",
          text: "Voucher updated and recorded successfully!",
        });
      } else {
        const res = await fetch("/api/vouchers/other", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save voucher");
        setFeedback({
          type: "success",
          text: "New voucher entry recorded successfully!",
        });
      }

      closeVoucherModal();
      fetchData();
    } catch (err) {
      setFeedback({
        type: "error",
        text: getErrorMessage(err) || "An error occurred",
      });
    }
  };

  const handleEdit = (item: OtherVoucher) => {
    setEditingId(item.id);
    setDate(item.voucherDate || "");
    setSupplierName(item.supplierName || "");
    setBillDate(item.billDate || "");
    setBillNo(item.billNo || "");
    setLedgerId(item.ledgerId || "");
    setQuantity(item.quantity ? String(item.quantity) : "");
    setUnitName(item.unitName || "");
    setAmount(item.amount ? String(item.amount) : "");
    setShowVoucherModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voucher entry?")) return;
    try {
      const res = await fetch(`/api/vouchers/other/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete voucher");
      setFeedback({ type: "success", text: "Voucher deleted successfully." });
      fetchData();
    } catch (err) {
      setFeedback({ type: "error", text: getErrorMessage(err) });
    }
  };

  const handleCreateLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLedgerName.trim()) return;

    try {
      const group = groups.find((g) => g.id === newLedgerGroupId);
      const res = await fetch("/api/expense-ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ledgerName: newLedgerName.trim(),
          groupId: newLedgerGroupId,
          groupName: group?.groupName || "Direct Expenses",
          groupType: group?.groupType || "EXPENSE",
          description: newLedgerDescription.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create ledger account");
      const created = await res.json();
      setLedgers((prev) => [...prev, created]);
      setLedgerId(created.id);
      setShowLedgerModal(false);
      setNewLedgerName("");
      setNewLedgerDescription("");
      setFeedback({
        type: "success",
        text: `Ledger "${created.ledgerName}" created and selected!`,
      });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitSymbol.trim()) return;

    try {
      const res = await fetch("/api/expense-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitName: newUnitName.trim(),
          unitSymbol: newUnitSymbol.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to add new unit");
      const created = await res.json();
      setUnits((prev) => [...prev, created]);
      setUnitName(created.unitSymbol);
      setShowUnitModal(false);
      setNewUnitName("");
      setNewUnitSymbol("");
      setFeedback({
        type: "success",
        text: `Unit "${created.unitSymbol}" added and selected!`,
      });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleOpenSlip = (item: OtherVoucher) => {
    const slipData: VoucherSlipData = {
      voucherType: "OTHER",
      voucherNo: item.id
        ? `OV-${item.id.replace(/[^0-9]/g, "") || item.id}`
        : "OV-001",
      date: item.voucherDate,
      title: `${item.particularName || "Other Purchase"} Voucher`,
      category: "Other Purchases",
      partyName: item.supplierName || "Supplier / Vendor",
      partyContact: "—",
      vendorBillNo: item.billNo || "—",
      plotName: "General Estate Operations",
      cropActivityName: "Operational Expense",
      items: [
        {
          description:
            item.notes ||
            item.particularName ||
            "Other Operational Purchase",
          quantity: item.quantity || 1,
          unit: item.unitName || "nos",
          rate: item.amount,
          amount: item.amount,
        },
      ],
      subtotal: item.amount,
      totalAmount: item.amount,
      paymentMode: "Cash / Direct Payment",
      paymentStatus: "PAID",
      loggedBy: "Estate Admin",
      notes: "",
    };
    setActiveSlip(slipData);
  };

  // Filtered list
  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchesQuery =
      !q ||
      (l.supplierName || "").toLowerCase().includes(q) ||
      (l.particularName || "").toLowerCase().includes(q) ||
      (l.billNo || "").toLowerCase().includes(q);

    const matchesStart = !startDate || l.voucherDate >= startDate;
    const matchesEnd = !endDate || l.voucherDate <= endDate;

    return matchesQuery && matchesStart && matchesEnd;
  });

  const totalAmountSum = filteredLogs.reduce(
    (acc, l) => acc + (Number(l.amount) || 0),
    0
  );
  const distinctLedgersCount = Array.from(
    new Set(logs.map((l) => l.particularName).filter(Boolean))
  ).length;

  return (
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title="Other Operational Purchases"
        breadcrumbs={[
          { label: "Purchases & Expenses", href: "/purchases" },
          { label: "Operational Vouchers" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/purchases/retailers"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Retailers / Suppliers</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Register</span>
            </button>

            <button
              onClick={openNewEntryModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Other Outflow"
          value={`₹${logs
            .reduce((acc, l) => acc + (Number(l.amount) || 0), 0)
            .toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-[#174D3C]" />}
        />
        <StatCard
          title="Active Ledgers / Heads"
          value={`${distinctLedgersCount} Heads`}
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Avg. Voucher Amount"
          value={`₹${logs.length > 0
            ? Math.round(
              logs.reduce(
                (acc, l) => acc + (Number(l.amount) || 0),
                0
              ) / logs.length
            ).toLocaleString()
            : 0
            }`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Current Query Total"
          value={`₹${totalAmountSum.toLocaleString()}`}
          icon={<Receipt className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${feedback.type === "success"
            ? "bg-[#EAF3EE] text-[#174D3C] border-[#174D3C]/20"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#174D3C] shrink-0" />
            ) : (
              <X className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* VOUCHER REGISTER TABLE */}
      <ContentCard
        title={`Other Purchases Voucher Register (${filteredLogs.length})`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor, particular, bill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-[#174D3C]"
              />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-[#174D3C]"
              />
            </div>

            {(search || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 ml-1"
              >
                Reset
              </button>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier / Payee</th>
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Particular / Ledger</th>
                <th className="py-3 px-4">Quantity & Unit</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    Loading vouchers...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <p className="font-medium text-slate-600">
                      No vouchers recorded matching current filters.
                    </p>
                    <button
                      onClick={openNewEntryModal}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] text-white font-semibold text-xs rounded-lg hover:bg-[#103C30] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Record First Voucher
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {item.voucherDate}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.supplierName || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.billNo || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#174D3C]">
                      {item.particularName || "Other Operational"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.quantity
                        ? `${item.quantity} ${item.unitName || ""}`
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right whitespace-nowrap">
                      ₹{Number(item.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSlip(item)}
                          className="p-1.5 text-slate-500 hover:text-[#174D3C] hover:bg-[#EAF3EE] rounded-lg transition-colors"
                          title="Print / View Voucher Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-[#174D3C] hover:bg-[#EAF3EE] rounded-lg transition-colors"
                          title="Edit Voucher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete Voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredLogs.length > 0 && (
              <tfoot className="bg-[#F8FAFC] font-semibold border-t border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-3 px-4 uppercase tracking-wider text-right text-xs">
                    Total Voucher Outflow:
                  </td>
                  <td className="py-3 px-4 text-[#174D3C] text-sm font-mono font-bold text-right whitespace-nowrap">
                    ₹{totalAmountSum.toLocaleString()}
                  </td>
                  <td colSpan={1}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </ContentCard>

      {/* THE VOUCHER MODAL DIALOG */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-3xl w-full my-auto">
            {/* Header */}
            <div className="bg-[#174D3C] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-[#EAF3EE]" />
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    ESTATE VOUCHERS
                  </h2>
                  <div className="text-xs text-[#EAF3EE] font-medium">
                    Voucher Type: OTHER OPERATIONAL
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-white/10 text-white font-semibold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {editingId ? "EDIT ENTRY" : "NEW ENTRY"}
                </span>
                <button
                  type="button"
                  onClick={closeVoucherModal}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voucher Form Body */}
            <form onSubmit={handleSaveVoucher} className="p-6 space-y-5 text-xs">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    DATE <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    SUPPLIER NAME <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agri Mart, Local Vendor"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    BILL DATE
                  </label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    BILL NO
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-001"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    LEDGER ACCOUNT <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={ledgerId}
                    onChange={(e) => setLedgerId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                  >
                    <option value="">— Select Ledger Account —</option>
                    {ledgers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.ledgerName} ({l.groupName || "Expense"})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowLedgerModal(true)}
                    className="text-[#174D3C] hover:underline text-[11px] font-semibold flex items-center gap-1 mt-1"
                  >
                    + Create new ledger account
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    QUANTITY <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 5.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    UNIT OF MEASURE
                  </label>
                  <select
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                  >
                    <option value="">— Select Unit —</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.unitSymbol}>
                        {u.unitSymbol} ({u.unitName})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowUnitModal(true)}
                    className="text-[#174D3C] hover:underline text-[11px] font-semibold flex items-center gap-1 mt-1"
                  >
                    + Add new unit
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    TOTAL AMOUNT (₹) <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-[#F8FAFC] overflow-hidden focus-within:border-[#174D3C]">
                    <span className="px-3 py-2 text-slate-500 font-bold bg-slate-100 border-r border-slate-200">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-transparent text-slate-900 font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeVoucherModal}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-lg bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingId ? "Update & Record Voucher" : "Save Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL: CREATE NEW LEDGER ACCOUNT */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Create New Ledger Account
              </h3>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLedger} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ledger Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Irrigation Repair & Spares"
                  value={newLedgerName}
                  onChange={(e) => setNewLedgerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ledger Group *
                </label>
                <select
                  required
                  value={newLedgerGroupId}
                  onChange={(e) => setNewLedgerGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName} ({g.groupType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLedgerModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold transition-colors shadow-xs"
                >
                  Save Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL: ADD NEW UNIT OF MEASURE */}
      {showUnitModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Add New Unit of Measure
              </h3>
              <button
                onClick={() => setShowUnitModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Unit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boxes / Packets"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Unit Symbol / Abbreviation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. box, pkt, bundles"
                  value={newUnitSymbol}
                  onChange={(e) => setNewUnitSymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold transition-colors shadow-xs"
                >
                  Add Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Voucher Slip Modal */}
      <VoucherSlipModal
        isOpen={Boolean(activeSlip)}
        onClose={() => setActiveSlip(null)}
        voucher={activeSlip}
      />
    </PageContainer>
  );
}
