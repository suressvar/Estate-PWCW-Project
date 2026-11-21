"use client";
import { useCallback } from 'react';
import type { ExpenseUnit, FertilizerLogItem } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import type { ModuleStockSummary } from "@/types/api";

import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import type { GodownItem } from "@/lib/godown-data";
import type { PlotCropAssociation, PlotItem } from "@/types/estate";
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Package,
  ShoppingCart,
  TrendingDown,
  Warehouse,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function FertilizerPage() {
  const [activeTab, setActiveTab] = useState<"consumption" | "purchases" | "stock">("consumption");
  const [, setLoading] = useState(true);

  // Master Data
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [availableUnits, setAvailableUnits] = useState<ExpenseUnit[]>([]);

  // Module Stock Data from Godown
  const [stockSummary, setStockSummary] = useState<ModuleStockSummary>({
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
  const [logs, setLogs] = useState<FertilizerLogItem[]>([]);

  // Consumption Form State
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedCropActivityId, setSelectedCropActivityId] = useState("");
  const [selectedGodownItemId, setSelectedGodownItemId] = useState("");
  const [customFertilizerName] = useState("");
  const [consumeQty, setConsumeQty] = useState<number | "">("");
  const [consumeDate, setConsumeDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [issuedTo] = useState("Field Team");
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

  const loadAllData = useCallback(async () => {
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
        const filtered = (Array.isArray(pcData) ? pcData : []).filter((a: PlotCropAssociation) => a.plotId === plotsData[0].id);
        if (filtered.length > 0) setSelectedCropActivityId(filtered[0].id);
      }

      if (stockData?.items?.length > 0 && !selectedGodownItemId) {
        const firstAvailable = stockData.items.find((i: GodownItem) => i.availableQuantity > 0);
        if (firstAvailable) setSelectedGodownItemId(firstAvailable.id);
      }
    } catch (e) {
      console.error("Error loading fertilizer stock data:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedGodownItemId, selectedPlotId]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        loadAllData();
      })();
    }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, [loadAllData]);

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
        const costVal = qty * 45;
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
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err) || "Failed to log consumption" });
    } finally {
      setSubmittingConsume(false);
    }
  };

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
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err) || "Failed to inward stock" });
    } finally {
      setSubmittingInward(false);
    }
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Fertilizer & Nutrition Operations"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Plot Operations", href: "/items" },
          { label: "Fertilizer Operations" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-estate-primary" />
              <span>+ Inward Stock to Godown</span>
            </button>

            <Link
              href="/godown"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-estate-primary hover:bg-estate-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>View Godown Inventory</span>
            </Link>
          </div>
        }
      />

      {/* Notification Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
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
        />
        <StatCard
          title="Total Stock Purchases"
          value={`₹${stockSummary.totalPurchasedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalPurchasedQty.toLocaleString("en-IN")} units purchased & inwarded`}
        />
        <StatCard
          title="Total Consumed on Plots"
          value={`₹${stockSummary.totalConsumedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalConsumedQty.toLocaleString("en-IN")} units applied to estate plots`}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("consumption")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "consumption"
              ? "bg-estate-primary text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Plot Consumption & Application ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("purchases")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "purchases"
              ? "bg-estate-primary text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Stock Purchases & Inward ({stockSummary.purchases?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "stock"
              ? "bg-estate-primary text-white shadow-xs"
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
          <ContentCard
            title="Apply Fertilizer / Consume Godown Stock"
          >
            <form onSubmit={handleApplyFertilizer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source: Godown Stock Item */}
                <div className="space-y-1.5 min-w-0">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>Source Godown Stock *</span>
                    <span className="text-[11px] text-estate-primary font-medium truncate ml-2">
                      {selectedGodownItem ? `${selectedGodownItem.availableQuantity} ${selectedGodownItem.unit} on hand` : ""}
                    </span>
                  </label>
                  <select
                    aria-label="Fertilizer stock item"
                    value={selectedGodownItemId}
                    onChange={(e) => setSelectedGodownItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="">-- Select from Godown Available Stock --</option>
                    {stockSummary.items.map((item: GodownItem) => (
                      <option key={item.id} value={item.id} disabled={item.availableQuantity <= 0}>
                        {item.name} — {item.availableQuantity} {item.unit} available ({item.location})
                      </option>
                    ))}
                  </select>
                  {stockSummary.items.length === 0 && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      No fertilizer items found in Godown. Use &quot;+ Inward Stock to Godown&quot; to add stock.
                    </p>
                  )}
                </div>

                {/* Target Plot */}
                <div className="space-y-1.5 min-w-0">
                  <label className="font-semibold text-slate-700">Target Estate Plot *</label>
                  <select
                    required
                    value={selectedPlotId}
                    onChange={(e) => handlePlotSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.areaAcres} Acres - {p.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Associated Crop */}
                <div className="space-y-1.5 min-w-0">
                  <label className="font-semibold text-slate-700">Associated Crop / Activity</label>
                  <select
                    value={selectedCropActivityId}
                    onChange={(e) => setSelectedCropActivityId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="">-- General Plot Nutrition --</option>
                    {associations
                      .filter((a) => a.plotId === selectedPlotId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.cropActivityName} ({a.status})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Application Quantity *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="0.000001"
                      step="any"
                      placeholder="e.g. 5"
                      value={consumeQty}
                      aria-label="Fertilizer quantity"
                      onChange={(e) => setConsumeQty(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                    />
                    <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center">
                      {selectedGodownItem?.unit || "KG"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Application Date *</label>
                  <input
                    type="date"
                    required
                    value={consumeDate}
                    onChange={(e) => setConsumeDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submittingConsume}
                  className="px-4 py-2 bg-estate-primary hover:bg-estate-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingConsume ? "Recording..." : "Record Field Application"}
                </button>
              </div>
            </form>
          </ContentCard>

          {/* Historical Logs */}
          <ContentCard
            title="Field Nutrition Application Logs"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs erp-table">
                <thead>
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Fertilizer</th>
                    <th className="p-3">Target Plot</th>
                    <th className="p-3">Crop / Activity</th>
                    <th className="p-3 text-right">Quantity Applied</th>
                    <th className="p-3">Applied By</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        <FlaskConical className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="font-semibold text-slate-700">No application logs recorded yet.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-900 font-medium">{log.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{log.fertilizerName}</td>
                        <td className="p-3 text-slate-800">{log.plotName || "General Estate"}</td>
                        <td className="p-3 text-slate-600">{log.cropActivityName || "—"}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{log.quantityKg} Units</td>
                        <td className="p-3 text-slate-600">{log.loggedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </div>
      )}

      {/* TAB 2: STOCK PURCHASES & INWARD */}
      {activeTab === "purchases" && (
        <ContentCard
          title="Godown Stock Purchases & Inward Receipts"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs erp-table">
              <thead>
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Fertilizer Product</th>
                  <th className="p-3">Supplier / Vendor</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Rate / Unit</th>
                  <th className="p-3 text-right">Total Cost</th>
                  <th className="p-3">Godown Location</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.purchases?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No stock purchases inwarded yet.
                    </td>
                  </tr>
                ) : (
                  stockSummary.purchases?.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-900 font-medium">{p.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{p.itemName}</td>
                      <td className="p-3 text-slate-600">{p.vendorName || "Agri Supplier"}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{p.quantity} {p.unit}</td>
                      <td className="p-3 text-right text-slate-600 font-mono">₹{p.ratePerUnit.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">₹{p.totalCost.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-slate-600">{p.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      {/* TAB 3: GODOWN STOCK BALANCE */}
      {activeTab === "stock" && (
        <ContentCard
          title="Current Godown Inventory Balance"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs erp-table">
              <thead>
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Storage Location</th>
                  <th className="p-3 text-right">Total Received</th>
                  <th className="p-3 text-right">Consumed</th>
                  <th className="p-3 text-right">Available Stock</th>
                  <th className="p-3 text-right">Valuation (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No fertilizer items found in Godown inventory.
                    </td>
                  </tr>
                ) : (
                  stockSummary.items.map((item: GodownItem) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.location}</td>
                      <td className="p-3 text-right font-medium text-slate-700">{(item.quantity ?? item.totalReceivedQuantity ?? 0)} {item.unit}</td>
                      <td className="p-3 text-right font-medium text-rose-700">
                        {((item.quantity ?? item.totalReceivedQuantity ?? 0) - item.availableQuantity)} {item.unit}
                      </td>
                      <td className="p-3 text-right font-bold text-estate-primary">
                        {item.availableQuantity} {item.unit}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        ₹{(item.availableQuantity * (item.ratePerUnit || 0)).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.availableQuantity > 0
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}
                        >
                          {item.availableQuantity > 0 ? "In Stock" : "Depleted"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      {/* MODAL: INWARD FERTILIZER STOCK INTO GODOWN */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-estate-primary" />
                <span>Inward Fertilizer Stock to Godown</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInwardStock} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Fertilizer Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NPK 19-19-19 Water Soluble, Urea 46%, Organic Compost"
                  value={inwardName}
                  onChange={(e) => setInwardName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Quantity Purchased *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 50"
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs font-bold font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Unit *</label>
                  <select
                    required
                    value={inwardUnit}
                    onChange={(e) => setInwardUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs font-medium"
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
                  <label className="font-semibold text-slate-700">Rate per Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1450"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs font-medium font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Vendor / Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Supreme Agro Supplies"
                    value={inwardVendor}
                    onChange={(e) => setInwardVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Godown Storage Location</label>
                <input
                  type="text"
                  value={inwardLocation}
                  onChange={(e) => setInwardLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInward}
                  className="px-4 py-2 text-xs font-semibold bg-estate-primary hover:bg-estate-primary-hover text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {submittingInward ? "Saving..." : "Inward Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
