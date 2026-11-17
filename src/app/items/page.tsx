"use client";
import { errorMessage as getErrorMessage } from "@/lib/errors";

import { StatCard } from "@/components/ui/stat-card";
import { CropItem,PlotItem } from "@/lib/db-storage";
import { OperationItem } from "@/lib/operation-items-data";
import {
AlertCircle,
Boxes,
Check,
CheckCircle2,
Copy,
Edit2,
Layers,
LayoutGrid,
List,
Plus,
RefreshCw,
Search,
Sparkles,
Sprout,
Tag,
Trash2,
X
} from "lucide-react";
import React,{ useCallback,useEffect,useState } from "react";

export default function PlotOperationItemsPage() {
  const [items, setItems] = useState<OperationItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    codedItems: 0,
    uncodedItems: 0,
    activeItems: 0,
    categoriesCount: 0,
    totalStockValuation: 0,
  });
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Views
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAssignCodeModal, setShowAssignCodeModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<OperationItem | null>(null);
  const [targetItemForCode, setTargetItemForCode] = useState<OperationItem | null>(null);

  // Form state for Add / Edit Item
  const [itemForm, setItemForm] = useState<{
    itemCode: string;
    name: string;
    category: string;
    unit: string;
    defaultRate: string;
    minStockAlert: string;
    currentStock: string;
    status: "ACTIVE" | "INACTIVE";
    description: string;
    plotId: string;
    cropActivityId: string;
  }>({
    itemCode: "",
    name: "",
    category: "Fertilizer & Nutrition",
    unit: "KG",
    defaultRate: "",
    minStockAlert: "5",
    currentStock: "0",
    status: "ACTIVE",
    description: "",
    plotId: "",
    cropActivityId: "",
  });

  // State for Code Assignment Modal
  const [assignCodeValue, setAssignCodeValue] = useState<string>("");
  const [codeError, setCodeError] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, plotsRes, cropsRes] = await Promise.all([
        fetch("/api/operation-items"),
        fetch("/api/plots"),
        fetch("/api/crops"),
      ]);

      const itemsData = await itemsRes.json();
      const plotsData = await plotsRes.json();
      const cropsData = await cropsRes.json();

      if (itemsData.success) {
        setItems(itemsData.items || []);
        if (itemsData.stats) setStats(itemsData.stats);
        if (itemsData.categories) setCategories(itemsData.categories);
      }

      setPlots(Array.isArray(plotsData) ? plotsData : []);
      setCrops(Array.isArray(cropsData) ? cropsData : []);
    } catch (err) {
      console.error("Failed to fetch plot items data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => { dispose = (() => {
    fetchData();
  })(); }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, [fetchData]);

  // Auto-generate code helper
  const handleAutoGenerateCode = async (cat: string) => {
    try {
      const res = await fetch(`/api/operation-items?nextCodeFor=${encodeURIComponent(cat)}`);
      const data = await res.json();
      if (data.success && data.nextCode) {
        return data.nextCode;
      }
    } catch (e) {
      console.error(e);
    }
    return "";
  };

  const openCreateModal = async () => {
    const defaultCat = "Fertilizer & Nutrition";
    const nextCode = await handleAutoGenerateCode(defaultCat);
    setItemForm({
      itemCode: nextCode,
      name: "",
      category: defaultCat,
      unit: "KG",
      defaultRate: "",
      minStockAlert: "5",
      currentStock: "0",
      status: "ACTIVE",
      description: "",
      plotId: "",
      cropActivityId: "",
    });
    setEditingItem(null);
    setFormError("");
    setShowAddModal(true);
  };

  const openEditModal = (item: OperationItem) => {
    setEditingItem(item);
    setItemForm({
      itemCode: item.itemCode,
      name: item.name,
      category: item.category,
      unit: item.unit,
      defaultRate: item.defaultRate !== undefined ? String(item.defaultRate) : "",
      minStockAlert: item.minStockAlert !== undefined ? String(item.minStockAlert) : "5",
      currentStock: item.currentStock !== undefined ? String(item.currentStock) : "0",
      status: item.status,
      description: item.description || "",
      plotId: item.plotId || "",
      cropActivityId: item.cropActivityId || "",
    });
    setFormError("");
    setShowAddModal(true);
  };

  const openAssignCodeModal = async (item: OperationItem) => {
    setTargetItemForCode(item);
    setAssignCodeValue(item.itemCode || "");
    setCodeError("");
    setShowAssignCodeModal(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Submit Add / Edit Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!itemForm.name.trim()) {
      setFormError("Item name is required.");
      return;
    }

    if (!itemForm.itemCode.trim()) {
      setFormError("Item code is required.");
      return;
    }

    const selectedPlot = plots.find((p) => p.id === itemForm.plotId);
    const selectedCrop = crops.find((c) => c.id === itemForm.cropActivityId);

    const payload = {
      itemCode: itemForm.itemCode.trim().toUpperCase(),
      name: itemForm.name.trim(),
      category: itemForm.category,
      unit: itemForm.unit,
      defaultRate: itemForm.defaultRate ? parseFloat(itemForm.defaultRate) : 0,
      minStockAlert: itemForm.minStockAlert ? parseFloat(itemForm.minStockAlert) : 5,
      currentStock: itemForm.currentStock ? parseFloat(itemForm.currentStock) : 0,
      status: itemForm.status,
      description: itemForm.description.trim(),
      plotId: itemForm.plotId || undefined,
      plotName: selectedPlot?.name || undefined,
      cropActivityId: itemForm.cropActivityId || undefined,
      cropActivityName: selectedCrop?.name || undefined,
    };

    try {
      let res;
      if (editingItem) {
        res = await fetch(`/api/operation-items/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/operation-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!data.success) {
        setFormError(data.error || "Failed to save item.");
        return;
      }

      setShowAddModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err) || "An unexpected error occurred.");
    }
  };

  // Submit Code Assignment
  const handleSaveAssignedCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItemForCode) return;
    setCodeError("");

    const trimmed = assignCodeValue.trim().toUpperCase();
    if (!trimmed) {
      setCodeError("Item code cannot be empty.");
      return;
    }

    try {
      const res = await fetch("/api/operation-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_code",
          id: targetItemForCode.id,
          itemCode: trimmed,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setCodeError(data.error || "Failed to assign item code.");
        return;
      }

      setShowAssignCodeModal(false);
      setTargetItemForCode(null);
      fetchData();
    } catch (err) {
      setCodeError(getErrorMessage(err) || "An unexpected error occurred.");
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/operation-items/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete item.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting item.");
    }
  };

  // Filter items in memory
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const codeMatch = item.itemCode.toLowerCase().includes(q);
      const nameMatch = item.name.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const catMatch = item.category.toLowerCase().includes(q);
      const plotMatch = item.plotName?.toLowerCase().includes(q);
      if (!codeMatch && !nameMatch && !descMatch && !catMatch && !plotMatch) return false;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Plot Operations — Items Master
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData()}
            className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Reload Items"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Items"
          value={stats.totalItems.toString()}
          description="Operational supplies & inputs"
          icon={<Boxes className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Assigned Item Codes"
          value={stats.codedItems.toString()}
          description="Unique operational SKU codes"
          icon={<Tag className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Active Farm Items"
          value={stats.activeItems.toString()}
          description="Ready for field application"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Supply Categories"
          value={stats.categoriesCount.toString()}
          description="Fertilizers, seeds, diesel & tools"
          icon={<Layers className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Filters & View Switcher */}
      <div className="bg-card border border-border/60 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code (e.g. FERT-001), item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="text-xs text-muted-foreground">
            Items: <span className="font-bold text-foreground font-mono">{filteredItems.length}</span>
          </div>

          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "cards"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Cards or Table */}
      {viewMode === "cards" ? (
        filteredItems.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-xl p-12 text-center text-muted-foreground">
            <Boxes className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No items found matching your filters.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add New Item&quot; to register a new operational item.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border/60 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group hover:border-emerald-500/50"
              >
                <div>
                  {/* Top: Item Code & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                      <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono text-xs font-bold">{item.itemCode}</span>
                      <button
                        onClick={() => handleCopyCode(item.itemCode)}
                        className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 ml-0.5 cursor-pointer"
                        title="Copy Item Code"
                      >
                        {copiedCode === item.itemCode ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Name & Category */}
                  <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {item.name}
                  </h3>
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    {item.category}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Specs & Pricing Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-border/40 text-[11px]">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                        Unit of Measure
                      </span>
                      <div className="font-medium text-foreground">{item.unit}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                        Default Rate
                      </span>
                      <div className="font-mono font-bold text-foreground">
                        {item.defaultRate ? `₹${item.defaultRate.toLocaleString()}` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Plot / Crop Tag */}
                  {(item.plotName || item.cropActivityName) && (
                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Sprout className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate">
                        {item.plotName || "All Plots"} {item.cropActivityName ? `• ${item.cropActivityName}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openAssignCodeModal(item)}
                    className="flex-1 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Assign or Change Item Code"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Assign Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-1.5 border border-border rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Table View */
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Default Rate</th>
                  <th className="py-3 px-4">Associated Plot / Crop</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No operational items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold">
                          <span>{item.itemCode}</span>
                          <button
                            onClick={() => handleCopyCode(item.itemCode)}
                            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedCode === item.itemCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-muted-foreground max-w-xs truncate font-normal">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-medium">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">{item.unit}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-foreground font-mono">
                        {item.defaultRate ? `₹${item.defaultRate.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {item.plotName || item.cropActivityName ? (
                          <span className="text-[11px]">
                            {item.plotName || "All Plots"} {item.cropActivityName ? `• ${item.cropActivityName}` : ""}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/50">Estate-wide</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => openAssignCodeModal(item)}
                          className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded transition-colors cursor-pointer"
                          title="Assign or Change Item Code"
                        >
                          Code
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete Item"
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
      )}

      {/* MODAL 1: ADD / EDIT ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  {editingItem ? "Edit Operational Item" : "Register New Plot Operation Item"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Define item details, assign SKU code, and associate with plot activities
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Item Code (with Auto-Generate Button) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Item Code (SKU) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = await handleAutoGenerateCode(itemForm.category);
                      if (next) setItemForm((prev) => ({ ...prev, itemCode: next }));
                    }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate Code
                  </button>
                </div>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. FERT-001, DIES-002, SEED-001"
                    value={itemForm.itemCode}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        itemCode: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Unique identifier used across farm store, logs, and purchase vouchers.
                </p>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urea 46% N, High Speed Diesel, Hybrid Maize Seeds"
                  value={itemForm.name}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={async (e) => {
                      const newCat = e.target.value;
                      setItemForm((prev) => ({ ...prev, category: newCat }));
                      if (!editingItem) {
                        const next = await handleAutoGenerateCode(newCat);
                        if (next) setItemForm((prev) => ({ ...prev, category: newCat, itemCode: next }));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Unit of Measure</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="KG">KG (Kilograms)</option>
                    <option value="Litres">Litres</option>
                    <option value="Bags">Bags</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Bundles">Bundles</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Packets">Packets</option>
                    <option value="Grams">Grams</option>
                    <option value="Dose">Dose</option>
                    <option value="Units">Units</option>
                  </select>
                </div>
              </div>

              {/* Default Rate & Min Stock Alert */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Default Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemForm.defaultRate}
                    onChange={(e) =>
                      setItemForm((prev) => ({ ...prev, defaultRate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    placeholder="5"
                    value={itemForm.minStockAlert}
                    onChange={(e) =>
                      setItemForm((prev) => ({ ...prev, minStockAlert: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
                  <select
                    value={itemForm.status}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        status: e.target.value as "ACTIVE" | "INACTIVE",
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Optional Plot / Crop Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Default Plot Link (Optional)
                  </label>
                  <select
                    value={itemForm.plotId}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, plotId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Estate-Wide / Unlinked --</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Default Crop Activity (Optional)
                  </label>
                  <select
                    value={itemForm.cropActivityId}
                    onChange={(e) =>
                      setItemForm((prev) => ({ ...prev, cropActivityId: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- All Crops / None --</option>
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Application details, dosage, technical specifications..."
                  value={itemForm.description}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingItem ? "Update Item" : "Create Item & Assign Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN ITEM CODE MODAL */}
      {showAssignCodeModal && targetItemForCode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  Assign / Change Item Code
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Update the unique SKU code for this operational item
                </p>
              </div>
              <button
                onClick={() => setShowAssignCodeModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignedCode} className="p-5 space-y-4">
              {codeError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{codeError}</span>
                </div>
              )}

              {/* Item Info Box */}
              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                <div className="text-xs font-bold text-foreground">{targetItemForCode.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Category: <span className="font-medium text-foreground">{targetItemForCode.category}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Current Code:{" "}
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {targetItemForCode.itemCode}
                  </span>
                </div>
              </div>

              {/* New Item Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    New Item Code <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = await handleAutoGenerateCode(targetItemForCode.category);
                      if (next) setAssignCodeValue(next);
                    }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={assignCodeValue}
                    onChange={(e) => setAssignCodeValue(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                    placeholder="e.g. FERT-001"
                  />
                </div>
              </div>

              {/* Quick Prefix Buttons */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1.5">
                  Standard Category Prefixes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "FERT-", name: "Fertilizer" },
                    { label: "DIES-", name: "Diesel" },
                    { label: "PEST-", name: "Pesticide" },
                    { label: "SEED-", name: "Seeds" },
                    { label: "TOOL-", name: "Tools" },
                    { label: "SPAR-", name: "Spares" },
                    { label: "IRR-", name: "Irrigation" },
                  ].map((pfx) => (
                    <button
                      key={pfx.label}
                      type="button"
                      onClick={() => setAssignCodeValue(pfx.label)}
                      className="px-2 py-1 text-[11px] bg-muted/60 hover:bg-muted text-foreground border border-border/80 rounded-md font-mono cursor-pointer"
                      title={pfx.name}
                    >
                      {pfx.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAssignCodeModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Confirm & Assign Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
