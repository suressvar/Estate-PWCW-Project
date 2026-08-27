"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { PnLStatementResult } from "@/lib/pnl-data";

export default function ProfitAndLossReportPage() {
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2027-03-31");
  const [report, setReport] = useState<PnLStatementResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPnL = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/pnl?fromDate=${fromDate}&toDate=${toDate}`);
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnL();
  }, [fromDate, toDate]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Profit & Loss (P&L) Statement</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" /> Print P&L Statement
          </button>
        </div>
      </div>

      {/* Date Filter Bar (Hidden on Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Accounting Period:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
          />
          <span>to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
          />
          <button
            onClick={fetchPnL}
            className="px-3 py-1.5 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900 transition-all shadow-xs"
          >
            Generate Report
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFromDate("2026-04-01"); setToDate("2027-03-31"); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
          >
            Current FY 2026-27
          </button>
          <button
            onClick={() => { setFromDate("2025-04-01"); setToDate("2026-03-31"); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
          >
            Past FY 2025-26
          </button>
        </div>
      </div>

      {/* Summary KPI Highlights (Hidden on Print) */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Trading Turnover / Revenue</span>
            <div className="text-lg font-bold text-emerald-800 mt-0.5">
              ₹{report.summary.totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operational Expenditures</span>
            <div className="text-lg font-bold text-rose-800 mt-0.5">
              ₹{report.summary.totalExpenses.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Bottomline Profit</span>
            <div className={`text-lg font-extrabold mt-0.5 ${report.summary.isProfitable ? "text-emerald-900" : "text-red-700"}`}>
              {report.summary.isProfitable ? `₹${report.netProfit.toLocaleString()} (PROFIT)` : `₹${report.netLoss.toLocaleString()} (LOSS)`}
            </div>
          </div>
        </div>
      )}

      {/* Printable T-Format Statement */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 text-slate-900 text-xs">
        {/* Printable Header */}
        <div className="text-center border-b-2 border-emerald-900 pb-4 space-y-1">
          <h2 className="text-xl font-black text-emerald-950 uppercase tracking-wide">ESTATE & PWCW</h2>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            PROFIT & LOSS ACCOUNT STATEMENT
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            For the Financial Period: <span className="font-bold text-slate-900">{fromDate}</span> to <span className="font-bold text-slate-900">{toDate}</span> ({report?.periodName})
          </p>
        </div>

        {/* T-Format Double-Column Table */}
        {report && (
          <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-slate-300">
              {/* LEFT SIDE: DEBIT (DR) / EXPENDITURE */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="bg-emerald-900 text-white p-3 font-bold uppercase tracking-wider text-[11px] flex justify-between">
                    <span>DR. (Expenditure Side)</span>
                    <span>Amount (₹)</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {report.debitItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 flex justify-between items-center ${item.isBalanceFigure ? "bg-emerald-50 text-emerald-950 font-extrabold border-t-2 border-emerald-200" : "hover:bg-slate-50"}`}
                      >
                        <div className="pr-4">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          {item.subItems && (
                            <div className="pl-3 text-[11px] text-slate-500 mt-0.5">
                              {item.subItems.map((s, sIdx) => (
                                <div key={sIdx}>• {s.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Left Side Total */}
                <div className="bg-slate-100 p-3 font-extrabold border-t-2 border-slate-300 flex justify-between text-slate-900 text-sm">
                  <span>TOTAL DEBIT (DR):</span>
                  <span className="font-mono text-emerald-900">₹{report.balancedTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* RIGHT SIDE: CREDIT (CR) / INCOME */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="bg-emerald-900 text-white p-3 font-bold uppercase tracking-wider text-[11px] flex justify-between">
                    <span>CR. (Income Side)</span>
                    <span>Amount (₹)</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {report.creditItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 flex justify-between items-center ${item.isBalanceFigure ? "bg-rose-50 text-rose-950 font-extrabold border-t-2 border-rose-200" : "hover:bg-slate-50"}`}
                      >
                        <div className="pr-4">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          {item.subItems && (
                            <div className="pl-3 text-[11px] text-slate-500 mt-0.5">
                              {item.subItems.map((s, sIdx) => (
                                <div key={sIdx}>• {s.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side Total */}
                <div className="bg-slate-100 p-3 font-extrabold border-t-2 border-slate-300 flex justify-between text-slate-900 text-sm">
                  <span>TOTAL CREDIT (CR):</span>
                  <span className="font-mono text-emerald-900">₹{report.balancedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification & Signatures */}
        <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-slate-600 text-xs">
          <div>
            <div>Prepared By: Estate Accounts Department</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Verified with transaction journals</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-900">Managing Partner / Trustee</div>
            <div className="text-[10px] text-slate-400">Estate & Livestock Breeding LLP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
