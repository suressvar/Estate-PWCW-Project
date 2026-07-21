"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/stat-card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Fuel,
  Users,
  BarChart3,
  Calendar,
  AlertTriangle,
  FlaskConical,
  Filter,
  Tractor,
  Layers,
} from "lucide-react";
import { BarChart, LineChart } from "@tremor/react";

export default function DashboardPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPlotDrill, setSelectedPlotDrill] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = async () => {
    let url = "/api/analytics";
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    const data = await res.json();
    setAnalytics(data);
    if (data.plotDrillDown && data.plotDrillDown.length > 0 && !selectedPlotDrill) {
      setSelectedPlotDrill(data.plotDrillDown[0].plotName);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  if (!analytics) {
    return <div className="p-8 text-center text-xs text-slate-500 font-semibold">Loading Live Estate Dashboard...</div>;
  }

  const { kpis, plotPnL, cropPnL, fuelEfficiency, plotDrillDown } = analytics;
  const activeDrillData = plotDrillDown.find((d: any) => d.plotName === selectedPlotDrill) || plotDrillDown[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Date Filter Controls */}

      <div className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-5 rounded-xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Ranga Estate Executive Dashboard</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Real-time financial aggregation, computed stock levels, and per-plot drilldown views.
          </p>
        </div>

        {/* Date Range Filter Controls (Solid background for input clarity) */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-300 shadow-xs">
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-700">From:</span>
            <input
              id="start-date-filter"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1 bg-white border border-slate-300 rounded text-slate-900 text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-slate-700">To:</span>
            <input
              id="end-date-filter"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1 bg-white border border-slate-300 rounded text-slate-900 text-xs font-semibold"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Crop Revenue"
          value={`₹${kpis.totalRevenue.toLocaleString()}`}
          subtitle="Computed from Sales logs"
          icon={DollarSign}
        />
        <StatCard
          title="Total Operating Expense"
          value={`₹${kpis.totalExpenses.toLocaleString()}`}
          subtitle="Labor + Fertilizer + Gen Purchases"
          icon={TrendingDown}
        />
        <StatCard
          title="Net Farm Profit (P&L)"
          value={`₹${kpis.netProfit.toLocaleString()}`}
          isPositive={kpis.netProfit >= 0}
          change={kpis.netProfit >= 0 ? "PROFITABLE" : "LOSS"}
          subtitle="Revenue minus Operating Costs"
          icon={TrendingUp}
        />
        <StatCard
          title="Current Fuel Stock"
          value={`${kpis.currentDieselStockLiters} Liters`}
          subtitle="Purchases minus Consumption"
          icon={Fuel}
        />
      </div>

      {/* Analytics Section: Plot P&L + Stock Level Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plot-wise P&L Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                Plot-wise Profit & Loss Aggregation (₹)
              </h2>
              <p className="text-xs text-slate-600 font-medium">Live computed Revenue vs Expenses per Land Plot</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Revenue
              </span>
              <span className="flex items-center gap-1 text-red-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                Expense
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between gap-4 h-52 pt-4 px-2 border-b border-slate-200">
              {plotPnL.map((item: any, idx: number) => {
                const maxVal = Math.max(...plotPnL.map((p: any) => Math.max(p.Revenue, p.Expense)), 1000);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="flex items-end gap-1.5 w-full justify-center h-full">
                      <div
                        className="w-1/3 bg-emerald-500 rounded-t relative hover:bg-emerald-600 transition-all flex flex-col justify-end items-center"
                        style={{ height: `${Math.max(5, (item.Revenue / maxVal) * 100)}%` }}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded border border-emerald-300">
                          ₹{item.Revenue}
                        </span>
                      </div>
                      <div
                        className="w-1/3 bg-red-500 rounded-t relative hover:bg-red-600 transition-all flex flex-col justify-end items-center"
                        style={{ height: `${Math.max(5, (item.Expense / maxVal) * 100)}%` }}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 text-[10px] font-bold text-red-800 bg-red-100 px-1 rounded border border-red-300">
                          ₹{item.Expense}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{item.plot}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Computed Stock Gauges */}
        <div className="glass-panel p-5 rounded-xl space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-3">
              <FlaskConical className="w-4 h-4 text-emerald-700" />
              Computed Inventory Stock Levels
            </h2>

            <div className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800">Fertilizer Stock</span>
                  <span className="text-emerald-800 font-bold">{kpis.currentFertilizerStockKg} kg</span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden border border-slate-300/50">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, (kpis.currentFertilizerStockKg / 1000) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800">Diesel Reserve</span>
                  <span className="text-amber-800 font-bold">{kpis.currentDieselStockLiters} L</span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden border border-slate-300/50">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, (kpis.currentDieselStockLiters / 1000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/90 border border-slate-200 rounded-lg text-xs space-y-1">
            <span className="font-bold text-slate-800">Dynamic Stock Aggregation:</span>
            <p className="text-slate-600 font-medium">
              Values computed dynamically via SQL purchases minus consumption logs.
            </p>
          </div>
        </div>
      </div>


      {/* Machinery Fuel Efficiency & Crop-wise P&L Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop-wise P&L Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-emerald-700" />
            Crop-wise Profit & Loss Aggregation
          </h2>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="p-2.5">Crop Item</th>
                <th className="p-2.5">Revenue</th>
                <th className="p-2.5">Expense</th>
                <th className="p-2.5">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {cropPnL.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="p-2.5 font-bold text-slate-900">{item.crop}</td>
                  <td className="p-2.5 text-emerald-700 font-semibold">₹{item.Revenue}</td>
                  <td className="p-2.5 text-red-600 font-semibold">₹{item.Expense}</td>
                  <td className={`p-2.5 font-bold ${item.NetProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                    ₹{item.NetProfit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Machinery Fuel Efficiency */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Tractor className="w-4 h-4 text-emerald-700" />
            Machinery Fuel Efficiency (Liters / Hour)
          </h2>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="p-2.5">Machine Equipment</th>
                <th className="p-2.5">Total Hours</th>
                <th className="p-2.5">Diesel Used</th>
                <th className="p-2.5">Efficiency (L/hr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {fuelEfficiency.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="p-2.5 font-bold text-slate-900">{item.machine}</td>
                  <td className="p-2.5 text-slate-700">{item.totalHours} hrs</td>
                  <td className="p-2.5 text-amber-700 font-semibold">{item.totalDiesel} L</td>
                  <td className="p-2.5 font-bold text-emerald-800">{item.litersPerHour} L/hr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Plot Drill-Down View Section */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-700" />
              Per-Plot Master Drill-Down View
            </h2>
            <p className="text-xs text-slate-500">View all 6 transaction categories for a single land plot in one place</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Select Plot:</span>
            <select
              id="drilldown-plot-select"
              value={selectedPlotDrill}
              onChange={(e) => setSelectedPlotDrill(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs font-semibold"
            >
              {plotDrillDown.map((p: any) => (
                <option key={p.plotName} value={p.plotName}>
                  {p.plotName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drilldown Category Breakdown */}
        {activeDrillData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800">Fertilizer Log Entries ({activeDrillData.fertilizer.length})</span>
              {activeDrillData.fertilizer.map((f: any) => (
                <div key={f.id} className="text-slate-600 border-t border-slate-200/60 pt-1">
                  {f.date}: {f.fertilizerName} ({f.quantityKg}kg - ₹{f.cost})
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800">Labor Log Entries ({activeDrillData.labor.length})</span>
              {activeDrillData.labor.map((l: any) => (
                <div key={l.id} className="text-slate-600 border-t border-slate-200/60 pt-1">
                  {l.date}: {l.menCount}M / {l.womenCount}W (Payout: ₹{l.totalCost})
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800">Sales & Yield Logs ({activeDrillData.sales.length})</span>
              {activeDrillData.sales.map((s: any) => (
                <div key={s.id} className="text-slate-600 border-t border-slate-200/60 pt-1">
                  {s.date}: Sold {s.quantityKg}kg (Revenue: ₹{s.value})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
