"use client";

import { useCallback, useEffect, useState } from "react";
import { ConsolidatedReportData } from "@/lib/consolidated-report-data";
import { CropCycleItem, PlotItem } from "@/lib/db-storage";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCard } from "@/components/ui/content-card";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function ConsolidatedReportPage() {
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
      const [plotData, cycleData] = await Promise.all([
        plotRes.json(),
        cycleRes.json(),
      ]);
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
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchOptions();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [fetchOptions]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchReport();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
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
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title="Consolidated Estate Master Report"
        breadcrumbs={[
          { label: "Financial Reports", href: "/reports" },
          { label: "Consolidated Master" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#174D3C]" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#174D3C] hover:bg-[#103C30] text-white shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Print / PDF
            </button>
            <button
              onClick={fetchReport}
              title="Refresh"
              className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-500 transition-colors shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#174D3C]" : ""
                  }`}
              />
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-[#174D3C]" /> Filters:
        </div>

        {/* Plot Filter */}
        <select
          value={selectedPlot}
          onChange={(e) => {
            setSelectedPlot(e.target.value);
            setSelectedCycle("");
          }}
          className="px-3 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-[#174D3C]"
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
          className="px-3 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-[#174D3C]"
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
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-[#174D3C]"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-[#174D3C]"
          />
        </div>

        {(selectedPlot || selectedCycle || startDate || endDate) && (
          <button
            onClick={resetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto"
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
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Total Consolidated Expenses"
            value={`₹${kpis.totalExpenses.toLocaleString()}`}
            icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
          />
          <StatCard
            title="Net Profit / Loss"
            value={`${kpis.isProfitable ? "+" : ""}₹${kpis.netProfitLoss.toLocaleString()}`}
            trend={{
              value: `${kpis.profitMarginPercent}% Margin`,
              isPositive: kpis.isProfitable,
            }}
            icon={
              <DollarSign
                className={`w-5 h-5 ${kpis.isProfitable ? "text-[#174D3C]" : "text-rose-600"
                  }`}
              />
            }
          />
          <StatCard
            title="Work Activity Completion"
            value={`${kpis.activityCompletionRate}%`}
            icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
          />
        </div>
      )}

      {/* Secondary 5-Module Stream Breakdown */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:grid-cols-5">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Direct Crop Spend
            </div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              ₹{kpis.cropDirectExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">Seeds, inputs, fertilizers</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Workforce Wages
            </div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              ₹{kpis.laborWageExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              {kpis.totalWorkerDaysPresent} days worked
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Machinery Fleet
            </div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              ₹{kpis.machineryOperatingCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              {kpis.totalMachineHoursLogged} hrs logged
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              General Overheads
            </div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              ₹{kpis.generalOverheadExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">Admin, upkeep, utilities</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Petty Cash Drawer
            </div>
            <div className="text-base font-bold font-mono text-[#174D3C] mt-0.5">
              ₹{kpis.currentPettyCashBalance.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              ₹{kpis.pettyCashOutflow.toLocaleString()} spent
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto print:hidden bg-white px-2 rounded-t-xl">
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === "ledger"
            ? "border-[#174D3C] text-[#174D3C]"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          Master Unified Ledger ({report?.ledger.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("crop_pnl")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === "crop_pnl"
            ? "border-[#174D3C] text-[#174D3C]"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          Crop Cycles Financials ({report?.sections.cropFinancials.cyclesCount || 0})
        </button>
        <button
          onClick={() => setActiveTab("workforce")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === "workforce"
            ? "border-[#174D3C] text-[#174D3C]"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          Workforce & Wages ({report?.sections.workforceWages.totalWorkersActive || 0})
        </button>
        <button
          onClick={() => setActiveTab("machinery")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === "machinery"
            ? "border-[#174D3C] text-[#174D3C]"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          Machinery Operations ({report?.sections.machineryUsage.totalRuns || 0})
        </button>
        <button
          onClick={() => setActiveTab("daily_ops")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === "daily_ops"
            ? "border-[#174D3C] text-[#174D3C]"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          Daily Work Logs & Gaps ({report?.sections.dailyLogs.totalLogs || 0})
        </button>
      </div>

      {/* TAB 1: MASTER UNIFIED LEDGER */}
      {(activeTab === "ledger" || typeof window === "undefined") && report && (
        <ContentCard
          title="Chronological Master Consolidated Estate Ledger"
        >
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Stream</th>
                  <th className="py-3 px-4">Plot / Location</th>
                  <th className="py-3 px-4">Crop / Project</th>
                  <th className="py-3 px-4">Category / Status</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right text-rose-600">Debit (Expense)</th>
                  <th className="py-3 px-4 text-right text-[#174D3C]">Credit (Income)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {report.ledger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No ledger transactions found matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  report.ledger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                        {row.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${row.stream === "CROP_INCOME"
                            ? "bg-[#EAF3EE] text-[#174D3C]"
                            : row.stream === "CROP_EXPENSE"
                              ? "bg-rose-50 text-rose-700"
                              : row.stream === "WORKER_WAGE"
                                ? "bg-blue-50 text-blue-700"
                                : row.stream === "MACHINERY"
                                  ? "bg-purple-50 text-purple-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                        >
                          {row.stream}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                        {row.plotName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {row.cropName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {row.categoryOrStatus}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-700" title={row.description}>
                        {row.description}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-medium text-rose-600">
                        {row.debitExpense > 0 ? `₹${row.debitExpense.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-[#174D3C]">
                        {row.creditIncome > 0 ? `+₹${row.creditIncome.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      {/* TAB 2: CROP CYCLES FINANCIALS */}
      {activeTab === "crop_pnl" && report && (
        <ContentCard
          title="Crop Cycle Seed-to-Harvest Financial P&L"
        >
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Plot</th>
                  <th className="py-3 px-4">Crop Cycle</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right text-emerald-700">Total Revenue</th>
                  <th className="py-3 px-4 text-right text-rose-600">Total Expenses</th>
                  <th className="py-3 px-4 text-right font-bold">Net Profit / Loss</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {report.sections.cropFinancials.cyclesBreakdown.map((c) => (
                  <tr key={c.cycleId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.plotName}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{c.cropName}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      ₹{c.income.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600">
                      ₹{c.expenses.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={c.net >= 0 ? "text-[#174D3C]" : "text-rose-600"}>
                        {c.net >= 0 ? "+" : ""}₹{c.net.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/crop-cycles/${c.cycleId}`}
                        className="text-xs text-[#174D3C] hover:text-[#103C30] font-semibold"
                      >
                        View Cycle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      {/* TAB 3: WORKFORCE & WAGES */}
      {activeTab === "workforce" && report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Wages Computed"
              value={`₹${report.sections.workforceWages.totalWagesComputed.toLocaleString()}`}
              icon={<Users className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Total Wages Paid"
              value={`₹${report.sections.workforceWages.totalWagesPaid.toLocaleString()}`}
              icon={<Check className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Outstanding Wage Dues"
              value={`₹${report.sections.workforceWages.unpaidWages.toLocaleString()}`}
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            />
          </div>

          <ContentCard
            title="Worker-Wise Wages & Attendance Summary"
          >
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Worker Name</th>
                    <th className="py-3 px-4 text-center">Days Present</th>
                    <th className="py-3 px-4 text-right">Computed Wages</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Paid Wages</th>
                    <th className="py-3 px-4 text-right text-amber-700">Balance Owed</th>
                    <th className="py-3 px-4 text-center">Wage Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {report.sections.workforceWages.workerSummary.map((w) => {
                    const balance = Math.max(0, w.wagesComputed - w.wagesPaid);
                    return (
                      <tr key={w.workerId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{w.workerName}</td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700">{w.daysPresent} days</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                          ₹{w.wagesComputed.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                          ₹{w.wagesPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                          ₹{balance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${w.status === "PAID"
                              ? "bg-[#EAF3EE] text-[#174D3C]"
                              : w.status === "PARTIAL"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-slate-100 text-slate-600"
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
          </ContentCard>
        </div>
      )}

      {/* TAB 4: MACHINERY OPERATIONS */}
      {activeTab === "machinery" && report && (
        <ContentCard
          title="Machinery & Fleet Utilization"
        >
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Hours Worked</th>
                  <th className="py-3 px-4 text-right">Operating Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {report.sections.machineryUsage.machinesBreakdown.map((m) => (
                  <tr key={m.machineName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{m.machineName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{m.type}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">{m.hours} hrs</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{m.cost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}

      {/* TAB 5: DAILY OPS & GAPS */}
      {activeTab === "daily_ops" && report && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Daily Work Logs"
              value={`${report.sections.dailyLogs.completedLogs} / ${report.sections.dailyLogs.totalLogs}`}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Unfinished Activities"
              value={`${report.sections.dailyLogs.notDoneActivities.length}`}
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            />
          </div>

          <ContentCard
            title="Uncompleted / Carried Forward Work Activities"
          >
            {report.sections.dailyLogs.notDoneActivities.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-[#174D3C] mx-auto mb-2 opacity-60" />
                All scheduled work activities were successfully completed!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs -mx-6 -mb-6">
                {report.sections.dailyLogs.notDoneActivities.map((act, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-900">{act.activity}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {act.date} • {act.plotName}
                      </div>
                    </div>
                    {act.reason && (
                      <div className="text-[11px] text-amber-800 italic bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">
                        &quot;{act.reason}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ContentCard>
        </div>
      )}
    </PageContainer>
  );
}
