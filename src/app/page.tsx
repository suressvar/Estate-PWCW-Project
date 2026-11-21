"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardAnalytics } from "@/types/api";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCard } from "@/components/ui/content-card";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  FileText,
    FlaskConical,
  Fuel,
      Receipt,
  RefreshCw,
    Tractor,
    Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [selectedPlotDrill, setSelectedPlotDrill] = useState("");
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        setCurrentDateTime(new Date());
        const interval = setInterval(() => {
          setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, []);

  const fetchAnalytics = useCallback(async () => {
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
  }, [selectedPlotDrill]);

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
  }, [fetchAnalytics]);

  if (!analytics && loading) {
    return (
      <PageContainer>
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF3EE] text-[#174D3C] flex items-center justify-center border border-[#16805D]/20 animate-spin">
            <RefreshCw className="w-5 h-5 text-[#174D3C]" />
          </div>
          <p className="text-xs font-semibold text-slate-600">Loading Executive Analytics...</p>
        </div>
      </PageContainer>
    );
  }

  const { kpis, plotPnL, cropPnL, plotDrillDown } = analytics || {
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
    plotDrillDown.find((d) => d.plotName === selectedPlotDrill) || plotDrillDown[0];

  const totalFlow = (kpis.totalRevenue || 0) + (kpis.totalExpenses || 0);
  const revenuePercent = totalFlow > 0 ? Math.round((kpis.totalRevenue / totalFlow) * 100) : 50;
  const expensePercent = totalFlow > 0 ? Math.round((kpis.totalExpenses / totalFlow) * 100) : 50;

  // Operating Margin Calculation
  const operatingMargin =
    kpis.totalRevenue > 0
      ? ((kpis.netProfit / kpis.totalRevenue) * 100).toFixed(1)
      : "0.0";

  // Formatted current date
  const formattedDate = currentDateTime
    ? currentDateTime.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <PageContainer>
      {/* 1. Standardized Enterprise Page Header */}
      <PageHeader
        title="Executive Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate || "Financial Year"}</span>
            </div>

            <button
              onClick={() => fetchAnalytics()}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 rounded-lg transition-colors shadow-2xs"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* 2. Structured 4-Column KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Revenue"
          value={`₹${kpis.totalRevenue.toLocaleString()}`}
          change={`${revenuePercent}%`}
          isPositive={true}
          trendPeriod="Cumulative"
          variant="emerald"
          icon={<DollarSign className="w-4 h-4 text-[#16805D]" />}
        />

        <StatCard
          title="Total Expenses"
          value={`₹${kpis.totalExpenses.toLocaleString()}`}
          change={`${expensePercent}%`}
          isPositive={false}
          trendPeriod="Cumulative"
          variant="rose"
          icon={<ArrowDownRight className="w-4 h-4 text-[#DC3545]" />}
        />

        <StatCard
          title="Net Operating Surplus"
          value={`₹${kpis.netProfit.toLocaleString()}`}
          change={`${operatingMargin}% margin`}
          isPositive={kpis.netProfit >= 0}
          variant={kpis.netProfit >= 0 ? "emerald" : "rose"}
          icon={<Activity className="w-4 h-4 text-[#174D3C]" />}
        />

        <StatCard
          title="Inventory Reserves"
          value={`${kpis.currentFertilizerStockKg.toLocaleString()} kg`}
          badge={`${kpis.currentDieselStockLiters.toLocaleString()} L Diesel`}
          variant="default"
          icon={<Warehouse className="w-4 h-4 text-slate-700" />}
        />
      </div>

      {/* 3. Financial Performance & Operating Ratio Overview */}
      <ContentCard
        title="Cash Flow & Operating Ratio"
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                kpis.netProfit >= 0
                  ? "bg-[#EAF3EE] text-[#16805D] border border-[#16805D]/20"
                  : "bg-rose-50 text-[#DC3545] border border-rose-200"
              }`}
            >
              {kpis.netProfit >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {kpis.netProfit >= 0 ? "Net Profit" : "Net Deficit"}: ₹{kpis.netProfit.toLocaleString()}
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Proportional Ratio Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#16805D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16805D]" />
                Gross Revenue ({revenuePercent}%) — ₹{kpis.totalRevenue.toLocaleString()}
              </span>
              <span className="text-[#DC3545] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#DC3545]" />
                Expenses ({expensePercent}%) — ₹{kpis.totalExpenses.toLocaleString()}
              </span>
            </div>

            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/80">
              <div
                style={{ width: `${revenuePercent}%` }}
                className="h-full rounded-full bg-[#16805D] transition-all duration-500"
              />
              <div
                style={{ width: `${expensePercent}%` }}
                className="h-full rounded-full bg-[#DC3545] transition-all duration-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Operating Inflow
              </span>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                ₹{kpis.totalRevenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500">Crop sales and market harvests</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Operating Outflow
              </span>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                ₹{kpis.totalExpenses.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500">Labor payroll, fertilizers, diesel & spares</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Operating Margin
              </span>
              <p
                className={`text-xl font-bold tracking-tight ${
                  kpis.netProfit >= 0 ? "text-[#16805D]" : "text-[#DC3545]"
                }`}
              >
                {operatingMargin}%
              </p>
              <p className="text-[11px] text-slate-500">Calculated over total recorded revenue</p>
            </div>
          </div>
        </div>
      </ContentCard>

      {/* 4. Uniform Quick Access Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Operational Quick Access
          </h2>
          <span className="text-xs text-slate-400">Core Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              title: "Godown Stock",
              subtitle: "Inventory balance",
              href: "/godown",
              icon: Warehouse,
            },
            {
              title: "Vouchers",
              subtitle: "Inward invoices",
              href: "/purchases",
              icon: Receipt,
            },
            {
              title: "Fertilizer",
              subtitle: "Field nutrients",
              href: "/fertilizer",
              icon: FlaskConical,
            },
            {
              title: "Diesel Dispense",
              subtitle: "Machinery fuel",
              href: "/diesel",
              icon: Fuel,
            },
            {
              title: "Machinery Logs",
              subtitle: "Fleet registers",
              href: "/machines",
              icon: Tractor,
            },
            {
              title: "P&L Reports",
              subtitle: "Statement balances",
              href: "/reports/pnl",
              icon: FileText,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                prefetch={false}
                className="bg-white p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col justify-between group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EAF3EE] text-[#174D3C] flex items-center justify-center border border-[#16805D]/15 group-hover:bg-[#174D3C] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-[#174D3C] transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. Two-Column Analytics: Crop-wise & Plot-wise Financial Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop-wise Returns */}
        <ContentCard
          title="Crop-wise Financial Performance"
          actions={
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {cropPnL.length} Crops
            </span>
          }
        >
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Crop Item</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Expense</th>
                  <th className="px-5 py-3 text-right">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cropPnL.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      No crop sales or cultivation records logged for this period.
                    </td>
                  </tr>
                ) : (
                  cropPnL.map((item, idx: number) => {
                    const isProfit = item.NetProfit >= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {item.crop}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          ₹{item.Revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          ₹{item.Expense.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isProfit
                                ? "bg-[#EAF3EE] text-[#16805D]"
                                : "bg-rose-50 text-[#DC3545]"
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
        </ContentCard>

        {/* Plot-wise Returns */}
        <ContentCard
          title="Plot-wise Land Profitability"
          actions={
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {plotPnL.length} Plots
            </span>
          }
        >
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Land Plot</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Expense</th>
                  <th className="px-5 py-3 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plotPnL.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      No plot activity recorded for this period.
                    </td>
                  </tr>
                ) : (
                  plotPnL.map((item, idx: number) => {
                    const isProfit = item.NetProfit >= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {item.plot}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          ₹{item.Revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          ₹{item.Expense.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isProfit
                                ? "bg-[#EAF3EE] text-[#16805D]"
                                : "bg-rose-50 text-[#DC3545]"
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
        </ContentCard>
      </div>

      {/* 6. Plot Operations Drill-down */}
      <ContentCard
        title="Field Activity Drill-Down"
        actions={
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Select Plot:</label>
            <select
              value={selectedPlotDrill}
              onChange={(e) => setSelectedPlotDrill(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
            >
              {plotDrillDown.map((d) => (
                <option key={d.plotName} value={d.plotName}>
                  {d.plotName}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {activeDrillData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fertilizer Applications */}
            <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-[#16805D]" />
                  Fertilizer Applications
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {activeDrillData.fertilizer.length}
                </span>
              </div>

              {activeDrillData.fertilizer.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-2">No fertilizer records logged</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeDrillData.fertilizer.map((f) => (
                    <div
                      key={f.id}
                      className="p-2 bg-white rounded border border-slate-200/70 text-slate-700 text-xs space-y-0.5 shadow-2xs"
                    >
                      <div className="font-semibold text-slate-900">{f.fertilizerName}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{f.date}</span>
                        <span className="font-medium text-[#16805D]">
                          {f.quantityKg} kg • ₹{f.cost}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labor Logs */}
            <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-violet-600" />
                  Labor & Manpower
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {activeDrillData.labor.length}
                </span>
              </div>

              {activeDrillData.labor.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-2">No labor logs recorded</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeDrillData.labor.map((l) => (
                    <div
                      key={l.id}
                      className="p-2 bg-white rounded border border-slate-200/70 text-slate-700 text-xs space-y-0.5 shadow-2xs"
                    >
                      <div className="font-semibold text-slate-900">
                        {l.menCount} Men + {l.womenCount} Women
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{l.date}</span>
                        <span className="font-medium text-slate-700">Payout: ₹{l.totalCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales & Yields */}
            <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  Sales & Harvest
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {activeDrillData.sales.length}
                </span>
              </div>

              {activeDrillData.sales.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-2">No sales logged for this plot</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeDrillData.sales.map((s) => (
                    <div
                      key={s.id}
                      className="p-2 bg-white rounded border border-slate-200/70 text-slate-700 text-xs space-y-0.5 shadow-2xs"
                    >
                      <div className="font-semibold text-slate-900">Harvest: {s.quantityKg} kg</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{s.date}</span>
                        <span className="font-medium text-[#16805D]">Revenue: ₹{s.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </ContentCard>
    </PageContainer>
  );
}
