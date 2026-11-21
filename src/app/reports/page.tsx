"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardAnalytics } from "@/types/api";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCard } from "@/components/ui/content-card";
import {
    Calendar,
    Printer,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Layers,
  Scale,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  const fetchAnalytics = useCallback(async () => {
    let url = "/api/analytics";
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    const data = await res.json();
    setAnalytics(data);
  }, [endDate, startDate]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchAnalytics();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [startDate, endDate, fetchAnalytics]);

  if (!analytics) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-xs text-slate-500 font-medium">
          Generating Financial & Operational Reports...
        </div>
      </PageContainer>
    );
  }

  const { kpis, plotPnL, cropPnL } = analytics;

  return (
    <PageContainer>
      <PageHeader
        title="Financial & Operational Reports"
        breadcrumbs={[
          { label: "Financial Reports", href: "/reports" },
          { label: "Analytics Overview" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-0 text-slate-700 text-xs focus:ring-0 p-0 font-medium"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-0 text-slate-700 text-xs focus:ring-0 p-0 font-medium"
              />
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Export PDF
            </button>
          </div>
        }
      />

      {/* Direct Report Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
        <Link
          href="/reports/pnl"
          className="group p-4 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EAF3EE] text-[#174D3C] flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-[#174D3C] transition-colors">
                Profit & Loss Statement
              </div>
              <div className="text-xs text-slate-500">
                Statutory T-format double-column statement
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#174D3C] group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/reports/consolidated"
          className="group p-4 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                Consolidated Master Report
              </div>
              <div className="text-xs text-slate-500">
                Unified audit across 5 operational streams
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/reports/stock-inventory"
          className="group p-4 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                Stock Inventory & Valuation
              </div>
              <div className="text-xs text-slate-500">
                Closing balances, reorder alerts & valuations
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Estate Revenue"
          value={`₹${kpis.totalRevenue.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Total Operating Expense"
          value={`₹${kpis.totalExpenses.toLocaleString()}`}
          icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          title="Net PWCW Profit"
          value={`₹${kpis.netProfit.toLocaleString()}`}
          trend={{
            value: kpis.netProfit >= 0 ? "NET PROFIT" : "NET LOSS",
            isPositive: kpis.netProfit >= 0,
          }}
          icon={
            <DollarSign
              className={`w-5 h-5 ${
                kpis.netProfit >= 0 ? "text-[#174D3C]" : "text-rose-600"
              }`}
            />
          }
        />
      </div>

      {/* Plot-Wise P&L Report Table */}
      <ContentCard
        title="Plot-wise Profitability Audit Report"
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-6">Land Plot</th>
                <th className="py-3 px-6 text-right">Total Crop Revenue</th>
                <th className="py-3 px-6 text-right">Total Operating Expenses</th>
                <th className="py-3 px-6 text-right font-bold">Net Plot Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {plotPnL.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No plot financial data available for this range.
                  </td>
                </tr>
              ) : (
                plotPnL.map((item, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {item.plot}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-medium text-emerald-700">
                      ₹{item.Revenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-medium text-rose-600">
                      ₹{item.Expense.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold">
                      <span
                        className={
                          item.NetProfit >= 0
                            ? "text-[#174D3C]"
                            : "text-rose-600"
                        }
                      >
                        {item.NetProfit >= 0 ? "+" : ""}₹{item.NetProfit.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Crop-Wise Audit Table */}
      <ContentCard
        title="Crop-wise Performance Audit Report"
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-6">Crop / Activity</th>
                <th className="py-3 px-6 text-right">Revenue Earned</th>
                <th className="py-3 px-6 text-right">Input Costs</th>
                <th className="py-3 px-6 text-right font-bold">Crop Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {cropPnL.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No crop financial data available for this range.
                  </td>
                </tr>
              ) : (
                cropPnL.map((item, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {item.crop}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-medium text-emerald-700">
                      ₹{item.Revenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-medium text-rose-600">
                      ₹{item.Expense.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold">
                      <span
                        className={
                          item.NetProfit >= 0
                            ? "text-[#174D3C]"
                            : "text-rose-600"
                        }
                      >
                        {item.NetProfit >= 0 ? "+" : ""}₹{item.NetProfit.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </PageContainer>
  );
}
