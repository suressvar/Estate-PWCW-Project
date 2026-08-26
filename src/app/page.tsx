"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sprout,
  Briefcase,
  TrendingUp,
  Fuel,
  Calendar,
  Bell,
  Tractor,
  MapPin,
  Users,
  ShoppingCart,
  Layers,
  ArrowRight,
  ChevronDown,
  Gauge,
} from "lucide-react";

export default function DashboardPage() {
  const [selectedPlot, setSelectedPlot] = useState("Plot A - North Field");
  const [fromDate, setFromDate] = useState("2026-06-01");
  const [toDate, setToDate] = useState("2026-06-30");

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      {/* Top Header Section matching picture */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <span>Good morning, Administrator!</span>
            <span>🌱</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ranga Estate Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time financial aggregation, computed stock levels, and per-plot drilldown views.
          </p>
        </div>

        {/* Top Right Controls: Date Range & Notification Bell */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-xs flex items-center gap-3 text-xs text-slate-700 font-semibold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">From:</span>
              <span className="font-bold text-slate-800">01-06-2026</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">To:</span>
              <span className="font-bold text-slate-800">30-06-2026</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <button
            className="w-10 h-10 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-xs relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2.5 right-2.5 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards matching picture */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Total Crop Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[175px]">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#edfbf1] flex items-center justify-center text-[#1eb854] shrink-0">
                <Sprout className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                TOTAL CROP REVENUE
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">₹1,95,000</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <span>▲ 12.5%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
          </div>

          {/* Green Sparkline Wave */}
          <div className="w-full h-8 overflow-hidden">
            <svg viewBox="0 0 200 35" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,28 Q 25,32 50,22 T 100,18 T 150,26 T 200,12"
                fill="none"
                stroke="#34c759"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* CARD 2: Total Operating Expense */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[175px]">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#edfbf1] flex items-center justify-center text-[#1eb854] shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                TOTAL OPERATING EXPENSE
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">₹46,850</div>
              <div className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                <span>▼ 5.2%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
          </div>

          {/* Green Sparkline Wave */}
          <div className="w-full h-8 overflow-hidden">
            <svg viewBox="0 0 200 35" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,20 Q 30,30 60,16 T 120,24 T 170,12 T 200,26"
                fill="none"
                stroke="#34c759"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* CARD 3: Net Farm Profit (P&L) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[175px]">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#edfbf1] flex items-center justify-center text-[#1eb854] shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                NET FARM PROFIT (P&L)
              </span>
            </div>
            <div className="mt-2.5">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-slate-900 tracking-tight">₹1,48,150</div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#edfbf1] text-[#1eb854] text-[9px] font-extrabold tracking-wide uppercase border border-[#bbf7d0]">
                  PROFITABLE
                </span>
              </div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                <span>▲ 18.7%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
          </div>

          {/* Green Sparkline Wave */}
          <div className="w-full h-8 overflow-hidden">
            <svg viewBox="0 0 200 35" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,26 Q 40,32 80,18 T 140,24 T 180,12 T 200,20"
                fill="none"
                stroke="#34c759"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* CARD 4: Current Fuel Stock */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[175px]">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#edfbf1] flex items-center justify-center text-[#1eb854] shrink-0">
                <Fuel className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                CURRENT FUEL STOCK
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">450 Liters</div>
              <div className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                <span>▼ 8.3%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
          </div>

          {/* Green Sparkline Wave */}
          <div className="w-full h-8 overflow-hidden">
            <svg viewBox="0 0 200 35" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,22 Q 35,32 75,18 T 130,26 T 175,14 T 200,24"
                fill="none"
                stroke="#34c759"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Middle Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Crop-wise Profit & Loss Aggregation */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-[#1eb854]" />
                Crop-wise Profit & Loss Aggregation
              </h2>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5">CROP ITEM</th>
                    <th className="py-2.5">REVENUE</th>
                    <th className="py-2.5">EXPENSE</th>
                    <th className="py-2.5">NET PROFIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  <tr>
                    <td className="py-3 font-bold text-slate-800">Tomato</td>
                    <td className="py-3 text-slate-900">₹1,20,000</td>
                    <td className="py-3 text-rose-500">₹34,250</td>
                    <td className="py-3 text-emerald-600 font-bold">₹85,750</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-slate-800">Coconut</td>
                    <td className="py-3 text-slate-900">₹75,000</td>
                    <td className="py-3 text-rose-500">₹12,600</td>
                    <td className="py-3 text-emerald-600 font-bold">₹62,400</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-slate-700">Fertilizer Application</td>
                    <td className="py-3 text-slate-800">₹0</td>
                    <td className="py-3 text-slate-800">₹0</td>
                    <td className="py-3 text-slate-800">₹0</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-slate-700">Weeding & Tying</td>
                    <td className="py-3 text-slate-800">₹0</td>
                    <td className="py-3 text-slate-800">₹0</td>
                    <td className="py-3 text-slate-800">₹0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/reports"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
            >
              View all crop reports →
            </Link>
          </div>
        </div>

        {/* RIGHT: Machinery Fuel Efficiency (Liters / Hour) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tractor className="w-4 h-4 text-[#1eb854]" />
                Machinery Fuel Efficiency (Liters / Hour)
              </h2>
              <Link href="/machinery" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                View all →
              </Link>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5">MACHINE EQUIPMENT</th>
                    <th className="py-2.5">TOTAL HOURS</th>
                    <th className="py-2.5">DIESEL USED</th>
                    <th className="py-2.5">EFFICIENCY (L/HR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  <tr>
                    <td className="py-3 font-bold text-slate-800">John Deere Tractor</td>
                    <td className="py-3 text-slate-700">6 hrs</td>
                    <td className="py-3 text-amber-600 font-bold">27 L</td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900">4.5 L/hr</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-[#1eb854] rounded-full" />
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-slate-800">VST Tillers</td>
                    <td className="py-3 text-slate-700">5 hrs</td>
                    <td className="py-3 text-amber-600 font-bold">10 L</td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900">2 L/hr</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-[#1eb854] rounded-full" />
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Overall Efficiency Bar with Sparkline */}
          <div className="p-3 bg-[#edfbf1]/70 border border-[#dcfce7] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Gauge className="w-4 h-4 text-[#1eb854]" />
              <span>Overall Efficiency:</span>
              <span className="text-[#1eb854] font-black font-mono">3.25 L/hr</span>
            </div>

            <div className="w-24 h-6 overflow-hidden">
              <svg viewBox="0 0 100 25" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d="M 0,18 Q 25,24 50,12 T 85,16 T 100,8"
                  fill="none"
                  stroke="#1eb854"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Drill-Down Card: Per-Plot Master Drill-Down View matching picture */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1eb854]" />
              Per-Plot Master Drill-Down View
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              View all 6 transaction categories for a single land plot in one place
            </p>
          </div>

          {/* Select Plot Pill Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Select Plot:</span>
            <div className="bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs">
              <span>{selectedPlot}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* 3 Column Mini-Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Mini-Card 1: Fertilizer Log Entries */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-3 flex flex-col justify-between hover:bg-white hover:border-[#1eb854]/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#edfbf1] flex items-center justify-center text-[#1eb854] shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Fertilizer Log Entries (2)</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium space-y-1 pl-1">
                <div>2026-06-01: NPK 19-19-19 (1000kg) - ₹45,000</div>
                <div>2026-06-15: NPK 19-19-19 (350kg) - ₹15,750</div>
              </div>
            </div>
            <Link
              href="/fertilizer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 pt-1"
            >
              View all →
            </Link>
          </div>

          {/* Mini-Card 2: Labor Log Entries */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-3 flex flex-col justify-between hover:bg-white hover:border-[#1eb854]/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Labor Log Entries (1)</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium space-y-1 pl-1">
                <div>2026-07-15: 4M / 6W (Payout: ₹5,100)</div>
              </div>
            </div>
            <Link
              href="/labor"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 pt-1"
            >
              View all →
            </Link>
          </div>

          {/* Mini-Card 3: Sales & Yield Logs */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-3 flex flex-col justify-between hover:bg-white hover:border-[#1eb854]/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Sales & Yield Logs (1)</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium space-y-1 pl-1">
                <div>2026-07-16: Sold 2000kg (Revenue: ₹1,20,000)</div>
              </div>
            </div>
            <Link
              href="/sales"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 pt-1"
            >
              View all →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
