"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  Filter,
  Download,
  ArrowLeft,
  RefreshCw,
  Trees,
  Sprout,
  Users,
  Tractor,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Check,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ConsolidatedReportData } from "@/lib/consolidated-report-data";
import { PlotItem, CropCycleItem } from "@/lib/db-storage";

export default function ConsolidatedReportPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Data
  const [report, setReport] = useState<ConsolidatedReportData | null>(null);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [cropCycles, setCropCycles] = useState<CropCycleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "ledger" | "crop_pnl" | "workforce" | "machinery" | "daily_ops"
  >("ledger");

  const fetchOptions = useCallback(async () => {
    try {
      const [plotRes, cycleRes] = await Promise.all([
        fetch("/api/plots"),
        fetch("/api/crop-cycles"),
      ]);
      const [plotData, cycleData] = await Promise.all([plotRes.json(), cycleRes.json()]);
      if (plotData.success) setPlots(plotData.data);
      if (cycleData.success) setCropCycles(cycleData.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPlot) params.set("plotId", selectedPlot);
      if (selectedCycle) params.set("cropCycleId", selectedCycle);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/reports/consolidated?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error("Failed to load consolidated report", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPlot, selectedCycle, startDate, endDate]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (selectedPlot) params.set("plotId", selectedPlot);
    if (selectedCycle) params.set("cropCycleId", selectedCycle);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("format", "csv");

    window.open(`/api/reports/consolidated?${params.toString()}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const resetFilters = () => {
    setSelectedPlot("");
    setSelectedCycle("");
    setStartDate("");
    setEndDate("");
  };

  const kpis = report?.kpis;

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5 print:border-b-2">
        <div>
          <div className="flex items-center gap-2 mb-1 print:hidden">
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Consolidated Final Report
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ClipboardList className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            Consolidated Estate Master Report
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-foreground shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Print / PDF
          </button>
          <button
            onClick={fetchReport}
            title="Refresh"
            className="p-2 border border-border rounded-lg bg-card hover:bg-muted text-muted-foreground transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Filter className="w-4 h-4 text-emerald-600" /> Filters:
        </div>

        {/* Plot Filter */}
        <select
          value={selectedPlot}
          onChange={(e) => {
            setSelectedPlot(e.target.value);
            setSelectedCycle("");
          }}
          className="px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Farm Plots</option>
          {plots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Crop Cycle Filter */}
        <select
          value={selectedCycle}
          onChange={(e) => setSelectedCycle(e.target.value)}
          className="px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Crop Cycles</option>
          {cropCycles
            .filter((c) => (selectedPlot ? c.plotId === selectedPlot : true))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.plotName} - {c.cropName} ({c.status})
              </option>
            ))}
        </select>

        {/* Start Date */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {(selectedPlot || selectedCycle || startDate || endDate) && (
          <button
            onClick={resetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Primary KPI Header Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Consolidated Income"
            value={`₹${kpis.totalIncome.toLocaleString()}`}
            description="Total crop sales & harvests"
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Total Consolidated Expenses"
            value={`₹${kpis.totalExpenses.toLocaleString()}`}
            description="Direct + wages + mach + overheads"
            icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
          />
          <StatCard
            title="Net Profit / Loss"
            value={`${kpis.isProfitable ? "+" : ""}₹${kpis.netProfitLoss.toLocaleString()}`}
            description={`Margin: ${kpis.profitMarginPercent}%`}
            icon={<DollarSign className={`w-5 h-5 ${kpis.isProfitable ? "text-emerald-600" : "text-rose-600"}`} />}
          />
          <StatCard
            title="Work Activity Completion"
            value={`${kpis.activityCompletionRate}%`}
            description={`${kpis.activitiesCompletedCount}/${kpis.totalActivitiesCount} activities completed`}
            icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
          />
        </div>
      )}

      {/* Secondary 5-Module Stream Breakdown */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-sm">
            <div className="text-[11px] text-muted-foreground">Direct Crop Spend</div>
            <div className="text-base font-bold font-mono text-foreground mt-0.5">
              ₹{kpis.cropDirectExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Seeds, fertilizers, inputs</div>
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-sm">
            <div className="text-[11px] text-muted-foreground">Workforce Wages</div>
            <div className="text-base font-bold font-mono text-foreground mt-0.5">
              ₹{kpis.laborWageExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">{kpis.totalWorkerDaysPresent} days worked</div>
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-sm">
            <div className="text-[11px] text-muted-foreground">Machinery Fleet</div>
            <div className="text-base font-bold font-mono text-foreground mt-0.5">
              ₹{kpis.machineryOperatingCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">{kpis.totalMachineHoursLogged} hrs logged</div>
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-sm">
            <div className="text-[11px] text-muted-foreground">General Overheads</div>
            <div className="text-base font-bold font-mono text-foreground mt-0.5">
              ₹{kpis.generalOverheadExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Admin, utilities, upkeep</div>
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-3 shadow-sm">
            <div className="text-[11px] text-muted-foreground">Petty Cash Drawer</div>
            <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              ₹{kpis.currentPettyCashBalance.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">₹{kpis.pettyCashOutflow.toLocaleString()} spent</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/40 gap-1 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "ledger"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Master Unified Ledger ({report?.ledger.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("crop_pnl")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "crop_pnl"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Crop Cycles Financials ({report?.sections.cropFinancials.cyclesCount || 0})
        </button>
        <button
          onClick={() => setActiveTab("workforce")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "workforce"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Workforce & Wages ({report?.sections.workforceWages.totalWorkersActive || 0})
        </button>
        <button
          onClick={() => setActiveTab("machinery")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "machinery"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Machinery Operations ({report?.sections.machineryUsage.totalRuns || 0})
        </button>
        <button
          onClick={() => setActiveTab("daily_ops")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "daily_ops"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Daily Work Logs & Gaps ({report?.sections.dailyLogs.totalLogs || 0})
        </button>
      </div>

      {/* TAB 1: MASTER UNIFIED LEDGER */}
      {(activeTab === "ledger" || typeof window === "undefined") && report && (
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Chronological Master Consolidated Estate Ledger
              </h3>
            </div>
            <div className="text-xs font-mono font-medium text-muted-foreground">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Stream</th>
                  <th className="py-3 px-4">Plot / Location</th>
                  <th className="py-3 px-4">Crop / Project</th>
                  <th className="py-3 px-4">Category / Status</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right text-rose-600">Debit (Expense)</th>
                  <th className="py-3 px-4 text-right text-emerald-600">Credit (Income)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {report.ledger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No ledger transactions found matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  report.ledger.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                        {row.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                            row.stream === "CROP_INCOME"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : row.stream === "CROP_EXPENSE"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              : row.stream === "WORKER_WAGE"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              : row.stream === "MACHINERY"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {row.stream}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                        {row.plotName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {row.cropName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                        {row.categoryOrStatus}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-foreground" title={row.description}>
                        {row.description}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-medium text-rose-600 dark:text-rose-400">
                        {row.debitExpense > 0 ? `₹${row.debitExpense.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.creditIncome > 0 ? `+₹${row.creditIncome.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CROP CYCLES FINANCIALS */}
      {activeTab === "crop_pnl" && report && (
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20">
            <h3 className="font-semibold text-foreground text-sm">
              Crop Cycle Seed-to-Harvest Financial P&L
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Plot</th>
                  <th className="py-3 px-4">Crop Cycle</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right text-emerald-600">Total Revenue</th>
                  <th className="py-3 px-4 text-right text-rose-600">Total Expenses</th>
                  <th className="py-3 px-4 text-right font-bold">Net Profit / Loss</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {report.sections.cropFinancials.cyclesBreakdown.map((c) => (
                  <tr key={c.cycleId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{c.plotName}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{c.cropName}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted font-semibold">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                      ₹{c.income.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">
                      ₹{c.expenses.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={c.net >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {c.net >= 0 ? "+" : ""}₹{c.net.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/crop-cycles/${c.cycleId}`}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        View Cycle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WORKFORCE & WAGES */}
      {activeTab === "workforce" && report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Wages Computed"
              value={`₹${report.sections.workforceWages.totalWagesComputed.toLocaleString()}`}
              description="Labor dues based on attendance"
              icon={<Users className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Total Wages Paid"
              value={`₹${report.sections.workforceWages.totalWagesPaid.toLocaleString()}`}
              description="Disbursed to workers"
              icon={<Check className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Outstanding Wage Dues"
              value={`₹${report.sections.workforceWages.unpaidWages.toLocaleString()}`}
              description="Payable balance"
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            />
          </div>

          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Worker Name</th>
                    <th className="py-3 px-4 text-center">Days Present</th>
                    <th className="py-3 px-4 text-right">Computed Wages</th>
                    <th className="py-3 px-4 text-right text-emerald-600">Paid Wages</th>
                    <th className="py-3 px-4 text-right text-amber-600">Balance Owed</th>
                    <th className="py-3 px-4 text-center">Wage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {report.sections.workforceWages.workerSummary.map((w) => {
                    const balance = Math.max(0, w.wagesComputed - w.wagesPaid);
                    return (
                      <tr key={w.workerId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">{w.workerName}</td>
                        <td className="py-3 px-4 text-center font-medium">{w.daysPresent} days</td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          ₹{w.wagesComputed.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                          ₹{w.wagesPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-amber-600">
                          ₹{balance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                              w.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : w.status === "PARTIAL"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MACHINERY OPERATIONS */}
      {activeTab === "machinery" && report && (
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/60 bg-muted/20">
            <h3 className="font-semibold text-foreground text-sm">Machinery & Fleet Utilization</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Hours Worked</th>
                  <th className="py-3 px-4 text-right">Operating Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {report.sections.machineryUsage.machinesBreakdown.map((m) => (
                  <tr key={m.machineName} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{m.machineName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">{m.type}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600">{m.hours} hrs</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      ₹{m.cost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DAILY OPS & GAPS */}
      {activeTab === "daily_ops" && report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Daily Work Logs"
              value={`${report.sections.dailyLogs.completedLogs} / ${report.sections.dailyLogs.totalLogs}`}
              description="Completed daily sheets"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Unfinished Activities"
              value={`${report.sections.dailyLogs.notDoneActivities.length}`}
              description="Activities flagged NOT_DONE"
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            />
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-foreground text-sm mb-3">
              Uncompleted / Carried Forward Work Activities
            </h3>
            {report.sections.dailyLogs.notDoneActivities.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5 opacity-60" />
                All scheduled work activities were successfully completed!
              </div>
            ) : (
              <div className="divide-y divide-border/40 text-xs">
                {report.sections.dailyLogs.notDoneActivities.map((act, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">{act.activity}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {act.date} • {act.plotName}
                      </div>
                    </div>
                    {act.reason && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300 italic bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded">
                        "{act.reason}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
