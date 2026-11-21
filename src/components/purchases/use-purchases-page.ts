"use client";

import { csvDocument, csvDataUri } from "@/lib/csv";

import type { VoucherSlipData } from "@/components/voucher-slip-modal";
import type { ExpenseUnit } from "@/types/storage";
import type { PartyItem, PlotCropAssociation, PlotItem, PurchaseVoucherItem, VoucherLineItem } from "@/types/estate";
import { DEFAULT_PURCHASE_CATEGORIES } from "@/types/estate";
import React, { useEffect, useState } from "react";



export function usePurchasesPage() {
  const [logs, setLogs] = useState<PurchaseVoucherItem[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const canEdit = true;
  const roleName = "Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const statusFilter = "ALL";
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "grouped" | "table">("cards");
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
  const taxPercent = 0;
  const discount = 0;

  const [availableUnits, setAvailableUnits] = useState<ExpenseUnit[]>([]);
  const [parties, setParties] = useState<PartyItem[]>([]);

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
      const unitsData: ExpenseUnit[] = await unitsRes.json().catch(() => []);
      const partiesData: PartyItem[] = await partiesRes.json().catch(() => []);

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
            (p: PartyItem) => p.name?.toLowerCase() === vendorParam.toLowerCase()
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
    } catch (err) {
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

    const encodedUri = csvDataUri(csvDocument(headers, rows));
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

    const response = await fetch("/api/purchase-vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json();
      setMsg({ type: "error", text: result.error || "Unable to save the purchase voucher." });
      return;
    }
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
      const response = await fetch(`/api/purchase-vouchers?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json();
        setMsg({ type: "error", text: result.error || "Unable to delete this voucher." });
        return;
      }
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
  const filteredLogs = (() => {
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
  })();

  const totalCost = filteredLogs.reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
  const totalTransactions = filteredLogs.length;

  // Category wise breakdown for summary & grouped view
  const categoryGroups = (() => {
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
  })();

  return {
    setCatModalOpen,
    exportCSV,
    filteredLogs,
    setShowCreateForm,
    msg,
    totalCost,
    totalTransactions,
    categories,
    setCategoryFilter,
    categoryFilter,
    logs,
    searchTerm,
    setSearchTerm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    setViewMode,
    viewMode,
    canEdit,
    showCreateForm,
    handleSubmitVoucher,
    voucherNo,
    setVoucherNo,
    setShowAddCategory,
    showAddCategory,
    category,
    setCategory,
    newCategoryName,
    setNewCategoryName,
    handleCreateCategory,
    selectedPlotId,
    handlePlotChange,
    plots,
    selectedPlotCropId,
    setSelectedPlotCropId,
    associations,
    vendorName,
    setVendorName,
    parties,
    vendorContact,
    setVendorContact,
    vendorGstin,
    setVendorGstin,
    vendorBillNo,
    setVendorBillNo,
    date,
    setDate,
    paymentMode,
    setPaymentMode,
    paymentStatus,
    setPaymentStatus,
    items,
    addItemRow,
    handleItemChange,
    availableUnits,
    removeItemRow,
    subtotal,
    grandTotal,
    openSlipModal,
    categoryGroups,
    handleDeleteVoucher,
    catModalOpen,
    setNewCatName,
    handleAddCategory,
    newCatName,
    savingCat,
    handleDeleteCategory,
    activeModalVoucher,
    setActiveModalVoucher,
  };
}

export type PurchasesPageState = ReturnType<typeof usePurchasesPage>;
