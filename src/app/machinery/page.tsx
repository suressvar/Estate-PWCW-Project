"use client";

import React, { useState, useEffect } from "react";
import {
  Tractor,
  Package,
  ShoppingCart,
  TrendingDown,
  Plus,
  Warehouse,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Fuel,
  Wrench,
  X,
  Send,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { MACHINE_RATES } from "@/types/estate";
import type { PlotItem, PlotCropAssociation, MachineryLogItem } from "@/types/estate";
import type { GodownItem } from "@/lib/godown-data";

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
  const [operatorName, setOperatorName] = useState("Ramasamy V.");
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

  const loadAllData = async () => {
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
        const filtered = (Array.isArray(pcData) ? pcData : []).filter((a: any) => a.plotId === plotsData[0].id);
        if (filtered.length > 0) setSelectedCropActivityId(filtered[0].id);
      }
    } catch (e) {
      console.error("Error loading machinery data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

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

  // Submit Machine Running Log
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
          operatorName,
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
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to record machine usage" });
    } finally {
      setSubmittingRun(false);
    }
  };

  // Submit Inward Spares / Equipment Purchase into Godown
  const handleInwardSpares = async (e: React.FormEvent) => {
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
          category: "Machinery & Equipment",
          quantity: Number(inwardQty),
          unit: inwardUnit,
          ratePerUnit: Number(inwardRate) || 0,
          vendorName: inwardVendor.trim() || "Kovai Tractor Spares",
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
      setFeedback({
        type: "success",
        message: `Successfully inwarded ${data.totalReceivedQuantity} ${data.unit} of "${data.name}" into Godown Tool Crib!`,
      });

      loadAllData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to inward machinery stock" });
    } finally {
      setSubmittingInward(false);
    }
  };

  const totalRunningHours = logs.reduce((acc, l) => acc + (Number(l.runningHours) || 0), 0);
  const totalDieselConsumedByMachines = logs.reduce((acc, l) => acc + (Number(l.dieselConsumedLiters) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
            <Tractor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Machinery & Equipment Operations</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900">
                Godown Spares & Running Logs
              </span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInwardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Inward Spares to Godown</span>
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

      {/* Real-time Machinery Stock & Ops KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Godown Machinery Spares On-Hand"
          value={`${stockSummary.totalAvailableQty.toLocaleString("en-IN")} Units`}
          subtitle={`Valued at ₹${stockSummary.totalValuation.toLocaleString("en-IN")} in Godown tool crib`}
          icon={Package}
        />
        <StatCard
          title="Total Spares & Parts Purchased"
          value={`₹${stockSummary.totalPurchasedCost.toLocaleString("en-IN")}`}
          subtitle={`${stockSummary.totalPurchasedQty.toLocaleString("en-IN")} items inwarded into Godown`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Operating Hours"
          value={`${totalRunningHours.toFixed(1)} Hours`}
          subtitle={`${totalDieselConsumedByMachines.toFixed(1)} L diesel fuel consumed across operations`}
          icon={Clock}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("operations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "operations"
              ? "bg-[#15803d] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Tractor className="w-3.5 h-3.5" />
          <span>Machinery Usage & Running Logs ({logs.length})</span>
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
          <span>Spares Purchases & Inward ({stockSummary.purchases?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "stock"
              ? "bg-[#15803d] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Godown Spares Inventory ({stockSummary.items?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: MACHINERY USAGE & OPERATIONS */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          {/* Machine Run Logger Form */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-black">
                  <Tractor className="w-3.5 h-3.5" />
                </span>
                <span>Log Machinery Operation & Fuel Consumption</span>
              </h3>
            </div>

            <form onSubmit={handleRecordRun} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Machine Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Machine / Tractor *</label>
                  <select
                    value={machineName}
                    onChange={(e) => {
                      setMachineName(e.target.value);
                      handleTimeChange(startTime, endTime, e.target.value);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    {MACHINES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Plot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Operating Plot *</label>
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

                {/* Target Crop / Activity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Field Activity *</label>
                  <select
                    value={selectedCropActivityId}
                    onChange={(e) => setSelectedCropActivityId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  >
                    {associations
                      .filter((a) => a.plotId === selectedPlotId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.cropActivityName}
                        </option>
                      ))}
                    {associations.filter((a) => a.plotId === selectedPlotId).length === 0 && (
                      <option value="">Ploughing / Land Preparation</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Start Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleTimeChange(e.target.value, endTime, machineName)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleTimeChange(startTime, e.target.value, machineName)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                {/* Running Hours */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Running Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={runningHours}
                    onChange={(e) => setRunningHours(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                {/* Diesel Consumed */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Est. Fuel Consumed</span>
                    <span className="text-[10px] text-amber-700 font-bold">~{MACHINE_RATES[machineName] || 4}L/hr</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={dieselConsumed}
                      onChange={(e) => setDieselConsumed(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-amber-800 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Operation Date *</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>

                {/* Operator */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Driver / Equipment Operator</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingRun}
                  className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingRun ? "Recording Run Log..." : "Record Machine Operation"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Running History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Machinery Operations & Fuel Consumption History ({logs.length})</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Machine Name</th>
                    <th className="p-3.5">Plot Location</th>
                    <th className="p-3.5">Activity</th>
                    <th className="p-3.5 text-right">Running Hours</th>
                    <th className="p-3.5 text-right">Fuel Consumed</th>
                    <th className="p-3.5">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No machinery operation logs recorded yet. Use the form above to record machine running hours.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">{log.date}</td>
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <Tractor className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.machineName}</span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">{log.plotName}</td>
                        <td className="p-3.5 text-blue-800 font-semibold">{log.cropActivityName}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                          {log.runningHours} hrs
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                          {log.dieselConsumedLiters} L
                        </td>
                        <td className="p-3.5 text-slate-600">{(log as any).operatorName || log.loggedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPARES PURCHASES & INWARD */}
      {activeTab === "purchases" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span>Machinery Spares, Parts & Implements Inwarded to Godown ({stockSummary.purchases?.length || 0})</span>
              </h3>
            </div>

            <button
              onClick={() => setShowInwardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Inward Spares / Equipment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="p-3.5">Date Received</th>
                  <th className="p-3.5">Spare Part / Equipment</th>
                  <th className="p-3.5">Supplier / Workshop Vendor</th>
                  <th className="p-3.5 text-right">Quantity Inwarded</th>
                  <th className="p-3.5 text-right">Rate / Unit</th>
                  <th className="p-3.5 text-right">Total Invoice Cost</th>
                  <th className="p-3.5">Tool Crib Storage Rack</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(!stockSummary.purchases || stockSummary.purchases.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No machinery spares purchase records found in Godown. Click "+ Inward Spares / Equipment" to add parts.
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
                      <td className="p-3.5 text-slate-600">{m.destinationMenu || "Tool Crib Rack 4"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GODOWN MACHINERY SPARES INVENTORY */}
      {activeTab === "stock" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>On-Hand Machinery Spares & Implements in Godown ({stockSummary.items?.length || 0})</span>
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
                  <th className="p-3.5">Spare Part / Implement</th>
                  <th className="p-3.5">Tool Crib Rack Location</th>
                  <th className="p-3.5 text-right">Available Qty</th>
                  <th className="p-3.5 text-right">Total Inward</th>
                  <th className="p-3.5 text-right">Rate / Unit</th>
                  <th className="p-3.5 text-right">Total Valuation</th>
                  <th className="p-3.5 text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(!stockSummary.items || stockSummary.items.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No machinery spares currently in Godown. Click "+ Inward Spares to Godown" to add parts.
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
      {/* MODAL: INWARD MACHINERY SPARES INTO GODOWN                                 */}
      {/* ========================================================================= */}
      {showInwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black">
                  <Wrench className="w-4 h-4" />
                </span>
                <span>Inward Machinery Spares to Godown</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardSpares} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Spare Part / Implement Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tractor Rotavator Blades (Set), Hydraulic Oil 15W-40, Oil Filter"
                  value={inwardName}
                  onChange={(e) => setInwardName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
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
                    placeholder="e.g. 10"
                    value={inwardQty}
                    onChange={(e) => setInwardQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Unit *</label>
                  <select
                    required
                    value={inwardUnit}
                    onChange={(e) => setInwardUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
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
                  <label className="text-xs font-bold text-slate-700">Rate per Unit (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 650"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Supplier / Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Kovai Tractor Spares"
                    value={inwardVendor}
                    onChange={(e) => setInwardVendor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Storage Rack in Godown</label>
                <input
                  type="text"
                  value={inwardLocation}
                  onChange={(e) => setInwardLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingInward ? "Saving..." : "Inward Spares"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
