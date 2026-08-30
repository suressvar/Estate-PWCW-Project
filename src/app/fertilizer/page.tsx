"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Package,
  ShoppingCart,
  TrendingDown,
  Plus,
  ArrowDownRight,
  Warehouse,
  History,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sprout,
  X,
  Send,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { PlotItem, PlotCropAssociation } from "@/types/estate";
import type { GodownItem } from "@/lib/godown-data";

export default function FertilizerPage() {
  const [activeTab, setActiveTab] = useState<"consumption" | "purchases" | "stock">("consumption");
  const [loading, setLoading] = useState(true);

  // Master Data
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  // Module Stock Data from Godown
  const [stockSummary, setStockSummary] = useState<any>({
    itemsCount: 0,
    totalAvailableQty: 0,
    totalValuation: 0,
    totalPurchasedQty: 0,
    totalPurchasedCost: 0,
    totalConsumedQty: 0,
    totalConsumedCost: 0,
    items: [],
    purchases: [],
    consumptions: [],
  });

  // Fertilizer Logs
  const [logs, setLogs] = useState<any[]>([]);

  // Consumption Form State
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedCropActivityId, setSelectedCropActivityId] = useState("");
  const [selectedGodownItemId, setSelectedGodownItemId] = useState("");
  const [customFertilizerName, setCustomFertilizerName] = useState("");
  const [consumeQty, setConsumeQty] = useState<number | "">("");
  const [consumeDate, setConsumeDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [issuedTo, setIssuedTo] = useState("Field Team");
  const [submittingConsume, setSubmittingConsume] = useState(false);

  // Inward Purchase Modal State
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardName, setInwardName] = useState("");
  const [inwardQty, setInwardQty] = useState<number | "">("");
  const [inwardUnit, setInwardUnit] = useState("Bags");
  const [inwardRate, setInwardRate] = useState<number | "">("");
  const [inwardVendor, setInwardVendor] = useState("");
  const [inwardLocation, setInwardLocation] = useState("Godown Bay A - Dry Fertilizer & Nutrition");
  const [submittingInward, setSubmittingInward] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [plotsRes, pcRes, stockRes, logsRes, unitsRes] = await Promise.all([
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
        fetch("/api/operations/stock?module=Fertilizer"),
        fetch("/api/fertilizer-logs"),
        fetch("/api/units"),
      ]);

      const plotsData = await plotsRes.json();
      const pcData = await pcRes.json();
      const stockData = await stockRes.json();
      const logsData = await logsRes.json();
      const unitsData = await unitsRes.json();

      setPlots(Array.isArray(plotsData) ? plotsData : []);
      setAssociations(Array.isArray(pcData) ? pcData : []);
      if (stockData && !stockData.error) setStockSummary(stockData);
      setLogs(Array.isArray(logsData) ? logsData : []);

      if (Array.isArray(unitsData) && unitsData.length > 0) {
        setAvailableUnits(unitsData);
        setInwardUnit(unitsData[0].unitSymbol);
      }

      if (Array.isArray(plotsData) && plotsData.length > 0 && !selectedPlotId) {
        setSelectedPlotId(plotsData[0].id);
        const filtered = (Array.isArray(pcData) ? pcData : []).filter((a: any) => a.plotId === plotsData[0].id);
        if (filtered.length > 0) setSelectedCropActivityId(filtered[0].id);
      }

      // Pre-select first Godown item if available
      if (stockData?.items?.length > 0 && !selectedGodownItemId) {
        const firstAvailable = stockData.items.find((i: GodownItem) => i.availableQuantity > 0);
        if (firstAvailable) setSelectedGodownItemId(firstAvailable.id);
      }
    } catch (e) {
      console.error("Error loading fertilizer stock data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handlePlotSelect = (plotId: string) => {
    setSelectedPlotId(plotId);
    const filtered = associations.filter((a) => a.plotId === plotId);
    if (filtered.length > 0) {
      setSelectedCropActivityId(filtered[0].id);
    } else {
      setSelectedCropActivityId("");
    }
  };

  const selectedGodownItem = stockSummary.items.find((i: GodownItem) => i.id === selectedGodownItemId);

  // Submit Consumption from Godown Stock
  const handleApplyFertilizer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(consumeQty);
    if (!qty || qty <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid application quantity." });
      return;
    }

    const activePlot = plots.find((p) => p.id === selectedPlotId);
    const activeCrop = associations.find((a) => a.id === selectedCropActivityId);

    try {
      setSubmittingConsume(true);
      setFeedback(null);

      // If user selected a Godown item: consume via /api/godown/issue
      if (selectedGodownItemId && selectedGodownItem) {
        if (qty > selectedGodownItem.availableQuantity) {
          setFeedback({
            type: "error",
            message: `Requested ${qty} ${selectedGodownItem.unit} exceeds Godown stock (${selectedGodownItem.availableQuantity} ${selectedGodownItem.unit} available).`,
          });
          setSubmittingConsume(false);
          return;
        }

        const res = await fetch("/api/godown/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            godownItemId: selectedGodownItem.id,
            destinationMenu: "Fertilizer",
            quantity: qty,
            date: consumeDate,
            plotId: selectedPlotId,
            plotName: activePlot?.name || "General Estate",
            cropActivityId: selectedCropActivityId,
            cropActivityName: activeCrop?.cropActivityName || "Fertilizer Application",
            issuedTo,
            notes: "",
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to issue stock");

        setFeedback({
          type: "success",
          message: `Successfully consumed & applied ${qty} ${selectedGodownItem.unit} of "${selectedGodownItem.name}" to ${activePlot?.name || "Plot"}! Godown stock updated.`,
        });
      } else {
        // Direct manual consumption log
        const costVal = qty * 45; // default fallback estimate
        const res = await fetch("/api/fertilizer-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plotCropId: selectedCropActivityId || undefined,
            plotName: activePlot?.name || "General Estate",
            cropActivityName: activeCrop?.cropActivityName || "Fertilizer Application",
            transactionType: "CONSUMPTION",
            fertilizerName: customFertilizerName || "NPK Blend",
            quantityKg: qty,
            cost: costVal,
            date: consumeDate,
            loggedBy: issuedTo,
            notes: "",
          }),
        });

        if (!res.ok) throw new Error("Failed to record fertilizer application");

        setFeedback({
          type: "success",
          message: `Applied ${qty} kg of ${customFertilizerName || "fertilizer"} to ${activePlot?.name || "Plot"}!`,
        });
      }

      setConsumeQty("");
      loadAllData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to log consumption" });
    } finally {
      setSubmittingConsume(false);
    }
  };

  // Submit Inward Stock Purchase into Godown
  const handleInwardStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardName.trim() || !inwardQty) {
      setFeedback({ type: "error", message: "Item name and quantity are required." });
      return;
    }

    try {
      setSubmittingInward(true);
      const res = await fetch("/api/operations/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inwardName.trim(),
          category: "Fertilizer & Nutrition",
          quantity: Number(inwardQty),
          unit: inwardUnit,
          ratePerUnit: Number(inwardRate) || 0,
          vendorName: inwardVendor.trim() || "Agri Supplier",
          location: inwardLocation,
          module: "Fertilizer",
          notes: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to inward stock");

      setShowInwardModal(false);
      setInwardName("");
      setInwardQty("");
      setInwardRate("");
      setInwardVendor("");
      setFeedback({
        type: "success",
        message: `Successfully purchased & inwarded ${data.totalReceivedQuantity} ${data.unit} of "${data.name}" into Godown!`,
      });

      loadAllData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to inward stock" });
    } finally {
      setSubmittingInward(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#15803d] text-white flex items-center justify-center font-black shadow-xs">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Fertilizer & Nutrition Operations</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Godown Stock & Field Consumption
              </span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInwardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
            <span>+ Inward Stock to Godown</span>
          </button>

          <a
            href="/godown"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>View Godown Inventory</span>
          </a>
        </div>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-700" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Real-time Godown Stock KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Godown Available Stock"
          value={`${stockSummary.totalAvailableQty.toLocaleString("en-IN")} Units`}
          subtitle={`Valued at ₹${stockSummary.totalValuation.toLocaleString("en-IN")} across ${stockSummary.itemsCount} products`}
          icon={Package}
        />
        <StatCard
          title="Total Stock Purchases"
          value={`₹${stockSummary.totalPurchasedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalPurchasedQty.toLocaleString("en-IN")} units purchased & inwarded`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Consumed on Plots"
          value={`₹${stockSummary.totalConsumedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalConsumedQty.toLocaleString("en-IN")} units applied to estate plots`}
          icon={TrendingDown}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("consumption")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "consumption"
              ? "bg-[#15803d] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Plot Consumption & Application ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("purchases")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "purchases"
              ? "bg-[#15803d] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Stock Purchases & Inward ({stockSummary.purchases?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "stock"
              ? "bg-[#15803d] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Godown Stock Balance ({stockSummary.items?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: CONSUMPTION & PLOT APPLICATION */}
      {activeTab === "consumption" && (
        <div className="space-y-6">
          {/* Consumption Logger Form */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </span>
                  <span>Apply Fertilizer / Consume Godown Stock</span>
                </h3>
              </div>
            </div>

            <form onSubmit={handleApplyFertilizer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Source: Godown Stock Item */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Source Godown Stock *</span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      {selectedGodownItem ? `${selectedGodownItem.availableQuantity} ${selectedGodownItem.unit} on hand` : ""}
                    </span>
                  </label>
                  <select
                    value={selectedGodownItemId}
                    onChange={(e) => setSelectedGodownItemId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    <option value="">-- Select from Godown Available Stock --</option>
                    {stockSummary.items.map((item: GodownItem) => (
                      <option key={item.id} value={item.id} disabled={item.availableQuantity <= 0}>
                        {item.name} — {item.availableQuantity} {item.unit} available ({item.location})
                      </option>
                    ))}
                  </select>
                  {stockSummary.items.length === 0 && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      No fertilizer items found in Godown. Use "+ Inward Stock to Godown" to add stock.
                    </p>
                  )}
                </div>

                {/* Target Plot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Estate Plot *</label>
                  <select
                    required
                    value={selectedPlotId}
                    onChange={(e) => handlePlotSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.areaAcres} Acres - {p.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Crop / Activity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Crop / Activity *</label>
                  <select
                    required
                    value={selectedCropActivityId}
                    onChange={(e) => setSelectedCropActivityId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    {associations
                      .filter((a) => a.plotId === selectedPlotId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.cropActivityName} ({a.status})
                        </option>
                      ))}
                    {associations.filter((a) => a.plotId === selectedPlotId).length === 0 && (
                      <option value="">General Plot Application</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Quantity to Apply */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Quantity to Apply ({selectedGodownItem?.unit || "kg"}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    max={selectedGodownItem?.availableQuantity}
                    placeholder="e.g. 50"
                    value={consumeQty}
                    onChange={(e) => setConsumeQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                  {selectedGodownItem && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      Max available: {selectedGodownItem.availableQuantity} {selectedGodownItem.unit}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Application Date *</label>
                  <input
                    type="date"
                    required
                    value={consumeDate}
                    onChange={(e) => setConsumeDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                {/* Logged / Applied By */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Applied By / Supervisor</label>
                  <input
                    type="text"
                    placeholder="e.g. Murugan K. / Field Staff"
                    value={issuedTo}
                    onChange={(e) => setIssuedTo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingConsume}
                  className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingConsume ? "Recording Consumption..." : "Record Field Consumption"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Consumption History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <span>Fertilizer Field Consumption History ({logs.length})</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Plot Location</th>
                    <th className="p-3.5">Crop / Activity</th>
                    <th className="p-3.5">Fertilizer Item</th>
                    <th className="p-3.5 text-right">Quantity Consumed</th>
                    <th className="p-3.5 text-right">Cost Value</th>
                    <th className="p-3.5">Applied By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No fertilizer consumption logs yet. Use the form above to apply fertilizer from Godown stock.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">{log.date}</td>
                        <td className="p-3.5 font-bold text-slate-900">{log.plotName}</td>
                        <td className="p-3.5 text-emerald-800 font-semibold">{log.cropActivityName}</td>
                        <td className="p-3.5 font-bold text-slate-900">{log.fertilizerName}</td>
                        <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                          {log.quantityKg} kg
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-[#15803d]">
                          ₹{Number(log.cost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-slate-600">{log.loggedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK PURCHASES & INWARD */}
      {activeTab === "purchases" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                <span>Fertilizer Stock Purchases Received into Godown ({stockSummary.purchases?.length || 0})</span>
              </h3>
            </div>

            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record New Purchase</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="p-3.5">Date Received</th>
                  <th className="p-3.5">Fertilizer Item</th>
                  <th className="p-3.5">Procurement Source / Vendor</th>
                  <th className="p-3.5 text-right">Quantity Inwarded</th>
                  <th className="p-3.5 text-right">Rate / Unit</th>
                  <th className="p-3.5 text-right">Total Cost</th>
                  <th className="p-3.5">Storage Bay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(!stockSummary.purchases || stockSummary.purchases.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No stock purchase records found in Godown. Click "+ Record New Purchase" to add stock.
                    </td>
                  </tr>
                ) : (
                  stockSummary.purchases.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">{m.date}</td>
                      <td className="p-3.5 font-bold text-slate-900">{m.itemName}</td>
                      <td className="p-3.5 text-slate-600">{m.source}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {m.quantity} {m.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        ₹{Number(m.ratePerUnit || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#15803d]">
                        ₹{Number(m.totalCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-600">{m.destinationMenu || "Godown Bay A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GODOWN STOCK LEVELS */}
      {activeTab === "stock" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>On-Hand Fertilizer Inventory in Godown ({stockSummary.items?.length || 0})</span>
              </h3>
            </div>

            <div className="text-xs font-bold text-slate-700">
              Valuation:{" "}
              <span className="text-[#15803d] font-extrabold text-sm">
                ₹{stockSummary.totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="p-3.5">Fertilizer Item</th>
                  <th className="p-3.5">Storage Bay / Location</th>
                  <th className="p-3.5 text-right">Available Stock</th>
                  <th className="p-3.5 text-right">Total Inward</th>
                  <th className="p-3.5 text-right">Rate / Unit</th>
                  <th className="p-3.5 text-right">Total Value</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(!stockSummary.items || stockSummary.items.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No fertilizer items currently stored in Godown. Click "+ Inward Stock to Godown" to add stock.
                    </td>
                  </tr>
                ) : (
                  stockSummary.items.map((item: GodownItem) => {
                    const isLow = item.status === "LOW_STOCK";
                    const isExhausted = item.status === "EXHAUSTED";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500">{item.vendorName}</div>
                        </td>
                        <td className="p-3.5 text-slate-600">{item.location}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                          {item.availableQuantity} {item.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500">
                          {item.totalReceivedQuantity} {item.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-600">
                          ₹{Number(item.ratePerUnit).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-[#15803d]">
                          ₹{Number(item.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isExhausted
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : isLow
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setSelectedGodownItemId(item.id);
                              setActiveTab("consumption");
                            }}
                            disabled={item.availableQuantity <= 0}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-40"
                          >
                            Apply / Consume
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INWARD FERTILIZER STOCK INTO GODOWN                                 */}
      {/* ========================================================================= */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <span>Inward Fertilizer Stock to Godown</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardStock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Fertilizer Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NPK 19-19-19 Water Soluble, Urea 46%, Organic Compost"
                  value={inwardName}
                  onChange={(e) => setInwardName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Quantity Purchased *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 50"
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Unit *</label>
                  <select
                    required
                    value={inwardUnit}
                    onChange={(e) => setInwardUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.unitSymbol}>
                        {u.unitName} ({u.unitSymbol})
                      </option>
                    ))}
                    {availableUnits.length === 0 && <option value="Bags">Bags</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Rate per Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1450"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Vendor / Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Supreme Agro Supplies"
                    value={inwardVendor}
                    onChange={(e) => setInwardVendor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Godown Storage Location</label>
                <input
                  type="text"
                  value={inwardLocation}
                  onChange={(e) => setInwardLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInward}
                  className="px-4 py-2 text-xs font-bold bg-[#15803d] hover:bg-[#166534] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingInward ? "Saving..." : "Inward Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
