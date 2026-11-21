"use client";
import { useCallback } from 'react';
import type { DieselLogItem } from "@/lib/db-storage";
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
  Fuel,
  ShoppingCart,
  TrendingDown,
  Warehouse,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const ESTATE_MACHINES = [
  "John Deere 5050D Tractor",
  "Mahindra 575 DI Tractor",
  "Power Tiller & Rotavator",
  "Heavy Diesel Water Pump #1 (North Bore)",
  "Heavy Diesel Water Pump #2 (Pasture Plot)",
  "Earth Mover / Backhoe",
  "Farm Logistics Truck / Pickup",
  "Mobile Generator Unit",
];

export default function DieselPage() {
  const [activeTab, setActiveTab] = useState<"consumption" | "purchases" | "stock">("consumption");
  const [, setLoading] = useState(true);

  // Master Data
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);

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

  // Diesel Logs
  const [logs, setLogs] = useState<DieselLogItem[]>([]);

  // Dispense Consumption Form State
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedCropActivityId, setSelectedCropActivityId] = useState("");
  const [selectedGodownItemId, setSelectedGodownItemId] = useState("");
  const [selectedMachine, setSelectedMachine] = useState(ESTATE_MACHINES[0]);
  const [dispenseQty, setDispenseQty] = useState<number | "">("");
  const [dispenseDate, setDispenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [driverName] = useState("Ramasamy V. / Operator");
  const [submittingDispense, setSubmittingDispense] = useState(false);

  // Inward Purchase Modal State
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardName] = useState("Diesel Fuel Bulk (Tanker)");
  const [inwardQty, setInwardQty] = useState<number | "">("");
  const [inwardRate] = useState<number | "">(92.5);
  const [inwardVendor] = useState("HPCL Petroleum Depot");
  const [inwardLocation] = useState("Fuel Yard Tank #1 - Secured Dispenser");
  const [submittingInward, setSubmittingInward] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [plotsRes, pcRes, stockRes, logsRes] = await Promise.all([
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
        fetch("/api/operations/stock?module=Diesel"),
        fetch("/api/diesel-logs"),
      ]);

      const plotsData = await plotsRes.json();
      const pcData = await pcRes.json();
      const stockData = await stockRes.json();
      const logsData = await logsRes.json();

      setPlots(Array.isArray(plotsData) ? plotsData : []);
      setAssociations(Array.isArray(pcData) ? pcData : []);
      if (stockData && !stockData.error) setStockSummary(stockData);
      setLogs(Array.isArray(logsData) ? logsData : []);

      if (Array.isArray(plotsData) && plotsData.length > 0) {
        setSelectedPlotId((prev) => prev || plotsData[0].id);
        const filtered = (Array.isArray(pcData) ? pcData : []).filter((a: PlotCropAssociation) => a.plotId === plotsData[0].id);
        if (filtered.length > 0) setSelectedCropActivityId((prev) => prev || filtered[0].id);
      }

      if (stockData?.items?.length > 0) {
        const firstAvailable = stockData.items.find((i: GodownItem) => i.availableQuantity > 0);
        if (firstAvailable) setSelectedGodownItemId((prev) => prev || firstAvailable.id);
      }
    } catch (e) {
      console.error("Error loading diesel stock data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleDispenseFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(dispenseQty);
    if (!qty || qty <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid fuel dispense quantity in Liters." });
      return;
    }

    const activePlot = plots.find((p) => p.id === selectedPlotId);

    try {
      setSubmittingDispense(true);
      setFeedback(null);

      if (selectedGodownItemId && selectedGodownItem) {
        if (qty > selectedGodownItem.availableQuantity) {
          setFeedback({
            type: "error",
            message: `Requested ${qty} L exceeds available fuel storage (${selectedGodownItem.availableQuantity} L in tank).`,
          });
          setSubmittingDispense(false);
          return;
        }

        const res = await fetch("/api/godown/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            godownItemId: selectedGodownItem.id,
            destinationMenu: "Diesel",
            quantity: qty,
            date: dispenseDate,
            plotId: selectedPlotId,
            plotName: activePlot?.name || "General Estate",
            cropActivityId: selectedCropActivityId,
            cropActivityName: associations.find(association => association.id === selectedCropActivityId)?.cropActivityName,
            machineName: selectedMachine,
            issuedTo: driverName,
            notes: `Dispensed to machine: ${selectedMachine}`,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to dispense fuel");

        setFeedback({
          type: "success",
          message: `Dispensed ${qty} L of diesel to ${selectedMachine}! Storage tank updated.`,
        });
      } else {
        const costVal = qty * 92.5;
        const res = await fetch("/api/diesel-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plotCropId: selectedCropActivityId || undefined,
            plotName: activePlot?.name || "General Estate",
            machineName: selectedMachine,
            quantityLiters: qty,
            cost: costVal,
            date: dispenseDate,
            loggedBy: driverName,
            notes: "",
          }),
        });

        if (!res.ok) throw new Error("Failed to record fuel dispense");

        setFeedback({
          type: "success",
          message: `Dispensed ${qty} L of diesel to ${selectedMachine}!`,
        });
      }

      setDispenseQty("");
      loadAllData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err) || "Failed to log fuel dispense" });
    } finally {
      setSubmittingDispense(false);
    }
  };

  const handleInwardDiesel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardQty) {
      setFeedback({ type: "error", message: "Refill quantity in Liters is required." });
      return;
    }

    try {
      setSubmittingInward(true);
      const res = await fetch("/api/operations/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inwardName.trim(),
          category: "Diesel & Fuel",
          quantity: Number(inwardQty),
          unit: "L",
          ratePerUnit: Number(inwardRate) || 92.5,
          vendorName: inwardVendor.trim() || "HPCL Depot",
          location: inwardLocation,
          module: "Diesel",
          notes: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to inward fuel");

      setShowInwardModal(false);
      setInwardQty("");
      setFeedback({
        type: "success",
        message: `Successfully purchased & refilled ${data.totalReceivedQuantity} L of Diesel into Godown storage tank!`,
      });

      loadAllData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err) || "Failed to inward fuel" });
    } finally {
      setSubmittingInward(false);
    }
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Diesel Fuel Operations & Storage"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Plot Operations", href: "/items" },
          { label: "Diesel Operations" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-estate-primary" />
              <span>+ Refill Storage Tank</span>
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
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${feedback.type === "success"
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

      {/* Real-time Diesel Stock KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Diesel in Storage Tank"
          value={`${stockSummary.totalAvailableQty.toLocaleString("en-IN")} Liters`}
          subtitle={`Valued at ₹${stockSummary.totalValuation.toLocaleString("en-IN")} in fuel storage`}
        />
        <StatCard
          title="Total Fuel Purchased"
          value={`₹${stockSummary.totalPurchasedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalPurchasedQty.toLocaleString("en-IN")} Liters received into Godown`}
        />
        <StatCard
          title="Total Fuel Consumed"
          value={`₹${stockSummary.totalConsumedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalConsumedQty.toLocaleString("en-IN")} Liters dispensed to tractors & pumps`}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("consumption")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === "consumption"
            ? "bg-estate-primary text-white shadow-xs"
            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Fuel Dispense & Equipment Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("purchases")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === "purchases"
            ? "bg-estate-primary text-white shadow-xs"
            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Tank Refills & Purchases ({stockSummary.purchases?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === "stock"
            ? "bg-estate-primary text-white shadow-xs"
            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
        >
          <Fuel className="w-3.5 h-3.5" />
          <span>Storage Tank Balance ({stockSummary.items?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: FUEL CONSUMPTION & DISPENSE */}
      {activeTab === "consumption" && (
        <div className="space-y-6">
          <ContentCard
            title="Dispense Diesel to Equipment / Tractor"
          >
            <form onSubmit={handleDispenseFuel} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source: Fuel Yard Tank */}
                <div className="space-y-1.5 min-w-0">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>Source Fuel Storage *</span>
                    <span className="text-[11px] text-estate-primary font-medium truncate ml-2">
                      {selectedGodownItem ? `${selectedGodownItem.availableQuantity} L in tank` : ""}
                    </span>
                  </label>
                  <select
                    aria-label="Diesel stock item"
                    value={selectedGodownItemId}
                    onChange={(e) => setSelectedGodownItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="">-- Select from Godown Fuel Tank --</option>
                    {stockSummary.items.map((item: GodownItem) => (
                      <option key={item.id} value={item.id} disabled={item.availableQuantity <= 0}>
                        {item.name} — {item.availableQuantity} L available ({item.location})
                      </option>
                    ))}
                  </select>
                  {stockSummary.items.length === 0 && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      No fuel stock found in Godown. Click &quot;+ Refill Storage Tank&quot; to inward fuel.
                    </p>
                  )}
                </div>

                {/* Target Machine */}
                <div className="space-y-1.5 min-w-0">
                  <label className="font-semibold text-slate-700">Target Machine / Equipment *</label>
                  <select
                    value={selectedMachine}
                    onChange={(e) => setSelectedMachine(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  >
                    {ESTATE_MACHINES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Target Crop / Activity */}
                <div className="space-y-1.5 min-w-0">
                  <label className="font-semibold text-slate-700">Crop Cycle / Operation *</label>
                  <select
                    value={selectedCropActivityId}
                    onChange={(e) => setSelectedCropActivityId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  >
                    <option value="">General Plot Operations</option>
                    {associations
                      .filter((a) => a.plotId === selectedPlotId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.cropActivityName} ({a.status})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dispense Liters */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Dispense Volume (Liters) *</label>
                  <input
                    type="number"
                    required
                    min="0.000001"
                    step="any"
                    max={selectedGodownItem?.availableQuantity}
                    placeholder="e.g. 35"
                    aria-label="Diesel quantity"
                    value={dispenseQty}
                    onChange={(e) => setDispenseQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold font-mono focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Dispense Date *</label>
                  <input
                    type="date"
                    required
                    value={dispenseDate}
                    onChange={(e) => setDispenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-estate-primary text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submittingDispense}
                  className="px-4 py-2 bg-estate-primary hover:bg-estate-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingDispense ? "Dispensing..." : "Record Fuel Dispense"}
                </button>
              </div>
            </form>
          </ContentCard>

          {/* Historical Logs */}
          <ContentCard
            title="Fuel Dispense Historical Log"
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs erp-table">
                <thead>
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Equipment / Machine</th>
                    <th className="p-3">Allocated Plot</th>
                    <th className="p-3 text-right">Liters Dispensed</th>
                    <th className="p-3 text-right">Fuel Spend (₹)</th>
                    <th className="p-3">Operator / Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        <Fuel className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="font-semibold text-slate-700">No diesel dispense logs recorded yet.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-slate-900 font-medium">{log.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{log.machineName || "—"}</td>
                        <td className="p-3 text-slate-700">{log.plotName || "General Operations"}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{log.quantityLiters ?? log.litersUsed ?? 0} L</td>
                        <td className="p-3 text-right font-bold text-amber-700 font-mono">₹{log.cost.toLocaleString("en-IN")}</td>
                        <td className="p-3 text-slate-600">{log.operator || log.loggedBy || "—"}</td>
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
          title="Fuel Tank Refill Purchases & Inward Receipts"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs erp-table">
              <thead>
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Fuel Product</th>
                  <th className="p-3">Depot / Supplier</th>
                  <th className="p-3 text-right">Volume</th>
                  <th className="p-3 text-right">Rate / Liter</th>
                  <th className="p-3 text-right">Total Spend</th>
                  <th className="p-3">Storage Location</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.purchases?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No fuel purchases inwarded yet.
                    </td>
                  </tr>
                ) : (
                  stockSummary.purchases?.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-900 font-medium">{p.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{p.itemName}</td>
                      <td className="p-3 text-slate-600">{p.vendorName || "Petroleum Supplier"}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{p.quantity} L</td>
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
          title="Current Fuel Storage Tank Level"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs erp-table">
              <thead>
                <tr>
                  <th className="p-3">Storage Tank</th>
                  <th className="p-3">Location</th>
                  <th className="p-3 text-right">Total Refilled</th>
                  <th className="p-3 text-right">Total Dispensed</th>
                  <th className="p-3 text-right">Remaining Fuel</th>
                  <th className="p-3 text-right">Valuation (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No fuel tanks found in Godown inventory.
                    </td>
                  </tr>
                ) : (
                  stockSummary.items.map((item: GodownItem) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.location}</td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {(item.quantity ?? item.totalReceivedQuantity ?? 0)} L
                      </td>
                      <td className="p-3 text-right font-medium text-amber-700">
                        {((item.quantity ?? item.totalReceivedQuantity ?? 0) - item.availableQuantity)} L
                      </td>
                      <td className="p-3 text-right font-bold text-estate-primary">
                        {item.availableQuantity} L
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        ₹{(item.availableQuantity * (item.ratePerUnit || 92.5)).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.availableQuantity > 0
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                        >
                          {item.availableQuantity > 0 ? "Fuel Ready" : "Depleted"}
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

      {/* MODAL: INWARD DIESEL PURCHASE */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-estate-primary" />
                <span>Refill Bulk Diesel Storage Tank</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInwardDiesel} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Refill Quantity (Liters) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={inwardQty}
                  onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs font-bold font-mono"
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
                  {submittingInward ? "Saving..." : "Record Tank Refill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
