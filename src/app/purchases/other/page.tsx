"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  PlusCircle,
  X,
  Tag,
  DollarSign,
  Receipt,
  Layers,
  ArrowLeft,
  Check,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { ExpenseLedgerItem, LedgerGroupItem } from "@/lib/accounting-data";
import { ExpenseUnit, OtherVoucher } from "@/lib/vouchers-data";
import { VoucherSlipModal, VoucherSlipData } from "@/components/voucher-slip-modal";
import { StatCard } from "@/components/ui/stat-card";

export default function OtherPurchasesVoucherPage() {
  const [logs, setLogs] = useState<OtherVoucher[]>([]);
  const [ledgers, setLedgers] = useState<ExpenseLedgerItem[]>([]);
  const [groups, setGroups] = useState<LedgerGroupItem[]>([]);
  const [units, setUnits] = useState<ExpenseUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Voucher Entry
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Form Fields matching photo
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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    setEditingId(null);
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
      particularName: selectedLedger ? selectedLedger.ledgerName : "Other Operational Expense",
      quantity: quantity ? Number(quantity) : undefined,
      unitName: unitName || undefined,
      amount: Number(amount),
      notes: undefined,
      pnlCategory: selectedLedger?.groupType === "EXPENSE" ? "Purchase" : "Direct Expenses",
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/vouchers/other/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update voucher");
        setFeedback({ type: "success", text: "Voucher updated and recorded successfully!" });
      } else {
        const res = await fetch("/api/vouchers/other", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to save voucher");
        setFeedback({ type: "success", text: "New voucher entry recorded successfully!" });
      }

      closeVoucherModal();
      fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "An error occurred" });
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
      const res = await fetch(`/api/vouchers/other/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete voucher");
      setFeedback({ type: "success", text: "Voucher deleted successfully." });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
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
      setFeedback({ type: "success", text: `Ledger "${created.ledgerName}" created and selected!` });
    } catch (err: any) {
      alert(err.message);
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
      setFeedback({ type: "success", text: `Unit "${created.unitSymbol}" added and selected!` });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenSlip = (item: OtherVoucher) => {
    const slipData: VoucherSlipData = {
      voucherType: "OTHER",
      voucherNo: item.id ? `OV-${item.id.replace(/[^0-9]/g, "") || item.id}` : "OV-001",
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
          description: item.notes || item.particularName || "Other Operational Purchase",
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

  const totalAmountSum = filteredLogs.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
  const distinctLedgersCount = Array.from(new Set(logs.map((l) => l.particularName).filter(Boolean))).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/purchases"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
            title="Go to Purchase Vouchers"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Purchases Module
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Other Purchases Voucher
            </h1>
          </div>
        </div>

        {/* Action Buttons: New Entry & Print */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print Register
          </button>
          
          {/* THE NEW ENTRY TRIGGER BUTTON */}
          <button
            onClick={openNewEntryModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Other Outflow"
          value={`₹${logs.reduce((acc, l) => acc + (Number(l.amount) || 0), 0).toLocaleString()}`}
          subtitle={`${logs.length} Recorded Vouchers`}
          icon={DollarSign}
        />
        <StatCard
          title="Active Ledgers / Heads"
          value={`${distinctLedgersCount} Heads`}
          subtitle="Direct & Indirect Expenses"
          icon={Layers}
        />
        <StatCard
          title="Avg. Voucher Amount"
          value={`₹${logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + (Number(l.amount) || 0), 0) / logs.length).toLocaleString() : 0}`}
          subtitle="Per Expense Voucher"
          icon={TrendingUp}
        />
        <StatCard
          title="Current Query Total"
          value={`₹${totalAmountSum.toLocaleString()}`}
          subtitle={`${filteredLogs.length} Filtered Entries`}
          isPositive={true}
          change="REGISTER VIEW"
          icon={Receipt}
        />
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* VOUCHER REGISTER / HISTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
              Other Purchases Voucher Register ({filteredLogs.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official log of operational supplies, utilities & maintenance purchases
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor, particular, bill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-emerald-600 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs"
              />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs"
              />
            </div>

            {(search || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Supplier / Payee</th>
                <th className="p-3.5">Bill No</th>
                <th className="p-3.5">Particular / Ledger</th>
                <th className="p-3.5">Quantity & Unit</th>
                <th className="p-3.5">Amount (₹)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">
                    Loading vouchers...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <p className="font-medium text-slate-600">No vouchers recorded matching current filters.</p>
                    <button
                      onClick={openNewEntryModal}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 text-white font-bold text-xs rounded-lg hover:bg-emerald-900 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Record First Voucher
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {item.voucherDate}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {item.supplierName || "—"}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {item.billNo || "—"}
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-900">
                      {item.particularName || "Other Operational"}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {item.quantity ? `${item.quantity} ${item.unitName || ""}` : "—"}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      ₹{Number(item.amount).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSlip(item)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print / View Voucher Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Voucher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
            {/* Total Row */}
            {filteredLogs.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={5} className="p-3.5 uppercase tracking-wider text-right">
                    Total Voucher Outflow:
                  </td>
                  <td className="p-3.5 text-emerald-900 text-sm font-extrabold whitespace-nowrap">
                    ₹{totalAmountSum.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* THE VOUCHER MODAL DIALOG DISPLAYED ON "NEW ENTRY" BUTTON TOUCH */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-w-4xl w-full my-auto transition-all animate-in zoom-in-95 duration-200">
            {/* Signature Green Banner Header matching Photo */}
            <div className="bg-[#38764B] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Receipt Icon matching photo */}
                <div className="text-white/95">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 2H5c-1.1 0-2 .9-2 2v18l3-2 3 2 3-2 3 2 3-2 3 2V4c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V6h10v2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white leading-tight">
                    ESTATE VOUCHERS
                  </h2>
                  <div className="text-xs text-emerald-100/90 font-medium">
                    Voucher Type: OTHER
                  </div>
                </div>
              </div>

              {/* Top-Right Badge: NEW ENTRY & Close Button */}
              <div className="flex items-center gap-3">
                <span className="bg-white/20 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg uppercase tracking-wider select-none shadow-2xs">
                  {editingId ? "EDIT ENTRY" : "NEW ENTRY"}
                </span>
                <button
                  type="button"
                  onClick={closeVoucherModal}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close Voucher Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Voucher Form Body matching Photo */}
            <form onSubmit={handleSaveVoucher} className="p-6 sm:p-7 space-y-6">
              {/* Row 1: DATE *, SUPPLIER NAME, BILL DATE, BILL NO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* DATE * */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    DATE <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* SUPPLIER NAME */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    SUPPLIER NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Agri Mart, Local Vendor"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs placeholder:text-slate-400"
                  />
                </div>

                {/* BILL DATE */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    BILL DATE
                  </label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs placeholder:text-slate-400"
                  />
                </div>

                {/* BILL NO */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    BILL NO
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2024-001"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 2: LEDGER ACCOUNT *, QUANTITY (Optional), UNIT OF MEASURE, TOTAL AMOUNT (₹) * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* LEDGER ACCOUNT * */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    LEDGER ACCOUNT <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={ledgerId}
                    onChange={(e) => setLedgerId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
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
                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 mt-1 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-bold">⊕</span> Create new ledger account
                  </button>
                </div>

                {/* QUANTITY (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    QUANTITY <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 5.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs placeholder:text-slate-400"
                  />
                </div>

                {/* UNIT OF MEASURE */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    UNIT OF MEASURE
                  </label>
                  <select
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
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
                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 mt-1 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-bold">⊕</span> Add new unit
                  </button>
                </div>

                {/* TOTAL AMOUNT (₹) * */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    TOTAL AMOUNT (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-emerald-600/20 focus-within:border-emerald-600">
                    <span className="px-3 py-2 text-slate-700 font-bold text-sm bg-slate-50 border-r border-slate-200 select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2.5 bg-transparent text-slate-900 font-bold text-xs sm:text-sm focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Buttons Cancel & Save Voucher */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeVoucherModal}
                  className="px-6 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#38764B] hover:bg-[#2D603D] text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer hover:shadow-md"
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
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Create New Ledger Account
              </h3>
              <button
                onClick={() => setShowLedgerModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLedger} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Ledger Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Irrigation Repair & Spares"
                  value={newLedgerName}
                  onChange={(e) => setNewLedgerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Ledger Group *
                </label>
                <select
                  required
                  value={newLedgerGroupId}
                  onChange={(e) => setNewLedgerGroupId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-emerald-600"
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
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-800 text-white font-bold cursor-pointer hover:bg-emerald-900 shadow-xs"
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
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Add New Unit of Measure
              </h3>
              <button
                onClick={() => setShowUnitModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Unit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boxes / Packets"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Unit Symbol / Abbreviation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. box, pkt, bundles"
                  value={newUnitSymbol}
                  onChange={(e) => setNewUnitSymbol(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-800 text-white font-bold cursor-pointer hover:bg-emerald-900 shadow-xs"
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
    </div>
  );
}
