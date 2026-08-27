"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

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
            <h1 className="text-xl font-bold text-slate-900">Estate Executive Dashboard</h1>
          </div>
        </div>

        {/* Date Range Filter Controls (Solid background for input clarity) */}
        <div className="flex flex-wrap items-center gap-2 bg-[#ECF4E8]/60 p-2 rounded-lg border border-[#ABE7B2] shadow-xs">
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#14532D]" />
            <span className="font-semibold text-slate-700">From:</span>
            <input
              id="start-date-filter"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1 bg-white border border-[#93BFC7] rounded text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#93BFC7]"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-slate-700">To:</span>
            <input
              id="end-date-filter"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1 bg-white border border-[#93BFC7] rounded text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#93BFC7]"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Net Profit"
          value={`₹${kpis.netProfit.toLocaleString()}`}
          isPositive={kpis.netProfit >= 0}
          change={kpis.netProfit >= 0 ? "PROFITABLE" : "LOSS"}
          subtitle="Revenue minus Operating Costs"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Expense"
          value={`₹${kpis.totalExpenses.toLocaleString()}`}
          subtitle="Labor + Fertilizer + Gen Purchases"
          icon={TrendingDown}
        />
      </div>

      {/* Overall Profit & Loss Summary Table */}
      <div className="bg-white/90 backdrop-blur-xs p-5 rounded-xl border border-[#CBF3BB] shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-[#ECF4E8] pb-3">
          <DollarSign className="w-4.5 h-4.5 text-[#14532D]" />
          Overall Estate Profit & Loss Summary
        </h2>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="p-2.5">Category</th>
              <th className="p-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white font-medium">
            <tr className="hover:bg-slate-50/80">
              <td className="p-2.5 font-bold text-slate-900">Total Revenue (Crop Sales)</td>
              <td className="p-2.5 text-right text-emerald-700 font-bold">₹{kpis.totalRevenue.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-slate-50/80">
              <td className="p-2.5 font-bold text-slate-900">Total Operating Expenses</td>
              <td className="p-2.5 text-right text-red-600 font-bold">₹{kpis.totalExpenses.toLocaleString()}</td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="p-2.5 font-black text-slate-900">Net Profit / (Loss)</td>
              <td className={`p-2.5 text-right font-black text-sm ${kpis.netProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                ₹{kpis.netProfit.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Crop-wise and Plot-wise P&L Aggregations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop-wise P&L */}
        <div className="bg-white/90 backdrop-blur-xs p-5 rounded-xl border border-[#CBF3BB] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-[#ECF4E8] pb-3">
            <Layers className="w-4 h-4 text-[#14532D]" />
            Crop-wise Profit & Loss Aggregation
          </h2>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ECF4E8]/60 border-b border-[#CBF3BB] text-slate-700 font-semibold uppercase">
              <tr>
                <th className="p-2.5">Crop Item</th>
                <th className="p-2.5">Revenue</th>
                <th className="p-2.5">Expense</th>
                <th className="p-2.5">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {cropPnL.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                    No crop records or transactions recorded yet.
                  </td>
                </tr>
              ) : (
                cropPnL.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#ECF4E8]/30">
                    <td className="p-2.5 font-bold text-slate-900">{item.crop}</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">₹{item.Revenue.toLocaleString()}</td>
                    <td className="p-2.5 text-red-600 font-semibold">₹{item.Expense.toLocaleString()}</td>
                    <td className={`p-2.5 font-bold ${item.NetProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                      ₹{item.NetProfit.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Plot-wise P&L */}
        <div className="bg-white/90 backdrop-blur-xs p-5 rounded-xl border border-[#CBF3BB] shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-[#ECF4E8] pb-3">
            <MapPin className="w-4 h-4 text-[#14532D]" />
            Plot-wise Profit & Loss Aggregation
          </h2>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ECF4E8]/60 border-b border-[#CBF3BB] text-slate-700 font-semibold uppercase">
              <tr>
                <th className="p-2.5">Land Plot</th>
                <th className="p-2.5">Revenue</th>
                <th className="p-2.5">Expense</th>
                <th className="p-2.5">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {plotPnL.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                    No land plot records or transactions recorded yet.
                  </td>
                </tr>
              ) : (
                plotPnL.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#ECF4E8]/30">
                    <td className="p-2.5 font-bold text-slate-900">{item.plot}</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">₹{item.Revenue.toLocaleString()}</td>
                    <td className="p-2.5 text-red-600 font-semibold">₹{item.Expense.toLocaleString()}</td>
                    <td className={`p-2.5 font-bold ${item.NetProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                      ₹{item.NetProfit.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Machinery Fuel Efficiency */}
      <div className="bg-white/90 backdrop-blur-xs p-5 rounded-xl border border-[#CBF3BB] shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-[#ECF4E8] pb-3">
          <Tractor className="w-4 h-4 text-[#14532D]" />
          Machinery Fuel Efficiency (Liters / Hour)
        </h2>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ECF4E8]/60 border-b border-[#CBF3BB] text-slate-700 font-semibold uppercase">
            <tr>
              <th className="p-2.5">Machine Equipment</th>
              <th className="p-2.5">Total Hours</th>
              <th className="p-2.5">Diesel Used</th>
              <th className="p-2.5">Efficiency (L/hr)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {fuelEfficiency.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                  No machinery operational log entries recorded yet.
                </td>
              </tr>
            ) : (
              fuelEfficiency.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-[#ECF4E8]/30">
                  <td className="p-2.5 font-bold text-slate-900">{item.machine}</td>
                  <td className="p-2.5 text-slate-700">{item.totalHours} hrs</td>
                  <td className="p-2.5 text-amber-700 font-semibold">{item.totalDiesel} L</td>
                  <td className="p-2.5 font-bold text-emerald-800">{item.litersPerHour} L/hr</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Per-Plot Drill-Down View Section */}
      <div className="bg-white/90 backdrop-blur-xs p-5 rounded-xl border border-[#CBF3BB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#ECF4E8] pb-3 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#14532D]" />
              Per-Plot Master Drill-Down View
            </h2>
          </div>

          {plotDrillDown.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Select Plot:</span>
              <select
                id="drilldown-plot-select"
                value={selectedPlotDrill}
                onChange={(e) => setSelectedPlotDrill(e.target.value)}
                className="p-1.5 bg-[#ECF4E8]/70 border border-[#93BFC7] rounded-lg text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#93BFC7]"
              >
                {plotDrillDown.map((p: any) => (
                  <option key={p.plotName} value={p.plotName}>
                    {p.plotName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Drilldown Category Breakdown */}
        {plotDrillDown.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            No registered land plots available. Go to <span className="font-semibold text-emerald-700">Plot Master</span> to register plots.
          </div>
        ) : activeDrillData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-[#ECF4E8]/50 rounded-lg border border-[#ABE7B2] space-y-1">
              <span className="font-bold text-slate-800">Fertilizer Log Entries ({activeDrillData.fertilizer.length})</span>
              {activeDrillData.fertilizer.length === 0 && <p className="text-slate-400 italic">No fertilizer logs</p>}
              {activeDrillData.fertilizer.map((f: any) => (
                <div key={f.id} className="text-slate-600 border-t border-[#ABE7B2]/40 pt-1">
                  {f.date}: {f.fertilizerName} ({f.quantityKg}kg - ₹{f.cost})
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#ECF4E8]/50 rounded-lg border border-[#ABE7B2] space-y-1">
              <span className="font-bold text-slate-800">Labor Log Entries ({activeDrillData.labor.length})</span>
              {activeDrillData.labor.length === 0 && <p className="text-slate-400 italic">No labor logs</p>}
              {activeDrillData.labor.map((l: any) => (
                <div key={l.id} className="text-slate-600 border-t border-[#ABE7B2]/40 pt-1">
                  {l.date}: {l.menCount}M / {l.womenCount}W (Payout: ₹{l.totalCost})
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#ECF4E8]/50 rounded-lg border border-[#ABE7B2] space-y-1">
              <span className="font-bold text-slate-800">Sales & Yield Logs ({activeDrillData.sales.length})</span>
              {activeDrillData.sales.length === 0 && <p className="text-slate-400 italic">No sales logs</p>}
              {activeDrillData.sales.map((s: any) => (
                <div key={s.id} className="text-slate-600 border-t border-[#ABE7B2]/40 pt-1">
                  {s.date}: Sold {s.quantityKg}kg (Revenue: ₹{s.value})
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
