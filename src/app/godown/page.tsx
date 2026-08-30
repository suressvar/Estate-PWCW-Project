"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Warehouse,
  PackageCheck,
  Send,
  History,
  PlusCircle,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Tag,
  ArrowRight,
  TrendingDown,
  X,
  MapPin,
  Sprout,
  ShieldAlert,
  Boxes,
  Truck,
  Fuel,
  FlaskConical,
  Tractor,
  DollarSign,
  Info,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { RoleBadge } from "@/components/ui/role-badge";
import type { GodownItem, GodownStockMovement, PlotItem, PlotCropAssociation } from "@/types/estate";

interface GodownStats {
  totalItems: number;
  inStockItems: number;
  lowStockItems: number;
  exhaustedItems: number;
  totalValuation: number;
  totalMovements: number;
  categoriesCount: number;
}

export default function GodownPage() {
  const [items, setItems] = useState<GodownItem[]>([]);
  const [stats, setStats] = useState<GodownStats>({
    totalItems: 0,
    inStockItems: 0,
    lowStockItems: 0,
    exhaustedItems: 0,
    totalValuation: 0,
    totalMovements: 0,
    categoriesCount: 0,
  });
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [plotCrops, setPlotCrops] = useState<PlotCropAssociation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Issue to Menu Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GodownItem | null>(null);
  const [destinationMenu, setDestinationMenu] = useState("Fertilizer");
  const [issueQuantity, setIssueQuantity] = useState<number | "">("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedPlotCropId, setSelectedPlotCropId] = useState("");
  const [issuedTo, setIssuedTo] = useState("Field Supervisor");
  const [issuing, setIssuing] = useState(false);

  // Direct Inward Modal
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardName, setInwardName] = useState("");
  const [inwardCategory, setInwardCategory] = useState("Fertilizer & Nutrition");
  const [inwardQty, setInwardQty] = useState<number | "">("");
  const [inwardUnit, setInwardUnit] = useState("kg");
  const [inwardRate, setInwardRate] = useState<number | "">("");
  const [inwardVendor, setInwardVendor] = useState("");
  const [inwardLocation, setInwardLocation] = useState("");
  const [inwardMinAlert, setInwardMinAlert] = useState<number | "">(5);
  const [inwarding, setInwarding] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    targetRoute?: string;
    targetMenu?: string;
  } | null>(null);

  // RBAC
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gdnRes, plotsRes, pcRes, unitsRes] = await Promise.all([
        fetch("/api/godown/items"),
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
        fetch("/api/units"),
      ]);

      const gdnData = await gdnRes.json();
      const plotsData = await plotsRes.json();
      const pcData = await pcRes.json();
      const unitsData = await unitsRes.json().catch(() => []);

      setItems(Array.isArray(gdnData.items) ? gdnData.items : []);
      if (gdnData.stats) setStats(gdnData.stats);
      setPlots(Array.isArray(plotsData) ? plotsData : []);
      setPlotCrops(Array.isArray(pcData) ? pcData : []);
      if (Array.isArray(unitsData) && unitsData.length > 0) {
        setAvailableUnits(unitsData);
      }

      if (Array.isArray(plotsData) && plotsData.length > 0) {
        setSelectedPlotId(plotsData[0].id);
        const filtered = Array.isArray(pcData) ? pcData.filter((p: any) => p.plotId === plotsData[0].id) : [];
        if (filtered.length > 0) setSelectedPlotCropId(filtered[0].id);
      }
    } catch (err) {
      console.error("Failed to load godown data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update crop activities when plot changes
  useEffect(() => {
    if (!selectedPlotId) return;
    const filtered = plotCrops.filter((p) => p.plotId === selectedPlotId);
    if (filtered.length > 0) {
      setSelectedPlotCropId(filtered[0].id);
    } else {
      setSelectedPlotCropId("");
    }
  }, [selectedPlotId, plotCrops]);

  // Open Issue Modal for a specific item
  const openIssueModal = (item: GodownItem) => {
    setSelectedItem(item);
    setIssueQuantity(item.availableQuantity > 0 ? Math.min(10, item.availableQuantity) : 0);

    // Smart default destination menu based on item category
    const cat = item.category.toLowerCase();
    const name = item.name.toLowerCase();
    if (cat.includes("fertilizer") || name.includes("urea") || name.includes("npk")) {
      setDestinationMenu("Fertilizer");
    } else if (cat.includes("diesel") || cat.includes("fuel") || name.includes("diesel")) {
      setDestinationMenu("Diesel");
    } else if (cat.includes("machinery") || name.includes("blade") || name.includes("spare")) {
      setDestinationMenu("Machinery");
    } else {
      setDestinationMenu("General Purchases / Plot Ops");
    }

    setShowIssueModal(true);
  };

  // Handle Issue Submission
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qty = Number(issueQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid issue quantity.");
      return;
    }

    if (qty > selectedItem.availableQuantity) {
      alert(`Requested quantity (${qty}) exceeds available Godown stock (${selectedItem.availableQuantity} ${selectedItem.unit}).`);
      return;
    }

    try {
      setIssuing(true);
      const activePlot = plots.find((p) => p.id === selectedPlotId);
      const activeCrop = plotCrops.find((c) => c.id === selectedPlotCropId);

      const payload = {
        godownItemId: selectedItem.id,
        destinationMenu,
        quantity: qty,
        date: issueDate,
        plotId: selectedPlotId,
        plotName: activePlot ? activePlot.name : "General Estate",
        cropActivityId: selectedPlotCropId,
        cropActivityName: activeCrop ? activeCrop.cropActivityName : "Plot Operations",
        issuedTo,
        notes: "",
      };

      const res = await fetch("/api/godown/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setShowIssueModal(false);

        const routeMap: Record<string, string> = {
          Fertilizer: "/fertilizer",
          Diesel: "/diesel",
          Machinery: "/machinery",
        };

        setFeedback({
          type: "success",
          message: `Issued ${qty} ${selectedItem.unit} of "${selectedItem.name}" to ${destinationMenu}!`,
          targetRoute: routeMap[destinationMenu] || "/godown",
          targetMenu: destinationMenu,
        });

        fetchData();
        setTimeout(() => setFeedback(null), 8000);
      } else {
        alert(data.error || "Failed to issue item.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while issuing.");
    } finally {
      setIssuing(false);
    }
  };

  // Handle Manual Inward Submission
  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardName.trim()) {
      alert("Please enter item name.");
      return;
    }

    try {
      setInwarding(true);
      const payload = {
        name: inwardName.trim(),
        category: inwardCategory,
        quantity: Number(inwardQty) || 1,
        unit: inwardUnit,
        ratePerUnit: Number(inwardRate) || 0,
        vendorName: inwardVendor || "Direct Procurement",
        location: inwardLocation || "Godown Main Central Bay",
        minStockAlert: Number(inwardMinAlert) || 5,
        notes: "",
      };

      const res = await fetch("/api/godown/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowInwardModal(false);
        setInwardName("");
        setInwardQty("");
        setInwardRate("");
        setInwardVendor("");
        setInwardLocation("");
        setFeedback({
          type: "success",
          message: `Successfully received "${payload.name}" into Godown!`,
        });
        fetchData();
        setTimeout(() => setFeedback(null), 5000);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to add inward item.");
      }
    } catch (err: any) {
      alert(err.message || "Error adding item to Godown.");
    } finally {
      setInwarding(false);
    }
  };

  // Filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.vendorName && item.vendorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.sourceVoucherNo && item.sourceVoucherNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-emerald-900/10 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Estate Godown Store</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Central Warehouse
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & RBAC */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium">Role:</span>
            <RoleBadge role={roleName} />
            <button
              onClick={() => {
                setCanEdit(!canEdit);
                setRoleName(canEdit ? "Field Staff" : "Admin");
              }}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
            >
              Toggle
            </button>
          </div>

          <Link
            href="/godown/movements"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Movements Register</span>
          </Link>

          <button
            onClick={() => setShowInwardModal(true)}
            disabled={!canEdit}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>Inward Stock</span>
          </button>

          <Link
            href="/godown/issue"
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Issue to Menus</span>
          </Link>
        </div>
      </div>

      {/* Access Restriction Notice */}
      {!canEdit && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Access Restricted: Field staff mode allows viewing stock balances and movements. Switch to Admin role to issue or inward items.</span>
        </div>
      )}

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border shadow-xs animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-sm block">{feedback.message}</span>
              <span className="text-slate-600 text-[11px]">
                The transaction log has been automatically recorded in the {feedback.targetMenu} module with live stock balance updated.
              </span>
            </div>
          </div>
          {feedback.targetRoute && (
            <Link
              href={feedback.targetRoute}
              className="px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg font-semibold flex items-center gap-1 shrink-0 ml-4 transition-colors"
            >
              <span>View in {feedback.targetMenu}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stored Items"
          value={stats.totalItems}
          subtitle={`${stats.categoriesCount} categories stored in Godown`}
          icon={Boxes}
        />
        <StatCard
          title="Total Godown Valuation"
          value={`₹${stats.totalValuation.toLocaleString("en-IN")}`}
          subtitle="Value of currently available balances"
          icon={DollarSign}
        />
        <StatCard
          title="Adequate Stock"
          value={stats.inStockItems}
          change={`${Math.round((stats.inStockItems / Math.max(1, stats.totalItems)) * 100)}% Optimum`}
          isPositive={true}
          subtitle="Items above minimum alert threshold"
          icon={PackageCheck}
        />
        <StatCard
          title="Low / Exhausted Alerts"
          value={stats.lowStockItems + stats.exhaustedItems}
          change={stats.lowStockItems > 0 ? `${stats.lowStockItems} Low, ${stats.exhaustedItems} Out` : "Safe Levels"}
          isPositive={stats.lowStockItems + stats.exhaustedItems === 0}
          subtitle="Requires purchase requisition"
          icon={AlertTriangle}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Godown items, categories, rack location, vendor, or voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock (Adequate)</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="EXHAUSTED">Exhausted / Zero Stock</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setCategoryFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
            categoryFilter === "ALL"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Categories ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Stock Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Godown Stock Ledger ({filteredItems.length} items)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Auto-synced with Purchases & Plot Issue Logs
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading Godown inventory records...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Warehouse className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No Godown stock items found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Items purchased through the Purchases vouchers or entered directly will automatically appear here.
            </p>
            <button
              onClick={() => setShowInwardModal(true)}
              className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
            >
              Inward First Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Item Name & Category</th>
                  <th className="p-3.5">Godown Location</th>
                  <th className="p-3.5 text-right">Available Balance</th>
                  <th className="p-3.5 text-right">Unit Rate</th>
                  <th className="p-3.5 text-right">Stock Valuation</th>
                  <th className="p-3.5">Source / Vendor</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => {
                  const percentLeft = item.totalReceivedQuantity > 0
                    ? Math.min(100, Math.round((item.availableQuantity / item.totalReceivedQuantity) * 100))
                    : 0;

                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                      {/* Name & Category */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {item.category}
                          </span>
                          {item.sourceVoucherNo && (
                            <span className="text-slate-400 font-mono text-[10px]">
                              {item.sourceVoucherNo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Inward: {item.receivedDate}
                        </div>
                      </td>

                      {/* Available Balance */}
                      <td className="p-3.5 text-right">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.availableQuantity.toLocaleString("en-IN")} {item.unit}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          of {item.totalReceivedQuantity.toLocaleString("en-IN")} {item.unit} inward
                        </div>
                        {/* Balance Progress Bar */}
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === "IN_STOCK"
                                ? "bg-emerald-600"
                                : item.status === "LOW_STOCK"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${percentLeft}%` }}
                          />
                        </div>
                      </td>

                      {/* Unit Rate */}
                      <td className="p-3.5 text-right font-medium text-slate-800">
                        ₹{item.ratePerUnit.toLocaleString("en-IN")}
                        <span className="text-[11px] text-slate-400 block font-normal">per {item.unit}</span>
                      </td>

                      {/* Stock Valuation */}
                      <td className="p-3.5 text-right">
                        <div className="font-bold text-emerald-800 text-sm">
                          ₹{item.totalValue.toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Available Asset
                        </span>
                      </td>

                      {/* Vendor / Source */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 truncate max-w-[150px]">
                          {item.vendorName || "Vendor Purchase"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {item.status === "IN_STOCK" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ● In Stock
                          </span>
                        )}
                        {item.status === "LOW_STOCK" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ▲ Low Stock
                          </span>
                        )}
                        {item.status === "EXHAUSTED" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            ✕ Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => openIssueModal(item)}
                          disabled={!canEdit || item.availableQuantity <= 0}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-all shadow-2xs flex items-center gap-1 mx-auto disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Issue this item to appropriate operational menu"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Issue to Menu</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ISSUE TO MENU MODAL */}
      {/* ========================================================= */}
      {showIssueModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base">Issue Godown Item to Menu</h3>
                  <p className="text-xs text-emerald-200">
                    Dispatch stock to operational field logs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-emerald-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-6 space-y-4">
              {/* Item Info Summary Card */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-sm">{selectedItem.name}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-semibold text-[11px]">
                    {selectedItem.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span>Available in Godown:</span>
                  <span className="font-bold text-emerald-900">
                    {selectedItem.availableQuantity} {selectedItem.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Storage Bay:</span>
                  <span>{selectedItem.location}</span>
                </div>
              </div>

              {/* Destination Menu Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Target Menu / Module</span>
                  <span className="text-emerald-700 font-normal text-[11px]">(Auto-detected)</span>
                </label>
                <select
                  value={destinationMenu}
                  onChange={(e) => setDestinationMenu(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Fertilizer">Plot Operations → Fertilizer (/fertilizer)</option>
                  <option value="Diesel">Plot Operations → Diesel (/diesel)</option>
                  <option value="Machinery">Plot Operations → Machinery (/machinery)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  This transaction will automatically be created in the selected destination menu.
                </p>
              </div>

              {/* Quantity to Issue */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Quantity to Issue ({selectedItem.unit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.1"
                    max={selectedItem.availableQuantity}
                    value={issueQuantity}
                    onChange={(e) => setIssueQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-slate-500">
                    Max: {selectedItem.availableQuantity} {selectedItem.unit}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Plot & Crop Activity Target */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Plot *</label>
                  <select
                    value={selectedPlotId}
                    onChange={(e) => setSelectedPlotId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Crop / Activity</label>
                  <select
                    value={selectedPlotCropId}
                    onChange={(e) => setSelectedPlotCropId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    {plotCrops
                      .filter((pc) => !selectedPlotId || pc.plotId === selectedPlotId)
                      .map((pc) => (
                        <option key={pc.id} value={pc.id}>
                          {pc.cropActivityName}
                        </option>
                      ))}
                    <option value="">General Estate (Unassigned)</option>
                  </select>
                </div>
              </div>

              {/* Issued To / Recipient */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Issued To / Recipient</label>
                <input
                  type="text"
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  placeholder="e.g. Field Supervisor, Tractor Driver, Irrigation Crew"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {issuing ? "Issuing..." : "Confirm & Add to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIRECT INWARD MODAL */}
      {/* ========================================================= */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base">Direct Godown Inward</h3>
                  <p className="text-xs text-emerald-200">
                    Receive stock directly into warehouse inventory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInwardModal(false)}
                className="text-emerald-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="p-6 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Item Name *</label>
                <input
                  type="text"
                  required
                  value={inwardName}
                  onChange={(e) => setInwardName(e.target.value)}
                  placeholder="e.g. Urea 46% Nitrogen Fertilizer"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category *</label>
                  <select
                    value={inwardCategory}
                    onChange={(e) => setInwardCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="Fertilizer & Nutrition">Fertilizer & Nutrition</option>
                    <option value="Diesel & Fuel">Diesel & Fuel</option>
                    <option value="Machinery Spares & Repairs">Machinery Spares & Repairs</option>
                    <option value="Irrigation & Piping">Irrigation & Piping</option>
                    <option value="Seeds & Saplings">Seeds & Saplings</option>
                    <option value="Pesticides & Bio">Pesticides & Bio</option>
                    <option value="Tools & Hardware">Tools & Hardware</option>
                    <option value="General Estate Supplies">General Estate Supplies</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Storage Location</label>
                  <input
                    type="text"
                    value={inwardLocation}
                    onChange={(e) => setInwardLocation(e.target.value)}
                    placeholder="e.g. Godown Bay A-2"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="50"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Unit *</label>
                  <select
                    required
                    value={inwardUnit}
                    onChange={(e) => setInwardUnit(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-700"
                  >
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.unitSymbol}>
                        {u.unitName} ({u.unitSymbol})
                      </option>
                    ))}
                    {availableUnits.length === 0 && (
                      <option value="kg">kg</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Rate / Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="45"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={inwardVendor}
                    onChange={(e) => setInwardVendor(e.target.value)}
                    placeholder="Vendor name"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Min Alert Threshold</label>
                  <input
                    type="number"
                    value={inwardMinAlert}
                    onChange={(e) => setInwardMinAlert(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inwarding}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {inwarding ? "Receiving..." : "Inward into Godown"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
