"use client";

import { useEffect, useState } from "react";
import type { SalesAnalytics } from "@/types/api";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCard } from "@/components/ui/content-card";
import {
  ArrowUpRight,
  Award,
  DollarSign,
  Layers,
  Receipt,
  TrendingUp,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function SalesDashboardPage() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
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
    return (
      <PageContainer>
        <div className="py-20 text-center text-xs text-slate-500 font-medium">
          Loading Sales Analytics Dashboard...
        </div>
      </PageContainer>
    );
  }

  const { kpis, monthlyRevenue, categoryDistribution, recentTransactions } =
    analytics;

  return (
    <PageContainer>
      {/* Top Banner */}
      <PageHeader
        title="Produce & Harvest Sales Analytics"
        breadcrumbs={[
          { label: "Sales & Distribution", href: "/sales-register" },
          { label: "Sales Analytics" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/sales"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Sales Entry
            </Link>
            <Link
              href="/sales-register/other"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Sales Register
            </Link>
          </div>
        }
      />

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Harvest Revenue"
          value={`₹${kpis.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-[#174D3C]" />}
        />
        <StatCard
          title="Total Sales Invoices"
          value={`${kpis.totalInvoices}`}
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Average Order Value"
          value={`₹${kpis.avgOrderValue.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Top Estate Produce"
          value={kpis.topProduct}
          icon={<Award className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2">
          <ContentCard
            title="Monthly Revenue Realization Trend"
          >
            {/* Styled Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
              {monthlyRevenue.map((m, idx: number) => {
                const maxRev = Math.max(
                  ...monthlyRevenue.map((r) => r.revenue),
                  100000
                );
                const heightPercent = Math.min(
                  100,
                  Math.round((m.revenue / maxRev) * 100)
                );
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <div className="text-[10px] font-mono font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{(m.revenue / 1000).toFixed(1)}k
                    </div>
                    <div className="w-full max-w-[36px] bg-[#F8FAFC] rounded-t-md overflow-hidden flex flex-col justify-end h-full border border-slate-100">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-[#174D3C] group-hover:bg-[#103C30] transition-all rounded-t-sm"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-4 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#174D3C]" />
                Harvest & Crop Sales Realization
              </div>
            </div>
          </ContentCard>
        </div>

        {/* Category Share Donut / Distribution */}
        <div className="lg:col-span-1">
          <ContentCard
            title="Revenue Share by Produce"
          >
            <div className="space-y-4 pt-1">
              {categoryDistribution.map((cat, idx: number) => {
                const percent =
                  kpis.totalRevenue > 0
                    ? Math.round((cat.value / kpis.totalRevenue) * 100)
                    : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {cat.name}
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        ₹{cat.value.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-[#174D3C] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ContentCard>
        </div>
      </div>

      {/* Recent Sales Register */}
      <ContentCard
        title="Recent Harvest & Produce Dispatches"
        action={
          <Link
            href="/sales-register/other"
            className="text-xs font-semibold text-[#174D3C] hover:text-[#103C30] flex items-center gap-1"
          >
            Full Sales History <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Sr #</th>
                <th className="py-3 px-4">Buyer / Merchant</th>
                <th className="py-3 px-4">Item / Produce</th>
                <th className="py-3 px-4">Quantity & Unit</th>
                <th className="py-3 px-4 text-right">Rate (₹)</th>
                <th className="py-3 px-4 text-right">Revenue (₹)</th>
                <th className="py-3 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {tx.dateOfSale}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {tx.srNo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {tx.buyerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{tx.itemName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {tx.quantity} {tx.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                      ₹{tx.pricePerUnit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#174D3C]">
                      ₹{Number(tx.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/sales-invoice/${tx.invoiceGroupId || tx.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#EAF3EE] border border-slate-200 hover:border-[#174D3C]/30 text-[#174D3C] rounded-md text-xs font-semibold transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Slip
                      </Link>
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
