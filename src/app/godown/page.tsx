"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  History,
  MapPin,
  PackageCheck,
  PlusCircle,
  Search,
  Send,
  ShieldAlert,
  Warehouse,
  X,
} from "lucide-react";
import type { ExpenseUnit } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import type { GodownItem, PlotCropAssociation, PlotItem } from "@/types/estate";

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
  const [issuedTo] = useState("Field Supervisor");
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
  const [availableUnits, setAvailableUnits] = useState<ExpenseUnit[]>([]);

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
        const filtered = Array.isArray(pcData) ? pcData.filter((p: PlotCropAssociation) => p.plotId === plotsData[0].id) : [];
        if (filtered.length > 0) setSelectedPlotCropId(filtered[0].id);
      }
    } catch (err) {
      console.error("Failed to load godown data:", err);
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  // Update crop activities when plot changes
  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        if (!selectedPlotId) return;
        const filtered = plotCrops.filter((p) => p.plotId === selectedPlotId);
        if (filtered.length > 0) {
          setSelectedPlotCropId(filtered[0].id);
        } else {
          setSelectedPlotCropId("");
        }
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [selectedPlotId, plotCrops]);

  // Open Issue Modal for a specific item
  const openIssueModal = (item: GodownItem) => {
    setSelectedItem(item);
    setIssueQuantity(item.availableQuantity > 0 ? Math.min(10, item.availableQuantity) : 0);

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
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err) || "An error occurred while issuing.");
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
    } catch (err) {
      alert(getErrorMessage(err) || "Error adding item to Godown.");
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
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title="Godown & Central Store"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Godown Inventory" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
              <span className="text-xs text-[#64748B] font-medium">Role:</span>
              <RoleBadge role={roleName} />
              <button
                onClick={() => {
                  setCanEdit(!canEdit);
                  setRoleName(canEdit ? "Field Staff" : "Admin");
                }}
                className="text-[11px] font-semibold text-[#64748B] hover:text-[#111827] bg-[#F1F5F9] hover:bg-[#E2E8F0] px-2 py-0.5 rounded transition-colors"
              >
                Toggle
              </button>
            </div>

            <Link
              href="/godown/movements"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111827] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg transition-colors shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Movements Register</span>
            </Link>

            <button
              onClick={() => setShowInwardModal(true)}
              disabled={!canEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#174D3C] bg-[#EAF3EE] hover:bg-[#D5E8DD] border border-[#C5DEC8] rounded-lg transition-colors disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Inward Stock</span>
            </button>

            <Link
              href="/godown/issue"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#174D3C] hover:bg-[#103C30] rounded-lg shadow-2xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Issue to Menus</span>
            </Link>
          </div>
        }
      />

      {/* Access Restriction Notice */}
      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Access Restricted: Field staff mode allows viewing stock balances and movements. Switch to Admin role to issue or inward items.</span>
        </div>
      )}

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border shadow-2xs ${
            feedback.type === "success"
              ? "bg-[#EAF3EE] border-[#C5DEC8] text-[#174D3C]"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#174D3C] shrink-0" />
            <div>
              <span className="font-semibold text-xs block text-[#111827]">{feedback.message}</span>
              <span className="text-[#64748B] text-[11px]">
                The transaction log has been automatically recorded in the {feedback.targetMenu} module with live stock balance updated.
              </span>
            </div>
          </div>
          {feedback.targetRoute && (
            <Link
              href={feedback.targetRoute}
              className="px-2.5 py-1 bg-[#174D3C] text-white hover:bg-[#103C30] rounded-md font-medium text-[11px] flex items-center gap-1 shrink-0 ml-4 transition-colors"
            >
              <span>View in {feedback.targetMenu}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stored Items"
          value={stats.totalItems}
          subtitle={`${stats.categoriesCount} categories stored`}
          icon={Boxes}
        />
        <StatCard
          title="Godown Valuation"
          value={`₹${stats.totalValuation.toLocaleString("en-IN")}`}
          subtitle="Value of available balances"
          icon={DollarSign}
        />
        <StatCard
          title="Adequate Stock"
          value={stats.inStockItems}
          change={`${Math.round((stats.inStockItems / Math.max(1, stats.totalItems)) * 100)}%`}
          isPositive={true}
          subtitle="Above alert threshold"
          icon={PackageCheck}
        />
        <StatCard
          title="Stock Alerts"
          value={stats.lowStockItems + stats.exhaustedItems}
          change={stats.lowStockItems > 0 ? `${stats.lowStockItems} Low` : "Safe"}
          isPositive={stats.lowStockItems + stats.exhaustedItems === 0}
          subtitle="Requires requisition"
          icon={AlertTriangle}
        />
      </div>

      {/* Main Content Card: Inventory & Search */}
      <ContentCard
        title="Stock Inventory Ledger"
        badge={`${filteredItems.length} items`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock (Adequate)</option>
              <option value="LOW_STOCK">Low Stock Alert</option>
              <option value="EXHAUSTED">Exhausted / Zero Stock</option>
            </select>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Search bar & Category filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search items, categories, location, vendor, or voucher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#111827]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                categoryFilter === "ALL"
                  ? "bg-[#174D3C] text-white"
                  : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#111827]"
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
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#174D3C] text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#111827]"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1 rounded ${isActive ? "bg-[#103C30] text-white" : "bg-[#E2E8F0] text-[#64748B]"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stock Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748B]">Loading Godown inventory records...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto">
                <Warehouse className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-[#111827]">No Godown stock items found</p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Items purchased through Purchases vouchers or inwarded manually will appear here.
              </p>
              <button
                onClick={() => setShowInwardModal(true)}
                className="px-3 py-1.5 bg-[#174D3C] text-white rounded-lg text-xs font-medium hover:bg-[#103C30]"
              >
                Inward First Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Item & Category</th>
                    <th className="py-2.5 px-4 font-medium">Location</th>
                    <th className="py-2.5 px-4 font-medium text-right">Available Balance</th>
                    <th className="py-2.5 px-4 font-medium text-right">Unit Rate</th>
                    <th className="py-2.5 px-4 font-medium text-right">Valuation</th>
                    <th className="py-2.5 px-4 font-medium">Vendor</th>
                    <th className="py-2.5 px-4 font-medium text-center">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                  {filteredItems.map((item) => {
                    const percentLeft =
                      item.totalReceivedQuantity > 0
                        ? Math.min(100, Math.round((item.availableQuantity / item.totalReceivedQuantity) * 100))
                        : 0;

                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* Name & Category */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111827] text-xs">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#64748B]">
                            <span className="px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#475569] font-medium">
                              {item.category}
                            </span>
                            {item.sourceVoucherNo && (
                              <span className="text-[#94A3B8] font-mono text-[10px]">
                                {item.sourceVoucherNo}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-[#475569] font-medium text-xs">
                            <MapPin className="w-3 h-3 text-[#174D3C] shrink-0" />
                            <span>{item.location}</span>
                          </div>
                          <div className="text-[10px] text-[#94A3B8] mt-0.5">
                            Inward: {item.receivedDate}
                          </div>
                        </td>

                        {/* Available Balance */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-semibold text-[#111827] text-xs font-mono">
                            {item.availableQuantity.toLocaleString("en-IN")} {item.unit}
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            of {item.totalReceivedQuantity.toLocaleString("en-IN")} inward
                          </div>
                          <div className="w-20 h-1 bg-[#E2E8F0] rounded-full ml-auto mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.status === "IN_STOCK"
                                  ? "bg-[#16805D]"
                                  : item.status === "LOW_STOCK"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${percentLeft}%` }}
                            />
                          </div>
                        </td>

                        {/* Unit Rate */}
                        <td className="py-3 px-4 text-right font-medium text-[#111827] font-mono">
                          ₹{item.ratePerUnit.toLocaleString("en-IN")}
                          <span className="text-[10px] text-[#64748B] block font-sans font-normal">per {item.unit}</span>
                        </td>

                        {/* Stock Valuation */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-semibold text-[#174D3C] text-xs font-mono">
                            ₹{item.totalValue.toLocaleString("en-IN")}
                          </div>
                          <span className="text-[10px] text-[#94A3B8] block font-normal">
                            Asset value
                          </span>
                        </td>

                        {/* Vendor / Source */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#475569] text-xs truncate max-w-[140px]">
                            {item.vendorName || "Vendor Purchase"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {item.status === "IN_STOCK" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8]">
                              In Stock
                            </span>
                          )}
                          {item.status === "LOW_STOCK" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Low Stock
                            </span>
                          )}
                          {item.status === "EXHAUSTED" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-800 border border-red-200">
                              Out of Stock
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openIssueModal(item)}
                            disabled={!canEdit || item.availableQuantity <= 0}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#174D3C] border border-[#C5DEC8] hover:border-[#174D3C] rounded-md font-medium text-[11px] transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Issue this item to appropriate operational menu"
                          >
                            <Send className="w-3 h-3" />
                            <span>Issue</span>
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
      </ContentCard>

      {/* ========================================================= */}
      {/* ISSUE TO MENU MODAL */}
      {/* ========================================================= */}
      {showIssueModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#174D3C]" />
                <h3 className="font-semibold text-sm text-[#111827]">Issue Item to Operational Menu</h3>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-[#64748B] hover:text-[#111827] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-5 space-y-4">
              {/* Item Info Summary Card */}
              <div className="p-3 bg-[#EAF3EE] rounded-lg border border-[#C5DEC8] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#174D3C] text-xs">{selectedItem.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-white text-[#174D3C] font-medium text-[10px] border border-[#C5DEC8]">
                    {selectedItem.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#475569] pt-1">
                  <span>Available in Godown:</span>
                  <span className="font-semibold text-[#174D3C]">
                    {selectedItem.availableQuantity} {selectedItem.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                  <span>Storage Bay:</span>
                  <span>{selectedItem.location}</span>
                </div>
              </div>

              {/* Destination Menu Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                  <span>Target Menu / Module</span>
                  <span className="text-[#174D3C] font-normal text-[11px]">(Auto-detected)</span>
                </label>
                <select
                  value={destinationMenu}
                  onChange={(e) => setDestinationMenu(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                >
                  <option value="Fertilizer">Plot Operations → Fertilizer (/fertilizer)</option>
                  <option value="Diesel">Plot Operations → Diesel (/diesel)</option>
                  <option value="Machinery">Plot Operations → Machinery (/machinery)</option>
                  <option value="General Purchases / Plot Ops">Plot Operations → General (/purchases)</option>
                </select>
                <p className="text-[11px] text-[#64748B]">
                  This transaction will automatically be recorded in the selected destination menu.
                </p>
              </div>

              {/* Quantity to Issue */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">
                    Quantity ({selectedItem.unit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.1"
                    max={selectedItem.availableQuantity}
                    value={issueQuantity}
                    onChange={(e) => setIssueQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] font-semibold focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                  />
                  <span className="text-[10px] text-[#64748B]">
                    Max: {selectedItem.availableQuantity} {selectedItem.unit}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                  />
                </div>
              </div>

              {/* Plot Target */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">Destination Plot *</label>
                <select
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#174D3C] hover:bg-[#103C30] rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {issuing ? "Issuing..." : "Confirm & Issue"}
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#174D3C]" />
                <h3 className="font-semibold text-sm text-[#111827]">Direct Godown Inward</h3>
              </div>
              <button
                onClick={() => setShowInwardModal(false)}
                className="text-[#64748B] hover:text-[#111827] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">Item Name *</label>
                <input
                  type="text"
                  required
                  value={inwardName}
                  onChange={(e) => setInwardName(e.target.value)}
                  placeholder="e.g. Urea 46% Nitrogen Fertilizer"
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">Category *</label>
                  <select
                    value={inwardCategory}
                    onChange={(e) => setInwardCategory(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
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
                  <label className="text-xs font-semibold text-[#111827]">Storage Location</label>
                  <input
                    type="text"
                    value={inwardLocation}
                    onChange={(e) => setInwardLocation(e.target.value)}
                    placeholder="e.g. Godown Bay A-2"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="50"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">Unit *</label>
                  <select
                    required
                    value={inwardUnit}
                    onChange={(e) => setInwardUnit(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] font-medium"
                  >
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.unitSymbol}>
                        {u.unitName} ({u.unitSymbol})
                      </option>
                    ))}
                    {availableUnits.length === 0 && <option value="kg">kg</option>}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">Rate / Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="45"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={inwardVendor}
                    onChange={(e) => setInwardVendor(e.target.value)}
                    placeholder="Vendor name"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">Min Alert Threshold</label>
                  <input
                    type="number"
                    value={inwardMinAlert}
                    onChange={(e) => setInwardMinAlert(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inwarding}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#174D3C] hover:bg-[#103C30] rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {inwarding ? "Receiving..." : "Inward into Godown"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
