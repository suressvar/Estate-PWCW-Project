"use client";

import React, { useState, useEffect } from "react";
import {
  Fuel,
  Package,
  ShoppingCart,
  TrendingDown,
  Plus,
  Warehouse,
  History,
  CheckCircle2,
  AlertCircle,
  Tractor,
  X,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { PlotItem, PlotCropAssociation } from "@/types/estate";
import type { GodownItem } from "@/lib/godown-data";

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
  const [loading, setLoading] = useState(true);

  // Master Data
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);

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

  // Diesel Logs
  const [logs, setLogs] = useState<any[]>([]);

  // Dispense Consumption Form State
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedCropActivityId, setSelectedCropActivityId] = useState("");
  const [selectedGodownItemId, setSelectedGodownItemId] = useState("");
  const [selectedMachine, setSelectedMachine] = useState(ESTATE_MACHINES[0]);
  const [dispenseQty, setDispenseQty] = useState<number | "">("");
  const [dispenseDate, setDispenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [driverName, setDriverName] = useState("Ramasamy V. / Operator");
  const [submittingDispense, setSubmittingDispense] = useState(false);

  // Inward Purchase Modal State
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardName, setInwardName] = useState("Diesel Fuel Bulk (Tanker)");
  const [inwardQty, setInwardQty] = useState<number | "">("");
  const [inwardRate, setInwardRate] = useState<number | "">(92.5);
  const [inwardVendor, setInwardVendor] = useState("HPCL Petroleum Depot");
  const [inwardLocation, setInwardLocation] = useState("Fuel Yard Tank #1 - Secured Dispenser");
  const [submittingInward, setSubmittingInward] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadAllData = async () => {
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

      if (Array.isArray(plotsData) && plotsData.length > 0 && !selectedPlotId) {
        setSelectedPlotId(plotsData[0].id);
        const filtered = (Array.isArray(pcData) ? pcData : []).filter((a: any) => a.plotId === plotsData[0].id);
        if (filtered.length > 0) setSelectedCropActivityId(filtered[0].id);
      }

      if (stockData?.items?.length > 0 && !selectedGodownItemId) {
        const firstAvailable = stockData.items.find((i: GodownItem) => i.availableQuantity > 0);
        if (firstAvailable) setSelectedGodownItemId(firstAvailable.id);
      }
    } catch (e) {
      console.error("Error loading diesel data:", e);
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

  // Dispense Fuel from Godown Tank
  const handleDispenseFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(dispenseQty);
    if (!qty || qty <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid dispense volume in Liters." });
      return;
    }

    const activePlot = plots.find((p) => p.id === selectedPlotId);
    const activeCrop = associations.find((a) => a.id === selectedCropActivityId);

    try {
      setSubmittingDispense(true);
      setFeedback(null);

      if (selectedGodownItemId && selectedGodownItem) {
        if (qty > selectedGodownItem.availableQuantity) {
          setFeedback({
            type: "error",
            message: `Requested ${qty} L exceeds available fuel stock (${selectedGodownItem.availableQuantity} L in tank).`,
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
            plotName: activePlot?.name || "Machinery Shed",
            cropActivityId: selectedCropActivityId,
            cropActivityName: `${selectedMachine} Operation`,
            issuedTo: driverName,
            notes: "",
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to dispense fuel");

        setFeedback({
          type: "success",
          message: `Successfully dispensed ${qty} L to "${selectedMachine}"! Godown fuel tank stock updated.`,
        });
      } else {
        // Fallback direct log
        const costVal = qty * 92.5;
        const res = await fetch("/api/diesel-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionType: "CONSUMPTION",
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
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to log fuel dispense" });
    } finally {
      setSubmittingDispense(false);
    }
  };

  // Submit Inward Tanker Purchase into Godown
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
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to inward fuel" });
    } finally {
      setSubmittingInward(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black shadow-xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Diesel Fuel Operations & Storage</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                Godown Storage Tank & Dispense Logs
              </span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInwardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Refill Storage Tank</span>
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

      {/* Real-time Diesel Stock KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Diesel in Storage Tank"
          value={`${stockSummary.totalAvailableQty.toLocaleString("en-IN")} Liters`}
          subtitle={`Valued at ₹${stockSummary.totalValuation.toLocaleString("en-IN")} in fuel storage`}
          icon={Fuel}
        />
        <StatCard
          title="Total Fuel Purchased"
          value={`₹${stockSummary.totalPurchasedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalPurchasedQty.toLocaleString("en-IN")} Liters received into Godown`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Fuel Consumed"
          value={`₹${stockSummary.totalConsumedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalConsumedQty.toLocaleString("en-IN")} Liters dispensed to tractors & pumps`}
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
          <span>Fuel Dispense & Equipment Logs ({logs.length})</span>
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
          <span>Tank Refills & Purchases ({stockSummary.purchases?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "stock"
              ? "bg-[#15803d] text-white shadow-xs"
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
          {/* Dispense Form */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-black">
                  <Fuel className="w-3.5 h-3.5" />
                </span>
                <span>Dispense Diesel to Equipment / Tractor</span>
              </h3>
            </div>

            <form onSubmit={handleDispenseFuel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Source: Fuel Yard Tank */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Source Fuel Storage *</span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      {selectedGodownItem ? `${selectedGodownItem.availableQuantity} L in tank` : ""}
                    </span>
                  </label>
                  <select
                    value={selectedGodownItemId}
                    onChange={(e) => setSelectedGodownItemId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    <option value="">-- Select from Godown Fuel Tank --</option>
                    {stockSummary.items.map((item: GodownItem) => (
                      <option key={item.id} value={item.id} disabled={item.availableQuantity <= 0}>
                        {item.name} — {item.availableQuantity} L available ({item.location})
                      </option>
                    ))}
                  </select>
                  {stockSummary.items.length === 0 && (
                    <p className="text-[11px] text-amber-600 font-medium">
                      No fuel stock found in Godown. Click "+ Refill Storage Tank" to inward fuel.
                    </p>
                  )}
                </div>

                {/* Target Machine */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Machine / Equipment *</label>
                  <select
                    value={selectedMachine}
                    onChange={(e) => setSelectedMachine(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    {ESTATE_MACHINES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Plot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Operating Plot Location</label>
                  <select
                    value={selectedPlotId}
                    onChange={(e) => handlePlotSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dispense Liters */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Dispense Volume (Liters) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    max={selectedGodownItem?.availableQuantity}
                    placeholder="e.g. 35"
                    value={dispenseQty}
                    onChange={(e) => setDispenseQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                  {selectedGodownItem && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      Tank Balance: {selectedGodownItem.availableQuantity} L
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Dispense Date *</label>
                  <input
                    type="date"
                    required
                    value={dispenseDate}
                    onChange={(e) => setDispenseDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                {/* Driver / Operator */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Driver / Machine Operator</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramasamy V."
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingDispense}
                  className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingDispense ? "Dispensing Fuel..." : "Dispense Fuel & Update Stock"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Consumption History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <span>Diesel Fuel Dispense & Consumption History ({logs.length})</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Machine / Equipment</th>
                    <th className="p-3.5 text-right">Fuel Dispensed</th>
                    <th className="p-3.5 text-right">Cost Value</th>
                    <th className="p-3.5">Operator / Dispensed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No fuel dispense logs yet. Dispense fuel from Godown tank using the form above.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">{log.date}</td>
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <Tractor className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.cropActivityName || "Equipment Operation"}</span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-700 text-sm">
                          {log.quantityLiters} L
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
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

      {/* TAB 2: FUEL PURCHASES & TANK REFILLS */}
      {activeTab === "purchases" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                <span>Diesel Tank Purchases & Refills ({stockSummary.purchases?.length || 0})</span>
              </h3>
            </div>

            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Refill Storage Tank</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="p-3.5">Delivery Date</th>
                  <th className="p-3.5">Fuel Description</th>
                  <th className="p-3.5">Supplier / Petrol Depot</th>
                  <th className="p-3.5 text-right">Liters Inwarded</th>
                  <th className="p-3.5 text-right">Rate / Liter</th>
                  <th className="p-3.5 text-right">Total Invoice Cost</th>
                  <th className="p-3.5">Storage Tank Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(!stockSummary.purchases || stockSummary.purchases.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No fuel delivery records found in Godown. Click "+ Refill Storage Tank" to inward bulk fuel.
                    </td>
                  </tr>
                ) : (
                  stockSummary.purchases.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">{m.date}</td>
                      <td className="p-3.5 font-bold text-slate-900">{m.itemName}</td>
                      <td className="p-3.5 text-slate-600">{m.source}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-700 text-sm">
                        {m.quantity} L
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        ₹{Number(m.ratePerUnit || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#15803d]">
                        ₹{Number(m.totalCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-600">{m.destinationMenu || "Fuel Yard Tank #1"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GODOWN FUEL TANK STATUS */}
      {activeTab === "stock" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-600" />
                <span>On-Hand Diesel Storage Tanks ({stockSummary.items?.length || 0})</span>
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
                  <th className="p-3.5">Fuel Tank Name</th>
                  <th className="p-3.5">Storage Location</th>
                  <th className="p-3.5 text-right">Available Volume</th>
                  <th className="p-3.5 text-right">Total Refilled</th>
                  <th className="p-3.5 text-right">Rate / L</th>
                  <th className="p-3.5 text-right">Total Valuation</th>
                  <th className="p-3.5 text-center">Tank Status</th>
                  <th className="p-3.5 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(!stockSummary.items || stockSummary.items.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No diesel storage records in Godown. Click "+ Refill Storage Tank" to inward fuel.
                    </td>
                  </tr>
                ) : (
                  stockSummary.items.map((item: GodownItem) => {
                    const isLow = item.status === "LOW_STOCK";
                    const isExhausted = item.status === "EXHAUSTED";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                        <td className="p-3.5 text-slate-600">{item.location}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-700 text-base">
                          {item.availableQuantity} L
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500">
                          {item.totalReceivedQuantity} L
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
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-40"
                          >
                            Dispense Fuel
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
      {/* MODAL: INWARD FUEL PURCHASES INTO GODOWN TANK                              */}
      {/* ========================================================================= */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black">
                  <Fuel className="w-4 h-4" />
                </span>
                <span>Refill Godown Fuel Storage Tank</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardDiesel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Fuel Tank / Storage Bay *</label>
                <input
                  type="text"
                  required
                  value={inwardName}
                  onChange={(e) => setInwardName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Refill Volume (Liters) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 500"
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Rate per Liter (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 92.50"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Supplier / Petroleum Depot</label>
                <input
                  type="text"
                  placeholder="e.g. HPCL Bulk Depot / Indian Oil"
                  value={inwardVendor}
                  onChange={(e) => setInwardVendor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Storage Location</label>
                <input
                  type="text"
                  value={inwardLocation}
                  onChange={(e) => setInwardLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
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
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingInward ? "Saving..." : "Inward Fuel to Tank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
