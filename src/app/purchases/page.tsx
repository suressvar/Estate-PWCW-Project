"use client";

import React, { useState, useEffect } from "react";
import { PurchaseVoucherItem, VoucherLineItem } from "@/lib/transaction-logs";
import { PlotItem, PlotCropAssociation } from "@/lib/master-data";
import {
  ShoppingBag,
  ShieldAlert,
  SlidersHorizontal,
  PlusCircle,
  Search,
  Printer,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  X,
  Sparkles,
  Layers,
  Tag,
  DollarSign,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatCard } from "@/components/ui/stat-card";
import { VoucherSlipModal, VoucherSlipData } from "@/components/voucher-slip-modal";

const PURCHASE_CATEGORIES = [
  "Fertilizer & Nutrition",
  "Diesel & Fuel",
  "Machinery Spares & Repairs",
  "Irrigation & Piping",
  "Seeds & Saplings",
  "Pesticides & Bio",
  "Tools & Hardware",
  "General Estate Supplies",
] as const;

export default function PurchasesPage() {
  const [logs, setLogs] = useState<PurchaseVoucherItem[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [activeModalVoucher, setActiveModalVoucher] = useState<VoucherSlipData | null>(null);

  // Form State for Purchase Voucher
  const [voucherNo, setVoucherNo] = useState("PUR-VCH-2026-003");
  const [category, setCategory] = useState<PurchaseVoucherItem["category"]>("Irrigation & Piping");
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedPlotCropId, setSelectedPlotCropId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendorName, setVendorName] = useState("Kavery Drip & Hardware Enterprises");
  const [vendorBillNo, setVendorBillNo] = useState("KD-INV-9901");
  const [vendorContact, setVendorContact] = useState("+91 97890 11223");
  const [vendorGstin, setVendorGstin] = useState("33AABCK8921F1ZX");
  const [description, setDescription] = useState("Drip lateral pipe replacement & valve spares");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit">("Bank Transfer");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING" | "PARTIAL">("PAID");
  const [notes, setNotes] = useState("Procured for seasonal maintenance");

  // Dynamic Line Items in Voucher
  const [items, setItems] = useState<VoucherLineItem[]>([
    { id: "1", description: "16mm Drip Lateral Line (500m Coil)", quantity: 2, unit: "coils", rate: 2200, amount: 4400 },
    { id: "2", description: "Screen Filter 2-inch Flushing Valves", quantity: 3, unit: "pieces", rate: 700, amount: 2100 },
  ]);
  const [taxPercent] = useState<number>(0);
  const [discount] = useState<number>(0);

  const fetchLogs = async () => {
    const res = await fetch("/api/purchase-vouchers");
    const data: PurchaseVoucherItem[] = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    async function loadData() {
      const [logsRes, plotsRes, assocRes] = await Promise.all([
        fetch("/api/purchase-vouchers"),
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
      ]);
      const logsData: PurchaseVoucherItem[] = await logsRes.json();
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
    setItems([
      ...items,
      {
        id: `item_${items.length + 1}`,
        description: `Estate ${category} Item`,
        quantity: 1,
        unit: "units",
        rate: 1000,
        amount: 1000,
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

  const handleSubmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePlot = plots.find((p) => p.id === selectedPlotId);
    const activeAssoc = associations.find((a) => a.id === selectedPlotCropId);

    const payload = {
      voucherNo,
      category,
      plotCropId: selectedPlotCropId || undefined,
      plotName: activePlot ? activePlot.name : "General Estate",
      cropActivityName: activeAssoc ? activeAssoc.cropActivityName : "N/A",
      description: description || `${category} Procurement`,
      vendorName,
      vendorBillNo,
      vendorContact,
      vendorGstin,
      items,
      subtotal,
      taxPercent,
      taxAmount,
      discount,
      cost: grandTotal,
      paymentMode,
      paymentStatus,
      date,
      notes,
      loggedBy: roleName === "Admin" ? "Estate Admin" : "Field Staff",
    };

    await fetch("/api/purchase-vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Reset voucher number for next entry
    setVoucherNo(`PUR-VCH-2026-${String(logs.length + 2).padStart(3, "0")}`);
    fetchLogs();
  };

  const handleDeleteVoucher = async (id: string) => {
    if (confirm("Are you sure you want to void / delete this purchase voucher?")) {
      await fetch(`/api/purchase-vouchers?id=${id}`, { method: "DELETE" });
      fetchLogs();
    }
  };

  const openSlipModal = (log: PurchaseVoucherItem) => {
    const slipData: VoucherSlipData = {
      voucherType: "PURCHASE",
      voucherNo: log.voucherNo || `PUR-${log.id}`,
      date: log.date,
      title: `${log.category || "Estate Purchase"} Voucher`,
      category: log.category,
      partyName: log.vendorName || "Supplier / Vendor",
      partyContact: log.vendorContact || "—",
      vendorBillNo: log.vendorBillNo || "—",
      vendorGstin: log.vendorGstin || "—",
      plotName: log.plotName || "General Estate Operations",
      cropActivityName: log.cropActivityName || "N/A",
      items: log.items && log.items.length > 0 ? log.items : [
        {
          description: log.description || "General Purchase Expenses",
          quantity: 1,
          unit: "lot",
          rate: log.cost,
          amount: log.cost,
        },
      ],
      subtotal: log.subtotal || log.cost,
      taxPercent: log.taxPercent || 0,
      taxAmount: log.taxAmount || 0,
      discount: log.discount || 0,
      totalAmount: log.cost,
      paymentMode: log.paymentMode || "Bank Transfer",
      paymentStatus: log.paymentStatus || "PAID",
      loggedBy: log.loggedBy,
      notes: log.notes,
    };
    setActiveModalVoucher(slipData);
  };

  // KPIs
  const totalCost = logs.reduce((acc, l) => acc + (l.cost || 0), 0);
  const distinctCategories = Array.from(new Set(logs.map((l) => l.category).filter(Boolean))).length;
  const paidVouchers = logs.filter((l) => l.paymentStatus === "PAID" || !l.paymentStatus).length;
  const pendingVouchers = logs.filter((l) => l.paymentStatus === "PENDING" || l.paymentStatus === "PARTIAL").length;

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      (l.voucherNo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (l.vendorName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (l.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (l.plotName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || l.category === categoryFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PAID" && (l.paymentStatus === "PAID" || !l.paymentStatus)) ||
      (statusFilter === "PENDING" && l.paymentStatus === "PENDING") ||
      (statusFilter === "PARTIAL" && l.paymentStatus === "PARTIAL");
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Title & Simulated RBAC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Estate Purchases & Procurement (Voucher Format)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate official Estate Purchase Vouchers, record input supplies (Fertilizer, Diesel, Spares, Seeds) & print expense receipts
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
            {showCreateForm ? "Hide Voucher Form" : "Create Purchase Voucher"}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Estate Purchases"
          value={`₹${totalCost.toLocaleString()}`}
          subtitle={`${logs.length} Total Purchase Vouchers`}
          icon={DollarSign}
        />
        <StatCard
          title="Active Expense Heads"
          value={`${distinctCategories} Heads`}
          subtitle="Fertilizer, Diesel, Spares, Tools"
          icon={Layers}
        />
        <StatCard
          title="Settled / Paid Bills"
          value={`${paidVouchers} Bills`}
          subtitle="Vendor Payments Cleared"
          isPositive={true}
          change="SETTLED"
          icon={CheckCircle2}
        />
        <StatCard
          title="Credit Payables"
          value={`${pendingVouchers} Bills`}
          subtitle="Outstanding Vendor Invoices"
          isPositive={pendingVouchers === 0}
          change={pendingVouchers === 0 ? "ZERO PAYABLES" : "PENDING DUE"}
          icon={Clock}
        />
      </div>

      {!canEdit ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Access Restricted: Field Staff role can only inspect purchase logs. Switch to Admin to record official Purchase Vouchers.
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
                    Official Estate Purchase Voucher Studio
                  </h2>
                  <p className="text-xs text-slate-500">
                    Input procurement, vendor invoice recording & itemized costing
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
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-emerald-900"
                  />
                </div>
              </div>
            </div>

            {/* Grid 1: Category, Vendor & Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* Category & Allocation */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" /> Category & Allocation
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Procurement Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PurchaseVoucherItem["category"])}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    {PURCHASE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Allocated Land Plot</label>
                  <select
                    value={selectedPlotId}
                    onChange={(e) => handlePlotChange(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="">General Estate Operations</option>
                    {plots.map((plot) => (
                      <option key={plot.id} value={plot.id}>
                        {plot.name} ({plot.areaAcres} Acres)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Crop / Activity Associated</label>
                  <select
                    value={selectedPlotCropId}
                    onChange={(e) => setSelectedPlotCropId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="">General / Not Tied to Single Crop</option>
                    {associations
                      .filter((a) => !selectedPlotId || a.plotId === selectedPlotId)
                      .map((pc) => (
                        <option key={pc.id} value={pc.id}>
                          {pc.cropActivityName} [{pc.status}]
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Vendor / Supplier Information */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" /> Vendor / Supplier Details
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Supplier / Dealer Name</label>
                  <input
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Sri Murugan Agro Agencies"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vendor Bill / Inv #</label>
                    <input
                      type="text"
                      value={vendorBillNo}
                      onChange={(e) => setVendorBillNo(e.target.value)}
                      placeholder="SMA-88910"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vendor Contact</label>
                    <input
                      type="text"
                      value={vendorContact}
                      onChange={(e) => setVendorContact(e.target.value)}
                      placeholder="+91 98412 00000"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Vendor GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={vendorGstin}
                    onChange={(e) => setVendorGstin(e.target.value)}
                    placeholder="33AAMFS4431E1Z8"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Voucher Date & Settlement Details */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date & Settlement Mode
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Purchase Date</label>
                  <input
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
                      onChange={(e) => setPaymentMode(e.target.value as "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit")}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit">Credit / Account</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Payment Status</label>
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
                  <label className="font-semibold text-slate-700">Summary Expense Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Drip Irrigation Pipe Fittings"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Grid 2: Itemized Particulars Grid (Voucher Format) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Purchased Items & Material Particulars ({items.length})
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
                  <div className="col-span-4">Material / Service Description</div>
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
                        placeholder="Material description e.g. 16mm Drip Pipes"
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
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
                        <option value="units">units</option>
                        <option value="kg">kg</option>
                        <option value="liters">liters</option>
                        <option value="bags">bags</option>
                        <option value="pieces">pieces</option>
                        <option value="coils">coils</option>
                        <option value="cans">cans</option>
                        <option value="sets">sets</option>
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
                        type="number"
                        required
                        value={item.amount}
                        onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                        className="w-full p-2 bg-slate-100 border border-slate-300 rounded-md text-slate-900 font-mono font-bold text-right text-emerald-900"
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
                  Field Remarks / Usage Intent Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Replaced damaged drip laterals in North sector block"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                />
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Amount:</span>
                  <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Category Head:</span>
                  <span>{category}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-sans">
                  <span className="font-black text-slate-100 uppercase tracking-wide">
                    Net Voucher Cost:
                  </span>
                  <span className="font-black text-xl font-mono text-emerald-400">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate & Save Official Purchase Voucher
              </button>
            </div>
          </form>
        )
      )}

      {/* Purchase Vouchers Register (Ledger View) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              Purchase Vouchers Register ({filteredLogs.length})
            </h2>
            <p className="text-xs text-slate-500">
              Official archive of all farm procurement vouchers, supplier invoices, and input expenses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher #, vendor, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-blue-600 w-56"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold"
            >
              <option value="ALL">All Categories</option>
              {PURCHASE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

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
                <th className="p-3.5">Category Head</th>
                <th className="p-3.5">Vendor / Supplier</th>
                <th className="p-3.5">Plot Allocation</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Voucher Cost</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                    No purchase vouchers match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-950">
                      <button
                        onClick={() => openSlipModal(log)}
                        className="hover:underline text-left cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        {log.voucherNo || `PUR-${log.id}`}
                      </button>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{log.date}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        {log.category || "General"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{log.vendorName || "General Supplier"}</div>
                      {log.vendorBillNo && (
                        <div className="text-[11px] text-slate-500 font-mono">Bill: {log.vendorBillNo}</div>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{log.plotName || "General Estate"}</td>
                    <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="p-3.5 font-mono font-black text-slate-900 text-sm">
                      ₹{log.cost?.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.paymentStatus === "PAID" || !log.paymentStatus
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : log.paymentStatus === "PENDING"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
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
                          className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer border border-slate-200"
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
