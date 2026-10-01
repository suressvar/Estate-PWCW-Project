"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Fuel,
  Calendar,
  Filter,
  Tractor,
  Layers,
  MapPin,
  FlaskConical,
  Sprout,
  Receipt,
  Store,
  Warehouse,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  Send,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [selectedPlotDrill, setSelectedPlotDrill] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setAnalytics(data);
      if (data.plotDrillDown && data.plotDrillDown.length > 0 && !selectedPlotDrill) {
        setSelectedPlotDrill(data.plotDrillDown[0].plotName);
      }
    } catch (e) {
      console.error("Failed to load analytics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (!analytics && loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-bold text-slate-700">Loading Executive Analytics...</p>
      </div>
    );
  }

  const { kpis, plotPnL, cropPnL, fuelEfficiency, plotDrillDown } = analytics || {
    kpis: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      currentFertilizerStockKg: 0,
      currentDieselStockLiters: 0,
    },
    plotPnL: [],
    cropPnL: [],
    fuelEfficiency: [],
    plotDrillDown: [],
  };

  const activeDrillData =
    plotDrillDown.find((d: any) => d.plotName === selectedPlotDrill) || plotDrillDown[0];

  const totalFlow = (kpis.totalRevenue || 0) + (kpis.totalExpenses || 0);
  const revenuePercent = totalFlow > 0 ? Math.round((kpis.totalRevenue / totalFlow) * 100) : 50;
  const expensePercent = totalFlow > 0 ? Math.round((kpis.totalExpenses / totalFlow) * 100) : 50;

  // Format live date and time
  const formattedDate = currentDateTime
    ? currentDateTime.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const formattedTime = currentDateTime
    ? currentDateTime.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Hero Header Banner with Live Date & Time */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-[#14532D] to-teal-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/60">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Executive Dashboard
            </h1>
          </div>

          {/* Live Date & Time Display Box */}
          <div className="bg-emerald-900/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-emerald-600/40 shadow-lg flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/90 text-emerald-300 flex items-center justify-center border border-emerald-600/50 shadow-inner">
              <Clock className="w-5 h-5 animate-pulse text-emerald-200" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>{formattedDate || "Live Date"}</span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight">
                {formattedTime || "--:--:--"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive Cash Flow & Operating Balance Hero Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Estate Cash Flow & Operating Ratio</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs sm:text-sm font-black px-4 py-1.5 rounded-full border shadow-2xs ${kpis.netProfit >= 0 ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"}`}>
              {kpis.netProfit >= 0 ? "Net Profit" : "Net Loss"}: ₹{kpis.netProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Proportional Ratio Bar */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-emerald-700 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" /> Gross Revenue ({revenuePercent}%)
            </span>
            <span className="text-rose-700 flex items-center gap-1.5">
              Total Expenses ({expensePercent}%) <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/60 p-0.5">
            <div
              style={{ width: `${revenuePercent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500"
            />
            <div
              style={{ width: `${expensePercent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-500"
            />
          </div>
        </div>

        {/* 3 Large Prominent Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Gross Revenue Card */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-teal-50/30 rounded-2xl border-2 border-emerald-200/90 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Gross Revenue</span>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-950 tracking-tight">
                ₹{kpis.totalRevenue.toLocaleString()}
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 block pt-0.5">Inflow from Harvests & Sales</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/30 shrink-0">
              +
            </div>
          </div>

          {/* Total Expenses Card */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-rose-50/90 via-rose-50/40 to-orange-50/30 rounded-2xl border-2 border-rose-200/90 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">Total Expenses</span>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-rose-950 tracking-tight">
                ₹{kpis.totalExpenses.toLocaleString()}
              </p>
              <span className="text-[11px] font-semibold text-rose-700 block pt-0.5">Labor, Inputs, Spares & Fleet</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-rose-600/30 shrink-0">
              −
            </div>
          </div>

          {/* Net Surplus Card */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-teal-50/90 via-teal-50/40 to-emerald-50/30 rounded-2xl border-2 border-teal-200/90 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-teal-800 uppercase tracking-wider">Net Surplus / Profit</span>
              <p className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${kpis.netProfit >= 0 ? "text-teal-950" : "text-rose-950"}`}>
                ₹{kpis.netProfit.toLocaleString()}
              </p>
              <span className={`text-[11px] font-bold block pt-0.5 ${kpis.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {kpis.netProfit >= 0 ? "Operating Gain (Surplus)" : "Operating Deficit"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-600/30 shrink-0">
              =
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Launchpad Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/godown"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <Warehouse className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-900">Godown Stock</p>
            <span className="text-[11px] text-amber-700 font-semibold">Inventory logs &rarr;</span>
          </div>
        </Link>

        <Link
          href="/purchases"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-900">Purchases</p>
            <span className="text-[11px] text-emerald-700 font-semibold">Inward bills &rarr;</span>
          </div>
        </Link>

        <Link
          href="/fertilizer"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-900">Fertilizer</p>
            <span className="text-[11px] text-teal-700 font-semibold">Field application &rarr;</span>
          </div>
        </Link>

        <Link
          href="/diesel"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <Fuel className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-900">Diesel Dispense</p>
            <span className="text-[11px] text-cyan-700 font-semibold">Machine fuel &rarr;</span>
          </div>
        </Link>

        <Link
          href="/machinery"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <Tractor className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-900">Machinery</p>
            <span className="text-[11px] text-blue-700 font-semibold">Operating logs &rarr;</span>
          </div>
        </Link>

        <Link
          href="/reports/pnl"
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-900">P&L Report</p>
            <span className="text-[11px] text-rose-700 font-semibold">Ledger summary &rarr;</span>
          </div>
        </Link>
      </div>

      {/* 5. Two-Column Analytics: Crop-wise & Plot-wise Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop-wise Returns */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
              Crop-wise Financial Performance
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {cropPnL.length} Crops
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Crop Item</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Expense</th>
                  <th className="p-3 text-right rounded-r-xl">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {cropPnL.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                      No crop sales or cultivation records logged for this period.
                    </td>
                  </tr>
                ) : (
                  cropPnL.map((item: any, idx: number) => {
                    const isProfit = item.NetProfit >= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            <span className="font-bold text-slate-900">{item.crop}</span>
                          </div>
                        </td>
                        <td className="p-3 text-emerald-700 font-bold">₹{item.Revenue.toLocaleString()}</td>
                        <td className="p-3 text-rose-600 font-semibold">₹{item.Expense.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isProfit
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {isProfit ? "+" : ""}₹{item.NetProfit.toLocaleString()}
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

        {/* Plot-wise Returns */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              Plot-wise Land Profitability
            </h2>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {plotPnL.length} Plots
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Land Plot</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Expense</th>
                  <th className="p-3 text-right rounded-r-xl">Net Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {plotPnL.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                      No plot activity recorded for this period.
                    </td>
                  </tr>
                ) : (
                  plotPnL.map((item: any, idx: number) => {
                    const isProfit = item.NetProfit >= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-600" />
                            <span className="font-bold text-slate-900">{item.plot}</span>
                          </div>
                        </td>
                        <td className="p-3 text-emerald-700 font-bold">₹{item.Revenue.toLocaleString()}</td>
                        <td className="p-3 text-rose-600 font-semibold">₹{item.Expense.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isProfit
                                ? "bg-teal-50 text-teal-800 border border-teal-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {isProfit ? "+" : ""}₹{item.NetProfit.toLocaleString()}
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
      </div>

      {/* 6. Machinery Telemetry & Fuel Efficiency */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Tractor className="w-4 h-4" />
            </div>
            Machinery Fleet & Fuel Efficiency
          </h2>
          <span className="text-xs text-slate-500 font-medium">Baseline: &lt; 5 L/hr (Optimal)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">Machine Equipment</th>
                <th className="p-3">Running Hours</th>
                <th className="p-3">Diesel Consumed</th>
                <th className="p-3">Efficiency Rate</th>
                <th className="p-3 text-right rounded-r-xl">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {fuelEfficiency.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No machine operating hours or diesel usage logged.
                  </td>
                </tr>
              ) : (
                fuelEfficiency.map((item: any, idx: number) => {
                  const isHighEfficiency = item.litersPerHour <= 5.0;
                  const isModerate = item.litersPerHour > 5.0 && item.litersPerHour <= 8.0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                            <Tractor className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-900">{item.machine}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-bold">{item.totalHours} hrs</td>
                      <td className="p-3 text-amber-700 font-bold">{item.totalDiesel} Liters</td>
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {item.litersPerHour}{" "}
                          <span className="text-[10px] font-normal text-slate-500">L/hr</span>
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isHighEfficiency
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : isModerate
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {isHighEfficiency
                            ? "High Efficiency"
                            : isModerate
                            ? "Moderate"
                            : "Heavy Consumption"}
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

      {/* 7. Per-Plot Operations Drill-Down */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-xs">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Per-Plot Field Operations Activity</h2>
            </div>
          </div>

          {/* Plot Selector Tabs */}
          {plotDrillDown.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {plotDrillDown.map((p: any) => (
                <button
                  key={p.plotName}
                  onClick={() => setSelectedPlotDrill(p.plotName)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedPlotDrill === p.plotName
                      ? "bg-emerald-800 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {p.plotName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drilldown Columns */}
        {plotDrillDown.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            No registered land plots available.
          </div>
        ) : activeDrillData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Fertilizer Column */}
            <div className="p-4 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 rounded-2xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-700" /> Fertilizer Applications
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {activeDrillData.fertilizer.length}
                </span>
              </div>
              {activeDrillData.fertilizer.length === 0 ? (
                <p className="text-slate-400 italic py-2">No fertilizer records logged</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeDrillData.fertilizer.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-2 bg-white/90 rounded-xl border border-emerald-100 text-slate-700 shadow-2xs space-y-0.5"
                    >
                      <div className="font-bold text-slate-900">{f.fertilizerName}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{f.date}</span>
                        <span className="font-semibold text-emerald-700">
                          {f.quantityKg} kg • ₹{f.cost}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labor Column */}
            <div className="p-4 bg-gradient-to-br from-violet-50/70 to-purple-50/40 rounded-2xl border border-violet-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-violet-200/60 pb-2">
                <span className="font-bold text-violet-950 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-violet-700" /> Labor & Manpower
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-200 text-violet-900">
                  {activeDrillData.labor.length}
                </span>
              </div>
              {activeDrillData.labor.length === 0 ? (
                <p className="text-slate-400 italic py-2">No labor logs recorded</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeDrillData.labor.map((l: any) => (
                    <div
                      key={l.id}
                      className="p-2 bg-white/90 rounded-xl border border-violet-100 text-slate-700 shadow-2xs space-y-0.5"
                    >
                      <div className="font-bold text-slate-900">
                        {l.menCount} Men + {l.womenCount} Women
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{l.date}</span>
                        <span className="font-semibold text-violet-700">Payout: ₹{l.totalCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales & Yield Column */}
            <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-2xl border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-700" /> Sales & Crop Harvest
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {activeDrillData.sales.length}
                </span>
              </div>
              {activeDrillData.sales.length === 0 ? (
                <p className="text-slate-400 italic py-2">No sales logged for this plot</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeDrillData.sales.map((s: any) => (
                    <div
                      key={s.id}
                      className="p-2 bg-white/90 rounded-xl border border-amber-100 text-slate-700 shadow-2xs space-y-0.5"
                    >
                      <div className="font-bold text-slate-900">Harvest: {s.quantityKg} kg</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{s.date}</span>
                        <span className="font-semibold text-emerald-700">Revenue: ₹{s.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
