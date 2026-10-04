"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DEFAULT_PURCHASE_CATEGORIES } from "@/types/estate";
import {
  ShoppingBag,
  Store,
  ShieldAlert,
  SlidersHorizontal,
  PlusCircle,
  Plus,
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
  Check,
  LayoutGrid,
  List,
  FileSpreadsheet,
} from "lucide-react";
import type { PurchaseVoucherItem, VoucherLineItem, PlotItem, PlotCropAssociation } from "@/types/estate";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatCard } from "@/components/ui/stat-card";
import { VoucherSlipModal, VoucherSlipData } from "@/components/voucher-slip-modal";

export default function PurchasesPage() {
  const [logs, setLogs] = useState<PurchaseVoucherItem[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeModalVoucher, setActiveModalVoucher] = useState<VoucherSlipData | null>(null);

  // Categories state (with create new category capability)
  const [categories, setCategories] = useState<string[]>([...DEFAULT_PURCHASE_CATEGORIES]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State for Purchase Voucher
  const [voucherNo, setVoucherNo] = useState("PUR-VCH-2026-003");
  const [category, setCategory] = useState<string>("Fertilizer & Nutrition");
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedPlotCropId, setSelectedPlotCropId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendorName, setVendorName] = useState("");
  const [vendorBillNo, setVendorBillNo] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit">("Cash");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING" | "PARTIAL">("PAID");

  // Dynamic Line Items in Voucher
  const [items, setItems] = useState<VoucherLineItem[]>([
    { id: "1", description: "", quantity: 1, unit: "units", rate: 0, amount: 0 },
  ]);
  const [taxPercent] = useState<number>(0);
  const [discount] = useState<number>(0);

  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);

  const fetchLogs = async () => {
    const res = await fetch("/api/purchase-vouchers");
    const data: PurchaseVoucherItem[] = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    async function loadData() {
      const [logsRes, plotsRes, assocRes, catsRes, unitsRes, partiesRes] = await Promise.all([
        fetch("/api/purchase-vouchers"),
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
        fetch("/api/purchase-categories"),
        fetch("/api/units"),
        fetch("/api/parties"),
      ]);
      const logsData: PurchaseVoucherItem[] = await logsRes.json();
      const plotsData: PlotItem[] = await plotsRes.json();
      const assocData: PlotCropAssociation[] = await assocRes.json();
      const catsData: string[] = await catsRes.json().catch(() => []);
      const unitsData: any[] = await unitsRes.json().catch(() => []);
      const partiesData: any[] = await partiesRes.json().catch(() => []);

      setLogs(logsData);
      setPlots(plotsData);
      setAssociations(assocData);
      if (Array.isArray(catsData) && catsData.length > 0) {
        setCategories(catsData);
      }
      if (Array.isArray(unitsData) && unitsData.length > 0) {
        setAvailableUnits(unitsData);
      }
      if (Array.isArray(partiesData) && partiesData.length > 0) {
        setParties(partiesData);
      }

      if (plotsData.length > 0) {
        setSelectedPlotId(plotsData[0].id);
        const filtered = assocData.filter((a) => a.plotId === plotsData[0].id);
        if (filtered.length > 0) setSelectedPlotCropId(filtered[0].id);
      }

      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const vendorParam = urlParams.get("vendor");
        if (vendorParam) {
          setVendorName(vendorParam);
          const matched = partiesData.find(
            (p: any) => p.name?.toLowerCase() === vendorParam.toLowerCase()
          );
          if (matched) {
            if (matched.phone) setVendorContact(matched.phone);
            if (matched.gstin) setVendorGstin(matched.gstin);
          }
          setShowCreateForm(true);
        }
      }
    }
    loadData();
  }, []);



  const handleCreateCategory = async (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
    setCategory(trimmed);
    setShowAddCategory(false);
    setNewCategoryName("");
    try {
      await fetch("/api/purchase-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: trimmed }),
      });
    } catch (e) {
      console.error("Failed to save new purchase category", e);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setSavingCat(true);
      const res = await fetch("/api/purchase-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCatName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        setNewCatName("");
        setMsg({ type: "success", text: `Category "${newCatName.trim()}" created successfully!` });
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (!confirm(`Are you sure you want to delete category "${cat}"?`)) return;
    try {
      const res = await fetch(`/api/purchase-categories?category=${encodeURIComponent(cat)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        if (categoryFilter === cat) setCategoryFilter("ALL");
        setMsg({ type: "success", text: `Category "${cat}" removed.` });
        setTimeout(() => setMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      "Voucher No",
      "Date",
      "Category",
      "Vendor",
      "Vendor Bill No",
      "Plot",
      "Description",
      "Cost",
      "Payment Mode",
      "Status",
    ];
    const rows = filteredLogs.map((l) => [
      l.voucherNo || `PUR-${l.id}`,
      l.date || "",
      l.category || "General",
      l.vendorName || "",
      l.vendorBillNo || "",
      l.plotName || "General Estate",
      l.description || "",
      String(l.cost || 0),
      l.paymentMode || "",
      l.paymentStatus || "PAID",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ranga_estate_purchase_register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        id: `item_${Date.now()}`,
        description: "",
        quantity: 1,
        unit: "units",
        rate: 0,
        amount: 0,
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

    const itemsDescription = items.map((it) => it.description).filter(Boolean).join(", ");
    const voucherDescription = itemsDescription || `${category} Procurement`;

    const payload = {
      voucherNo,
      category,
      plotCropId: selectedPlotCropId || undefined,
      plotName: activePlot ? activePlot.name : "General Estate",
      cropActivityName: activeAssoc ? activeAssoc.cropActivityName : "N/A",
      description: voucherDescription,
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
      notes: "",
      loggedBy: roleName === "Admin" ? "Estate Admin" : "Field Staff",
    };

    await fetch("/api/purchase-vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Reset form fields for next entry
    setVendorName("");
    setVendorBillNo("");
    setVendorContact("");
    setVendorGstin("");
    setItems([{ id: "1", description: "", quantity: 1, unit: "units", rate: 0, amount: 0 }]);
    setVoucherNo(`PUR-VCH-2026-${String(logs.length + 2).padStart(3, "0")}`);
    setShowCreateForm(false);
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

  // Filter records by date, search, category tab, and status
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const d = l.date || "";
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;

      const recordCat = l.category || "General";
      if (categoryFilter !== "ALL" && recordCat !== categoryFilter) {
        return false;
      }

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PAID" && (l.paymentStatus === "PAID" || !l.paymentStatus)) ||
        (statusFilter === "PENDING" && l.paymentStatus === "PENDING") ||
        (statusFilter === "PARTIAL" && l.paymentStatus === "PARTIAL");
      if (!matchesStatus) return false;

      const query = searchTerm.toLowerCase().trim();
      if (!query) return true;

      const voucher = (l.voucherNo || "").toLowerCase();
      const vendor = (l.vendorName || "").toLowerCase();
      const bill = (l.vendorBillNo || "").toLowerCase();
      const desc = (l.description || "").toLowerCase();
      const plot = (l.plotName || "").toLowerCase();
      const cat = recordCat.toLowerCase();

      return (
        voucher.includes(query) ||
        vendor.includes(query) ||
        bill.includes(query) ||
        desc.includes(query) ||
        plot.includes(query) ||
        cat.includes(query)
      );
    });
  }, [logs, startDate, endDate, categoryFilter, statusFilter, searchTerm]);

  const totalCost = filteredLogs.reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
  const totalTransactions = filteredLogs.length;

  // Category wise breakdown for summary & grouped view
  const categoryGroups = useMemo(() => {
    const map = new Map<string, PurchaseVoucherItem[]>();

    // Initialize all existing categories
    categories.forEach((cat) => map.set(cat, []));

    filteredLogs.forEach((l) => {
      const cat = l.category || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(l);
    });

    const groups: { name: string; records: PurchaseVoucherItem[]; totalCost: number }[] = [];
    map.forEach((items, name) => {
      if (categoryFilter === "ALL" || categoryFilter === name) {
        if (items.length > 0 || categoryFilter === name) {
          groups.push({
            name,
            records: items,
            totalCost: items.reduce((sum, item) => sum + Number(item.cost || 0), 0),
          });
        }
      }
    });

    return groups.sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredLogs, categories, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-black shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Purchase Register</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Official Ledger
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
            <span>Retailers / Purchaser</span>
          </Link>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Voucher</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            msg.type === "success"
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
          title="Total Purchases Expenses"
          value={`₹${totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          subtitle="Net procurement expenditure"
          icon={DollarSign}
        />
        <StatCard
          title="Total Recorded Entries"
          value={totalTransactions}
          subtitle="Registered purchase vouchers"
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
              categoryFilter === "ALL"
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#15803d] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? "bg-emerald-900/40 text-white" : "bg-slate-100 text-slate-600"
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

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode("grouped")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "grouped"
                ? "bg-white text-[#15803d] shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            title="Display vouchers grouped Category-wise"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Category View</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table"
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

      {!canEdit ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Access Restricted: Field Staff role can only inspect purchase logs. Switch to Admin to record official Purchase Vouchers.
          </span>
        </div>
      ) : (
        showCreateForm && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-w-4xl w-full my-auto transition-all animate-in zoom-in-95 duration-200">
              <form
                onSubmit={handleSubmitVoucher}
                className="space-y-6"
              >
                {/* Signature Green Banner Header matching Photo */}
                <div className="bg-[#38764B] text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-white/95">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 2H5c-1.1 0-2 .9-2 2v18l3-2 3 2 3-2 3 2 3-2 3 2V4c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V6h10v2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white leading-tight">
                        ESTATE VOUCHERS
                      </h2>
                      <div className="text-xs text-emerald-100/90 font-medium">
                        Voucher Type: PURCHASE
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 font-mono font-bold text-white flex items-center gap-2">
                      <span className="text-emerald-200 text-[10px] uppercase">VOUCHER NO:</span>
                      <input
                        type="text"
                        required
                        value={voucherNo}
                        onChange={(e) => setVoucherNo(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-emerald-950 focus:outline-none"
                      />
                    </div>
                    <span className="bg-white/20 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg uppercase tracking-wider select-none shadow-2xs">
                      NEW ENTRY
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      title="Close Voucher Modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 sm:p-7 pt-0 space-y-6">

            {/* Grid 1: Category, Vendor & Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* Category & Allocation */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" /> Category & Allocation
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Procurement Category</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 hover:underline cursor-pointer"
                      title="Create a new procurement category"
                    >
                      <Plus className="w-3 h-3" />
                      {showAddCategory ? "Select Existing" : "Create Category"}
                    </button>
                  </div>

                  {!showAddCategory ? (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setShowAddCategory(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__NEW__" className="font-semibold text-emerald-700">
                        + Create New Category...
                      </option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Enter category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateCategory(newCategoryName);
                          }
                        }}
                        className="flex-1 p-2 bg-white border border-emerald-500 rounded-lg text-slate-900 font-medium text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateCategory(newCategoryName)}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategory(false);
                          setNewCategoryName("");
                        }}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
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
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Supplier / Dealer Name</label>
                    <Link
                      href="/purchases/retailers"
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline flex items-center gap-1"
                    >
                      <Store className="w-3 h-3" /> Manage Directory
                    </Link>
                  </div>
                  <input
                    type="text"
                    list="registered-vendors"
                    required
                    placeholder="Enter or select vendor / supplier name"
                    value={vendorName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVendorName(val);
                      const matched = parties.find((p) => p.name?.toLowerCase() === val.toLowerCase());
                      if (matched) {
                        if (matched.phone && !vendorContact) setVendorContact(matched.phone);
                        if (matched.gstin && !vendorGstin) setVendorGstin(matched.gstin);
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                  <datalist id="registered-vendors">
                    {parties.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.type} {p.city ? `(${p.city})` : ""}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vendor Bill / Inv #</label>
                    <input
                      type="text"
                      value={vendorBillNo}
                      onChange={(e) => setVendorBillNo(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vendor Contact</label>
                    <input
                      type="text"
                      value={vendorContact}
                      onChange={(e) => setVendorContact(e.target.value)}
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
                  <div className="col-span-4">Material / Service</div>
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
                        {availableUnits.map((u) => (
                          <option key={u.id} value={u.unitSymbol}>
                            {u.unitName} ({u.unitSymbol})
                          </option>
                        ))}
                        {availableUnits.length === 0 && (
                          <option value="units">units</option>
                        )}
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
              <div />

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

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-[#38764B] hover:bg-[#2D603D] text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Save Voucher
              </button>
            </div>
            </div>
          </form>
        </div>
      </div>
    )
      )}

      {/* Main Content Area: Category Grouped View OR Table View */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No purchase vouchers found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the Purchase Voucher form to record your first transaction and generate an official Ranga Estate voucher.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-block px-4 py-2 bg-[#15803d] text-white rounded-lg text-xs font-bold hover:bg-[#166534] cursor-pointer"
          >
            Go to Purchase Voucher
          </button>
        </div>
      ) : viewMode === "grouped" ? (
        /* ========================================================================= */
        /* CATEGORY-WISE DISPLAYED VOUCHERS                                          */
        /* ========================================================================= */
        <div className="space-y-6">
          {categoryGroups.map((group) => {
            if (group.records.length === 0) return null;

            return (
              <div
                key={group.name}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
              >
                {/* Category Header Banner */}
                <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#15803d] text-white flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{group.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {group.records.length} {group.records.length === 1 ? "Voucher" : "Vouchers"}
                        </span>
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-600">
                      Category Total:{" "}
                      <span className="font-extrabold text-sm text-[#15803d]">
                        ₹{group.totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table for this Category */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Voucher No</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Vendor / Supplier</th>
                        <th className="p-3.5">Plot Allocation</th>
                        <th className="p-3.5">Description</th>
                        <th className="p-3.5 text-right">Voucher Cost</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center">Print / Slip</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {group.records.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
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
                            <div className="font-bold text-slate-900">{log.vendorName || "General Supplier"}</div>
                            {log.vendorBillNo && (
                              <div className="text-[11px] text-slate-500 font-mono">Bill: {log.vendorBillNo}</div>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">{log.plotName || "General Estate"}</td>
                          <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate">
                            {log.description}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-900 text-sm text-right">
                            ₹{Number(log.cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-center">
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
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => openSlipModal(log)}
                              title="View Official Voucher Slip"
                              className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="p-3.5 text-center">
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteVoucher(log.id)}
                                title="Void Voucher"
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* FLAT TABLE VIEW                                                           */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Showing {filteredLogs.length} of {logs.length} purchase vouchers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Voucher No</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Category Head</th>
                  <th className="p-3.5">Vendor / Supplier</th>
                  <th className="p-3.5">Plot Allocation</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Voucher Cost</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Print / Slip</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
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
                    <td className="p-3.5 font-mono font-black text-slate-900 text-sm text-right">
                      ₹{Number(log.cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-center">
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
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => openSlipModal(log)}
                        title="View Official Voucher Slip"
                        className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteVoucher(log.id)}
                          title="Void Voucher"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE PURCHASE CATEGORIES                                         */}
      {/* ========================================================================= */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  <Tag className="w-4 h-4" />
                </span>
                <span>Manage Purchase Categories</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCatModalOpen(false);
                  setNewCatName("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="New Category (e.g. Irrigation Spares, Packaging, Tools)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
              />
              <button
                type="submit"
                disabled={savingCat || !newCatName.trim()}
                className="px-4 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{savingCat ? "Adding..." : "Add"}</span>
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Configured Categories ({categories.length})
              </div>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Tag className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{cat}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCatModalOpen(false);
                  setNewCatName("");
                }}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Official Voucher Slip Modal */}
      <VoucherSlipModal
        isOpen={!!activeModalVoucher}
        onClose={() => setActiveModalVoucher(null)}
        voucher={activeModalVoucher}
      />

    </div>
  );
}
