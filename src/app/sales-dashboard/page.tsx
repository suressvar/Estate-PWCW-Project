"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  Receipt,
  Sprout,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function SalesDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sales-analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !analytics) {
    return <div className="p-12 text-center text-slate-500 font-semibold">Loading Sales Analytics Dashboard...</div>;
  }

  const { kpis, monthlyRevenue, categoryDistribution, recentTransactions } = analytics;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Estate Harvest & Produce Sales Analytics</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Real-time revenue metrics, harvest batch realization, and multi-channel buyer analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/sales"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            New Sales Voucher
          </Link>
          <Link
            href="/sales-register/other"
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Harvest Sales Register
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Harvest Revenue"
          value={`₹${kpis.totalRevenue.toLocaleString()}`}
          subtitle="Cumulative Produce Sales"
          isPositive={true}
          change="+18.4%"
          icon={DollarSign}
        />
        <StatCard
          title="Total Sales Invoices"
          value={`${kpis.totalInvoices} Invoices`}
          subtitle="Cleared Commercial Shipments"
          icon={Layers}
        />
        <StatCard
          title="Average Order Value"
          value={`₹${kpis.avgOrderValue.toLocaleString()}`}
          subtitle="Per invoice transaction"
          icon={TrendingUp}
        />
        <StatCard
          title="Top Farm Product"
          value={kpis.topProduct}
          subtitle="Leading revenue contributor"
          icon={Award}
        />
      </div>

      {/* Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Monthly Revenue Performance Trend (₹)
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">FY 2026-27</span>
          </div>

          {/* Styled CSS Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
            {monthlyRevenue.map((m: any, idx: number) => {
              const heightPercent = Math.min(100, Math.round((m.revenue / 120000) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{(m.revenue / 1000).toFixed(1)}k
                  </div>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-emerald-800 group-hover:bg-emerald-700 transition-all rounded-t-md relative flex flex-col justify-end"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">{m.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-800" /> Farm Harvest & Crops Realization
            </div>
          </div>
        </div>

        {/* Category Share Donut / Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Revenue Share by Crop / Produce
          </h2>

          <div className="space-y-3.5 pt-2">
            {categoryDistribution.map((cat: any, idx: number) => {
              const percent = kpis.totalRevenue > 0 ? Math.round((cat.value / kpis.totalRevenue) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{cat.name}</span>
                    <span className="font-bold text-slate-900">₹{cat.value.toLocaleString()} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full rounded-full bg-emerald-700 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Sales Register */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Harvest & Produce Dispatches</h2>
            <p className="text-xs text-slate-500">Commercial sales operations across all estate plots</p>
          </div>
          <Link
            href="/sales-register/other"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            Full Sales History <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Sr #</th>
                <th className="p-3">Buyer / Mandi Merchant</th>
                <th className="p-3">Item / Produce</th>
                <th className="p-3">Quantity & Unit</th>
                <th className="p-3">Rate (₹)</th>
                <th className="p-3">Revenue (₹)</th>
                <th className="p-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">{tx.dateOfSale}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">{tx.srNo}</td>
                  <td className="p-3 font-bold text-slate-900">{tx.buyerName}</td>
                  <td className="p-3 text-slate-700">{tx.itemName}</td>
                  <td className="p-3 font-mono text-slate-700">{tx.quantity} {tx.unit}</td>
                  <td className="p-3 font-medium text-slate-700">₹{tx.pricePerUnit}</td>
                  <td className="p-3 font-bold text-emerald-900">₹{Number(tx.totalAmount).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/sales-invoice/${tx.invoiceGroupId || tx.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" /> Slip
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
