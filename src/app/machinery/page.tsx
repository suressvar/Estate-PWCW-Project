"use client";
import { useCallback } from 'react';
import type { ExpenseUnit } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import type { ModuleStockSummary } from "@/types/api";

import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import type { GodownItem } from "@/lib/godown-data";
import type { MachineryLogItem, PlotCropAssociation, PlotItem } from "@/types/estate";
import { MACHINE_RATES } from "@/types/estate";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  ShoppingCart,
  Tractor,
      X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const MACHINES = [
  "John Deere 5050D Tractor",
  "Mahindra 575 DI Tractor",
  "Power Tiller & Rotavator",
  "Heavy Diesel Water Pump #1",
  "Heavy Diesel Water Pump #2",
  "Earth Mover / Backhoe",
  "Farm Logistics Truck",
];

export default function MachineryPage() {
  const [activeTab, setActiveTab] = useState<"operations" | "purchases" | "stock">("operations");
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

  // Machinery Running Logs
  const [logs, setLogs] = useState<MachineryLogItem[]>([]);

  // Machine Run Form State
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedCropActivityId, setSelectedCropActivityId] = useState("");
  const [machineName, setMachineName] = useState(MACHINES[0]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("13:00");
  const [runningHours, setRunningHours] = useState(5);
  const [dieselConsumed, setDieselConsumed] = useState(20);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [operatorName] = useState("Ramasamy V.");
  const [submittingRun, setSubmittingRun] = useState(false);

  // Inward Purchase Modal State
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardName, setInwardName] = useState("");
  const [inwardQty, setInwardQty] = useState<number | "">("");
  const [inwardUnit, setInwardUnit] = useState("Nos");
  const [inwardRate, setInwardRate] = useState<number | "">("");
  const [inwardVendor, setInwardVendor] = useState("Kovai Tractor Spares");
  const [inwardLocation, setInwardLocation] = useState("Tool Crib Rack 4 - Machinery & Equipment");
  const [submittingInward, setSubmittingInward] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [plotsRes, pcRes, stockRes, logsRes, unitsRes] = await Promise.all([
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
        fetch("/api/operations/stock?module=Machinery"),
        fetch("/api/machinery-logs"),
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
        setInwardUnit(unitsData.find((u) => u.unitSymbol === "Nos")?.unitSymbol || unitsData[0].unitSymbol);
      }

      if (Array.isArray(plotsData) && plotsData.length > 0 && !selectedPlotId) {
        setSelectedPlotId(plotsData[0].id);
        const filtered = (Array.isArray(pcData) ? pcData : []).filter((a: PlotCropAssociation) => a.plotId === plotsData[0].id);
        if (filtered.length > 0) setSelectedCropActivityId(filtered[0].id);
      }
    } catch (e) {
      console.error("Error loading machinery data:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedPlotId]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        loadAllData();
      })();
    }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, [loadAllData]);

  const handleTimeChange = (start: string, end: string, machine: string) => {
    setStartTime(start);
    setEndTime(end);
    if (start && end) {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const diffHours = Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
      setRunningHours(Math.round(diffHours * 10) / 10);

      const rate = MACHINE_RATES[machine] || 4.0;
      setDieselConsumed(Math.round(diffHours * rate * 10) / 10);
    }
  };

  const handlePlotSelect = (plotId: string) => {
    setSelectedPlotId(plotId);
    const filtered = associations.filter((a) => a.plotId === plotId);
    if (filtered.length > 0) {
      setSelectedCropActivityId(filtered[0].id);
    } else {
      setSelectedCropActivityId("");
    }
  };

  const handleRecordRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePlot = plots.find((p) => p.id === selectedPlotId);
    const activeCrop = associations.find((a) => a.id === selectedCropActivityId);

    try {
      setSubmittingRun(true);
      setFeedback(null);

      const res = await fetch("/api/machinery-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotCropId: selectedCropActivityId || undefined,
          plotName: activePlot?.name || "General Estate",
          cropActivityName: activeCrop?.cropActivityName || "Tractor Field Work",
          machineName,
          startTime,
          endTime,
          runningHours: Number(runningHours) || 0,
          dieselConsumedLiters: Number(dieselConsumed) || 0,
          date: logDate,
          loggedBy: operatorName,
          notes: "",
        }),
      });

      if (!res.ok) throw new Error("Failed to record machine usage log");

      setFeedback({
        type: "success",
        message: `Successfully logged ${runningHours} hours run for "${machineName}" (${dieselConsumed} L fuel consumed)!`,
      });

      loadAllData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err) || "Failed to record machine usage" });
    } finally {
      setSubmittingRun(false);
    }
  };

  const handleInwardEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardName.trim() || !inwardQty) {
      setFeedback({ type: "error", message: "Equipment/parts name and quantity are required." });
      return;
    }

    try {
      setSubmittingInward(true);
      const res = await fetch("/api/operations/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inwardName.trim(),
          category: "Machinery & Equipment",
          quantity: Number(inwardQty),
          unit: inwardUnit,
          ratePerUnit: Number(inwardRate) || 0,
          vendorName: inwardVendor.trim() || "Spares Supplier",
          location: inwardLocation,
          module: "Machinery",
          notes: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to inward machinery stock");

      setShowInwardModal(false);
      setInwardName("");
      setInwardQty("");
      setInwardRate("");
      setInwardVendor("");
      setFeedback({
        type: "success",
        message: `Successfully purchased & inwarded ${data.totalReceivedQuantity} ${data.unit} of "${data.name}" into Godown Tool Crib!`,
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
        title="Machinery & Tractor Operations"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Plot Operations", href: "/items" },
          { label: "Machinery Operations" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-estate-primary" />
              <span>+ Inward Spares / Parts</span>
            </button>

            <Link
              href="/machines"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-estate-primary hover:bg-estate-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Tractor className="w-3.5 h-3.5" />
              <span>View Fleet Directory</span>
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

      {/* Real-time Machinery Stock & Logs KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Equipment Spares on Hand"
          value={`${stockSummary.totalAvailableQty.toLocaleString("en-IN")} Units`}
          subtitle={`Valued at ₹${stockSummary.totalValuation.toLocaleString("en-IN")} across ${stockSummary.itemsCount} equipment items`}
        />
        <StatCard
          title="Total Spares Purchases"
          value={`₹${stockSummary.totalPurchasedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalPurchasedQty.toLocaleString("en-IN")} parts received into Godown`}
        />
        <StatCard
          title="Total Hours Logged"
          value={`${logs.reduce((acc, l) => acc + (Number(l.runningHours) || 0), 0)} Hours`}
          subtitle={`${logs.reduce((acc, l) => acc + (Number(l.dieselConsumedLiters) || 0), 0)} L diesel consumed in runs`}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("operations")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "operations"
              ? "bg-estate-primary text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Tractor Run Logs ({logs.length})</span>
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
          <span>Spares Purchases ({stockSummary.purchases?.length || 0})</span>
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
          <span>Spares Inventory Balance ({stockSummary.items?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: RUNNING OPERATIONS */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          <ContentCard
            title="Log Machine Running Time"
          >
            <form onSubmit={handleRecordRun} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Machine Selection */}
                <div className="space-y-1.5 min-w-0">
                  <label className="font-semibold text-slate-700">Tractor / Machine Unit *</label>
                  <select
                    value={machineName}
                    onChange={(e) => {
                      setMachineName(e.target.value);
                      handleTimeChange(startTime, endTime, e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  >
                    {MACHINES.map((m) => (
                      <option key={m} value={m}>
                        {m} ({MACHINE_RATES[m] || 4} L/hr avg)
                      </option>
                    ))}
                  </select>
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
                    <option value="">-- General Field Preparation --</option>
                    {associations
                      .filter((a) => a.plotId === selectedPlotId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.cropActivityName} ({a.status})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Operation Date *</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              {/* Time Range and Computed Liters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                      aria-label="Start time"
                    onChange={(e) => handleTimeChange(e.target.value, endTime, machineName)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                      aria-label="End time"
                    onChange={(e) => handleTimeChange(startTime, e.target.value, machineName)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Running Hours</label>
                  <div className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-estate-primary font-mono">
                    {runningHours} hrs
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Est. Diesel Burn</label>
                  <div className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-amber-700 font-mono">
                    {dieselConsumed} L
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submittingRun}
                  className="px-4 py-2 bg-estate-primary hover:bg-estate-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingRun ? "Saving..." : "Record Machine Run Log"}
                </button>
              </div>
            </form>
          </ContentCard>

          {/* Historical Logs */}
          <ContentCard
            title="Tractor & Machinery Historical Run Logs"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs erp-table">
                <thead>
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Machine</th>
                    <th className="p-3">Target Plot</th>
                    <th className="p-3">Activity</th>
                    <th className="p-3 text-center">Runtime</th>
                    <th className="p-3 text-right">Diesel Consumed</th>
                    <th className="p-3">Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        <Tractor className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="font-semibold text-slate-700">No machinery run logs recorded yet.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-900 font-medium">{log.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{log.machineName}</td>
                        <td className="p-3 text-slate-800">{log.plotName || "General Field"}</td>
                        <td className="p-3 text-slate-600">{log.cropActivityName || "—"}</td>
                        <td className="p-3 text-center font-bold text-estate-primary font-mono">{log.runningHours} hrs</td>
                        <td className="p-3 text-right font-bold text-amber-700 font-mono">{log.dieselConsumedLiters} L</td>
                        <td className="p-3 text-slate-600">{log.operatorName || log.loggedBy || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </div>
      )}

      {/* TAB 2: STOCK PURCHASES */}
      {activeTab === "purchases" && (
        <ContentCard
          title="Equipment Spares Purchases & Inward Receipts"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs erp-table">
              <thead>
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Part / Spare Name</th>
                  <th className="p-3">Supplier / Vendor</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Rate / Unit</th>
                  <th className="p-3 text-right">Total Cost</th>
                  <th className="p-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.purchases?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No spares purchases inwarded yet.
                    </td>
                  </tr>
                ) : (
                  stockSummary.purchases?.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-900 font-medium">{p.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{p.itemName}</td>
                      <td className="p-3 text-slate-600">{p.vendorName || "Spares Vendor"}</td>
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

      {/* TAB 3: SPARES INVENTORY BALANCE */}
      {activeTab === "stock" && (
        <ContentCard
          title="Current Tool Crib & Spares Inventory"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs erp-table">
              <thead>
                <tr>
                  <th className="p-3">Item Name</th>
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
                      No spares items found in Godown inventory.
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

      {/* MODAL: INWARD MACHINERY STOCK */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-estate-primary" />
                <span>Inward Machinery Spares to Godown</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInwardEquipment} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Part / Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tractor Rotavator Blades, Diesel Fuel Filter, V-Belt"
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
                    placeholder="e.g. 10"
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
                    {availableUnits.length === 0 && <option value="Nos">Nos</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Rate per Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 850"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs font-medium font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Vendor / Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Kovai Tractor Spares"
                    value={inwardVendor}
                    onChange={(e) => setInwardVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Godown Location</label>
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
