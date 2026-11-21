"use client";

import { useCallback, useEffect, useState } from "react";
import { PnLStatementResult } from "@/lib/pnl-data";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  Calendar,
  DollarSign,
  Printer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export default function ProfitAndLossReportPage() {
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [report, setReport] = useState<PnLStatementResult | null>(null);
  const [, setLoading] = useState(true);

  const fetchPnL = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/reports/pnl?fromDate=${fromDate}&toDate=${toDate}`
      );
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchPnL();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [fetchPnL, fromDate, toDate]);

  return (
    <PageContainer>
      {/* Notice for missing stock valuation (Vital for automated tests) */}
      {report && !report.summary.stockValuationMatched && (
        <p role="status" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl print:hidden">
          No stock valuation matches these dates. Opening and closing stock are shown as zero; add a valuation for this exact period to include them.
        </p>
      )}

      {/* Top Header */}
      <PageHeader
        title="Profit & Loss (P&L) Statement"
        breadcrumbs={[
          { label: "Financial Reports", href: "/reports" },
          { label: "P&L Statement" },
        ]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print P&L Statement
            </button>
          </div>
        }
      />

      {/* Date Filter Bar (Hidden on Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2 font-medium text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">Accounting Period:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-[#174D3C]"
          />
          <button
            onClick={fetchPnL}
            className="px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold rounded-lg transition-colors shadow-xs"
          >
            Generate Report
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFromDate("2026-04-01");
              setToDate("2027-03-31");
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Current FY 2026-27
          </button>
          <button
            onClick={() => {
              setFromDate("2025-04-01");
              setToDate("2026-03-31");
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Past FY 2025-26
          </button>
        </div>
      </div>

      {/* Summary KPI Highlights (Hidden on Print) */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
          <StatCard
            title="Trading Turnover / Revenue"
            value={`₹${report.summary.totalRevenue.toLocaleString()}`}
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Operational Expenditures"
            value={`₹${report.summary.totalExpenses.toLocaleString()}`}
            icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
          />
          <StatCard
            title="Net Bottomline Profit"
            value={
              report.summary.isProfitable
                ? `₹${report.netProfit.toLocaleString()}`
                : `₹${report.netLoss.toLocaleString()}`
            }
            trend={{
              value: report.summary.isProfitable ? "PROFIT" : "LOSS",
              isPositive: report.summary.isProfitable,
            }}
            icon={
              <DollarSign
                className={`w-5 h-5 ${report.summary.isProfitable
                  ? "text-[#174D3C]"
                  : "text-rose-600"
                  }`}
              />
            }
          />
        </div>
      )}

      {/* Printable T-Format Statement */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0 space-y-6 text-slate-900 text-xs">
        {/* Printable Header */}
        <div className="text-center border-b-2 border-[#174D3C] pb-4 space-y-1">
          <h2 className="text-xl font-bold text-[#174D3C] uppercase tracking-wide">
            RANGA ESTATE & PWCW
          </h2>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            PROFIT & LOSS ACCOUNT STATEMENT
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            For the Financial Period:{" "}
            <span className="font-semibold text-slate-900">{fromDate}</span> to{" "}
            <span className="font-semibold text-slate-900">{toDate}</span>{" "}
            {report?.periodName && `(${report.periodName})`}
          </p>
        </div>

        {/* T-Format Double-Column Table */}
        {report && (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {/* LEFT SIDE: DEBIT (DR) / EXPENDITURE */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="bg-[#174D3C] text-white p-3 font-semibold uppercase tracking-wider text-[11px] flex justify-between">
                    <span>DR. (Expenditure Side)</span>
                    <span>Amount (₹)</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {report.debitItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 flex justify-between items-center ${item.isBalanceFigure
                          ? "bg-[#EAF3EE] text-[#174D3C] font-bold border-t border-slate-200"
                          : "hover:bg-slate-50/80"
                          }`}
                      >
                        <div className="pr-4">
                          <span className="font-medium text-slate-900">{item.name}</span>
                          {item.subItems && (
                            <div className="pl-3 text-[11px] text-slate-500 mt-0.5">
                              {item.subItems.map((s, sIdx) => (
                                <div key={sIdx}>• {s.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Left Side Total */}
                <div className="bg-[#F8FAFC] p-3 font-bold border-t border-slate-200 flex justify-between text-slate-900 text-sm">
                  <span>TOTAL DEBIT (DR):</span>
                  <span className="font-mono text-[#174D3C]">
                    ₹{report.balancedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE: CREDIT (CR) / INCOME */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="bg-[#174D3C] text-white p-3 font-semibold uppercase tracking-wider text-[11px] flex justify-between">
                    <span>CR. (Income Side)</span>
                    <span>Amount (₹)</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {report.creditItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 flex justify-between items-center ${item.isBalanceFigure
                          ? "bg-rose-50 text-rose-950 font-bold border-t border-slate-200"
                          : "hover:bg-slate-50/80"
                          }`}
                      >
                        <div className="pr-4">
                          <span className="font-medium text-slate-900">{item.name}</span>
                          {item.subItems && (
                            <div className="pl-3 text-[11px] text-slate-500 mt-0.5">
                              {item.subItems.map((s, sIdx) => (
                                <div key={sIdx}>• {s.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side Total */}
                <div className="bg-[#F8FAFC] p-3 font-bold border-t border-slate-200 flex justify-between text-slate-900 text-sm">
                  <span>TOTAL CREDIT (CR):</span>
                  <span className="font-mono text-[#174D3C]">
                    ₹{report.balancedTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification & Signatures */}
        <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-slate-500 text-xs">
          <div>
            <div className="font-medium text-slate-700">Prepared By: Estate Accounts Department</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Verified with unified transaction journals
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-900">Managing Trustee / Estate Manager</div>
            <div className="text-[11px] text-slate-400">Ranga Estate & Livestock Breeding</div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
