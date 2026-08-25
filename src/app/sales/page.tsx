"use client";

import React, { useState, useEffect } from "react";
import { SalesLogItem, VoucherLineItem } from "@/lib/transaction-logs";
import { PlotItem, PlotCropAssociation } from "@/lib/master-data";
import {
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal,
  PlusCircle,
  Search,
  Printer,
  FileText,
  Trash2,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  X,
  Sparkles,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatCard } from "@/components/ui/stat-card";
import { VoucherSlipModal, VoucherSlipData } from "@/components/voucher-slip-modal";

export default function SalesPage() {
  const [logs, setLogs] = useState<SalesLogItem[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [activeModalVoucher, setActiveModalVoucher] = useState<VoucherSlipData | null>(null);

  // Form State for Sales Voucher
  const [voucherNo, setVoucherNo] = useState("SLS-VCH-2026-003");
  const [voucherType, setVoucherType] = useState("Harvest Crop Sale");
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedPlotCropId, setSelectedPlotCropId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [buyerName, setBuyerName] = useState("Koyambedu Traders");
  const [buyerContact, setBuyerContact] = useState("+91 98401 23456");
  const [buyerAddress, setBuyerAddress] = useState("Wholesale Mandi Complex, Chennai");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit / On Account">("Bank Transfer");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING" | "PARTIAL">("PAID");
  const [referenceNo, setReferenceNo] = useState("NEFT-TR-7821");
  const [notes, setNotes] = useState("Harvest batch direct dispatch");

  // Dynamic Line Items in Voucher
  const [items, setItems] = useState<VoucherLineItem[]>([
    { id: "1", description: "Fresh Tomato Harvest (Grade A)", quantity: 1000, unit: "kg", rate: 45, amount: 45000 },
  ]);
  const [taxPercent] = useState<number>(0);
  const [discount] = useState<number>(0);

  const fetchLogs = async () => {
    const res = await fetch("/api/sales-logs");
    const data: SalesLogItem[] = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    async function loadData() {
      const [logsRes, plotsRes, assocRes] = await Promise.all([
        fetch("/api/sales-logs"),
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
      ]);
      const logsData: SalesLogItem[] = await logsRes.json();
      const plotsData: PlotItem[] = await plotsRes.json();
      const assocData: PlotCropAssociation[] = await assocRes.json();

      setLogs(logsData);
      setPlots(plotsData);
      setAssociations(assocData);

      if (plotsData.length > 0) {
        setSelectedPlotId(plotsData[0].id);
        const filtered = assocData.filter((a) => a.plotId === plotsData[0].id);
        if (filtered.length > 0) setSelectedPlotCropId(filtered[0].id);
      }
    }
    loadData();
  }, []);

  const handlePlotChange = (plotId: string) => {
    setSelectedPlotId(plotId);
    const filtered = associations.filter((a) => a.plotId === plotId);
    if (filtered.length > 0) {
      setSelectedPlotCropId(filtered[0].id);
    } else {
      setSelectedPlotCropId("");
    }
  };

  const handleItemChange = (index: number, field: keyof VoucherLineItem, value: string | number) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      const q = field === "quantity" ? Number(value) || 0 : Number(item.quantity) || 0;
      const r = field === "rate" ? Number(value) || 0 : Number(item.rate) || 0;
      item.amount = q * r;
    }
    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    const activeCrop = associations.find((a) => a.id === selectedPlotCropId);
    setItems([
      ...items,
      {
        id: `item_${items.length + 1}`,
        description: activeCrop ? `${activeCrop.cropActivityName} Harvest` : "Crop Produce Item",
        quantity: 500,
        unit: "kg",
        rate: 40,
        amount: 20000,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);
  const totalQuantityKg = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

  const handleSubmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePlot = plots.find((p) => p.id === selectedPlotId);
    const activeAssoc = associations.find((a) => a.id === selectedPlotCropId);

    const payload = {
      voucherNo,
      voucherType,
      plotCropId: selectedPlotCropId || undefined,
      plotName: activePlot ? activePlot.name : "General Estate",
      cropActivityName: activeAssoc ? activeAssoc.cropActivityName : "N/A",
      quantityKg: totalQuantityKg,
      value: grandTotal,
      buyerName,
      buyerContact,
      buyerAddress,
      items,
      subtotal,
      taxPercent,
      taxAmount,
      discount,
      paymentMode,
      paymentStatus,
      referenceNo,
      date,
      notes,
      loggedBy: roleName === "Admin" ? "Estate Admin" : "Field Staff",
    };

    await fetch("/api/sales-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Reset voucher number for next entry
    setVoucherNo(`SLS-VCH-2026-${String(logs.length + 2).padStart(3, "0")}`);
    fetchLogs();
  };

  const handleDeleteVoucher = async (id: string) => {
    if (confirm("Are you sure you want to void / delete this sales voucher?")) {
      await fetch(`/api/sales-logs?id=${id}`, { method: "DELETE" });
      fetchLogs();
    }
  };

  const openSlipModal = (log: SalesLogItem) => {
    const slipData: VoucherSlipData = {
      voucherType: "SALES",
      voucherNo: log.voucherNo || `SLS-${log.id}`,
      date: log.date,
      title: log.voucherType || "Crop Produce Sales Voucher",
      partyName: log.buyerName || "Local Merchant / Purchaser",
      partyContact: log.buyerContact || "—",
      partyAddress: log.buyerAddress || "—",
      plotName: log.plotName || "General Estate",
      cropActivityName: log.cropActivityName || "Produce",
      items: log.items && log.items.length > 0 ? log.items : [
        {
          description: `${log.cropActivityName || "Crop Produce"} Produce Batch`,
          quantity: log.quantityKg,
          unit: "kg",
          rate: log.quantityKg > 0 ? Number((log.value / log.quantityKg).toFixed(2)) : log.value,
          amount: log.value,
        },
      ],
      subtotal: log.subtotal || log.value,
      taxPercent: log.taxPercent || 0,
      taxAmount: log.taxAmount || 0,
      discount: log.discount || 0,
      totalAmount: log.value,
      paymentMode: log.paymentMode || "Bank Transfer",
      paymentStatus: log.paymentStatus || "PAID",
      referenceNo: log.referenceNo,
      loggedBy: log.loggedBy,
      notes: log.notes,
    };
    setActiveModalVoucher(slipData);
  };

  // KPIs
  const totalRevenue = logs.reduce((acc, l) => acc + (l.value || 0), 0);
  const totalQtySold = logs.reduce((acc, l) => acc + (l.quantityKg || 0), 0);
  const paidVouchers = logs.filter((l) => l.paymentStatus === "PAID" || !l.paymentStatus).length;
  const pendingVouchers = logs.filter((l) => l.paymentStatus === "PENDING" || l.paymentStatus === "PARTIAL").length;

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      (l.voucherNo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (l.buyerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (l.plotName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (l.cropActivityName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PAID" && (l.paymentStatus === "PAID" || !l.paymentStatus)) ||
      (statusFilter === "PENDING" && l.paymentStatus === "PENDING") ||
      (statusFilter === "PARTIAL" && l.paymentStatus === "PARTIAL");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Title & Simulated RBAC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Crop Sales & Revenue Logs (Voucher Format)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate official Estate Sales Vouchers, record harvest dispatches, track client receivables & print tax slips
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Simulated Role:</span>
            <RoleBadge role={roleName} />
            <button
              onClick={() => {
                setCanEdit(!canEdit);
                setRoleName(canEdit ? "Field Staff" : "Admin");
              }}
              className="px-2 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              Toggle RBAC
            </button>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {showCreateForm ? "Hide Voucher Form" : "Create Sales Voucher"}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Crop Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          subtitle={`${logs.length} Total Sales Vouchers`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Produce Sold"
          value={`${totalQtySold.toLocaleString()} kg`}
          subtitle="Cumulative Harvest Volume"
          icon={Receipt}
        />
        <StatCard
          title="Settled / Paid Vouchers"
          value={`${paidVouchers} Vouchers`}
          subtitle="100% Cleared Accounts"
          isPositive={true}
          change="SETTLED"
          icon={CheckCircle2}
        />
        <StatCard
          title="Pending Receivables"
          value={`${pendingVouchers} Vouchers`}
          subtitle="Unpaid or Partial Credit"
          isPositive={pendingVouchers === 0}
          change={pendingVouchers === 0 ? "ZERO ARREARS" : "CREDIT DUE"}
          icon={Clock}
        />
      </div>

      {!canEdit ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Access Restricted: Field Staff role can only inspect sales registers. Switch to Admin to generate and record official Sales Vouchers.
          </span>
        </div>
      ) : (
        showCreateForm && (
          <form
            onSubmit={handleSubmitVoucher}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6"
          >
            {/* Voucher Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Official Estate Sales Voucher Studio
                  </h2>
                  <p className="text-xs text-slate-500">
                    Produce dispatch, buyer accounting & itemized line calculation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono font-bold text-slate-700 flex items-center gap-2">
                  <span>VOUCHER NO:</span>
                  <input
                    type="text"
                    required
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* Grid 1: Voucher Meta, Party & Plot Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* Plot & Crop Cascade Selector */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" /> Plot & Crop Allocation
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Source Plot</label>
                  <select
                    id="form-plot-select"
                    value={selectedPlotId}
                    onChange={(e) => handlePlotChange(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    {plots.map((plot) => (
                      <option key={plot.id} value={plot.id}>
                        {plot.name} ({plot.areaAcres} Acres)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Harvest Crop / Activity</label>
                  <select
                    id="form-crop-select"
                    value={selectedPlotCropId}
                    onChange={(e) => setSelectedPlotCropId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    {associations
                      .filter((a) => a.plotId === selectedPlotId)
                      .map((pc) => (
                        <option key={pc.id} value={pc.id}>
                          {pc.cropActivityName} [{pc.status}]
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Voucher Type</label>
                  <select
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="Harvest Crop Sale">Harvest Crop Sale</option>
                    <option value="Mandi Wholesale Direct">Mandi Wholesale Direct</option>
                    <option value="Retail / Local Market">Retail / Local Market</option>
                    <option value="By-product / Manure Sale">By-product / Manure Sale</option>
                    <option value="Timber & Agroforestry">Timber & Agroforestry</option>
                  </select>
                </div>
              </div>

              {/* Customer / Buyer Information */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-700" /> Buyer / Customer Details
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Buyer / Mandi Merchant Name</label>
                  <input
                    id="sales-buyer-input"
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Koyambedu Wholesale Merchants"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Contact Phone</label>
                  <input
                    type="text"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder="+91 98400 00000"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Delivery Destination / Address</label>
                  <input
                    type="text"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    placeholder="Wholesale Market, Chennai"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Voucher Date & Settlement Details */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date & Settlement Mode
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Voucher Date</label>
                  <input
                    id="form-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit / On Account")}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit / On Account">Credit / On Account</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as "PAID" | "PENDING" | "PARTIAL")}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-bold"
                    >
                      <option value="PAID">PAID</option>
                      <option value="PENDING">PENDING</option>
                      <option value="PARTIAL">PARTIAL</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Payment Ref / Txn ID</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="NEFT-1290391 / GPay ref"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Grid 2: Itemized Particulars Grid (Voucher Format) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Voucher Particulars & Produce Line Items ({items.length})
                </h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Line Item
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 bg-white">
                <div className="bg-slate-100 p-3 grid grid-cols-12 gap-2 text-slate-700 font-bold uppercase text-xs">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Produce Particulars / Description</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-1">Rate (₹)</div>
                  <div className="col-span-2 text-right">Amount (₹)</div>
                </div>

                {items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 grid grid-cols-12 gap-2 items-center text-xs hover:bg-slate-50/50">
                    <div className="col-span-1 text-center text-slate-400 font-mono font-bold">
                      {idx + 1}
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        placeholder="Produce description e.g. Grade A Tomatoes"
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        id={idx === 0 ? "sales-qty-input" : undefined}
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono font-semibold"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium"
                      >
                        <option value="kg">kg</option>
                        <option value="bags">bags</option>
                        <option value="boxes">boxes</option>
                        <option value="tons">tons</option>
                        <option value="pieces">pieces</option>
                        <option value="bunches">bunches</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono font-semibold"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <input
                        id={idx === 0 ? "sales-val-input" : undefined}
                        type="number"
                        required
                        value={item.amount}
                        onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                        className="w-full p-2 bg-slate-100 border border-slate-300 rounded-md text-slate-900 font-mono font-bold text-right text-emerald-800"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Delete Item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations & Submit Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 items-end">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 text-xs">
                  Field Remarks / Delivery Notes
                </label>
                <input
                  id="form-notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dispatched via truck TN-22-AX-8910"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>

              <div className="p-4 bg-emerald-950 text-white rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between text-emerald-300">
                  <span>Subtotal Amount:</span>
                  <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Total Produce Weight:</span>
                  <span>{totalQuantityKg.toLocaleString()} kg</span>
                </div>
                <div className="border-t border-emerald-800 pt-2 flex justify-between items-center text-sm font-sans">
                  <span className="font-black text-emerald-100 uppercase tracking-wide">
                    Net Grand Total:
                  </span>
                  <span className="font-black text-xl font-mono text-emerald-300">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                id="form-submit-btn"
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate & Save Official Sales Voucher
              </button>
            </div>
          </form>
        )
      )}

      {/* Sales Vouchers Register (Ledger View) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-700" />
              Sales Vouchers Register ({filteredLogs.length})
            </h2>
            <p className="text-xs text-slate-500">
              Official archive of all produce dispatches, invoices, and payment receipts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher #, buyer, plot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-emerald-600 w-56"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {(["ALL", "PAID", "PENDING", "PARTIAL"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    statusFilter === status
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Voucher No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Buyer / Merchant</th>
                <th className="p-3.5">Plot & Crop</th>
                <th className="p-3.5">Quantity Sold</th>
                <th className="p-3.5">Voucher Value</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                    No sales vouchers match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-900">
                      <button
                        onClick={() => openSlipModal(log)}
                        className="hover:underline text-left cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        {log.voucherNo || `SLS-${log.id}`}
                      </button>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{log.date}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{log.buyerName || "—"}</div>
                      {log.buyerContact && (
                        <div className="text-[11px] text-slate-500">{log.buyerContact}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{log.plotName}</div>
                      <div className="text-emerald-700 font-medium">{log.cropActivityName}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {log.quantityKg} kg
                    </td>
                    <td className="p-3.5 font-mono font-black text-emerald-800 text-sm">
                      ₹{log.value}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.paymentStatus === "PAID" || !log.paymentStatus
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : log.paymentStatus === "PENDING"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
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
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openSlipModal(log)}
                          title="View Official Voucher Slip"
                          className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer border border-slate-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteVoucher(log.id)}
                            title="Void Voucher"
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Official Voucher Slip Modal */}
      <VoucherSlipModal
        isOpen={!!activeModalVoucher}
        onClose={() => setActiveModalVoucher(null)}
        voucher={activeModalVoucher}
      />
    </div>
  );
}
