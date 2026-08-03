"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Calendar, FileText, Printer } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  if (!analytics) {
    return <div className="p-8 text-center text-xs text-slate-500 font-semibold">Generating Financial Reports...</div>;
  }

  const { kpis, plotPnL, cropPnL } = analytics;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-lg border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Financial & Operational Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exportable estate audit reports, P&L breakdowns, and resource consumption summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1 bg-white border border-slate-300 rounded text-slate-900"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1 bg-white border border-slate-300 rounded text-slate-900"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Estate Revenue"
          value={`₹${kpis.totalRevenue.toLocaleString()}`}
          subtitle="All Crop Sales"
        />
        <StatCard
          title="Total Operating Expense"
          value={`₹${kpis.totalExpenses.toLocaleString()}`}
          subtitle="Labor, Fertilizer & Gen Purchases"
        />
        <StatCard
          title="Net Farm Profit"
          value={`₹${kpis.netProfit.toLocaleString()}`}
          isPositive={kpis.netProfit >= 0}
          change={kpis.netProfit >= 0 ? "NET PROFIT" : "NET LOSS"}
        />
      </div>

      {/* Plot-Wise P&L Report Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-700" />
          Plot-wise Profitability Audit Report
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="p-3">Land Plot</th>
              <th className="p-3">Total Crop Revenue</th>
              <th className="p-3">Total Operating Expenses</th>
              <th className="p-3">Net Plot Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {plotPnL.map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="p-3 font-bold text-slate-900">{item.plot}</td>
                <td className="p-3 text-emerald-700 font-semibold">₹{item.Revenue.toLocaleString()}</td>
                <td className="p-3 text-red-600 font-semibold">₹{item.Expense.toLocaleString()}</td>
                <td className={`p-3 font-bold ${item.NetProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                  ₹{item.NetProfit.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Crop-Wise Audit Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-700" />
          Crop-wise Performance Audit Report
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase">
            <tr>
              <th className="p-3">Crop / Activity</th>
              <th className="p-3">Revenue Earned</th>
              <th className="p-3">Input Costs</th>
              <th className="p-3">Crop Net Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {cropPnL.map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/80">
                <td className="p-3 font-bold text-slate-900">{item.crop}</td>
                <td className="p-3 text-emerald-700 font-semibold">₹{item.Revenue.toLocaleString()}</td>
                <td className="p-3 text-red-600 font-semibold">₹{item.Expense.toLocaleString()}</td>
                <td className={`p-3 font-bold ${item.NetProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                  ₹{item.NetProfit.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
