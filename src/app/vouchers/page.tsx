"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Sparkles,
  Layers,
  Pill,
  Syringe,
  Receipt,
  ArrowRight,
  PlusCircle,
  Clock,
  TrendingDown,
} from "lucide-react";

export default function VouchersHubPage() {
  const [summary, setSummary] = useState<any>({
    feedCount: 0,
    feedTotal: 0,
    medicineCount: 0,
    medicineTotal: 0,
    vaccineCount: 0,
    vaccineTotal: 0,
    otherCount: 0,
    otherTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/vouchers/summary");
        const data = await res.json();
        setSummary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalProcurements =
    (summary.feedTotal || 0) +
    (summary.medicineTotal || 0) +
    (summary.vaccineTotal || 0) +
    (summary.otherTotal || 0);

  const voucherCards = [
    {
      type: "feed",
      title: "Feed & Nutrition Vouchers",
      subtitle: "Silage bales, concentrate mash, organic mineral mixes",
      count: summary.feedCount,
      total: summary.feedTotal,
      icon: Layers,
      color: "emerald",
      bgGradient: "from-emerald-900 to-emerald-950 text-white",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      type: "medicine",
      title: "Crop Medicine & Protection Vouchers",
      subtitle: "Bio-protectors, foliar sprays, micronutrient tonics",
      count: summary.medicineCount,
      total: summary.medicineTotal,
      icon: Pill,
      color: "sky",
      bgGradient: "from-sky-900 to-sky-950 text-white",
      badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
    },
    {
      type: "vaccine",
      title: "Biologics & Immunity Vouchers",
      subtitle: "Bio-fungicides, rhizobium & soil health inoculants",
      count: summary.vaccineCount,
      total: summary.vaccineTotal,
      icon: Syringe,
      color: "purple",
      bgGradient: "from-purple-900 to-purple-950 text-white",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    },
    {
      type: "other",
      title: "Other Operational Vouchers",
      subtitle: "Electricity, agronomist consultation, machinery & spares",
      count: summary.otherCount,
      total: summary.otherTotal,
      icon: Receipt,
      color: "slate",
      bgGradient: "from-slate-800 to-slate-900 text-white",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-6 rounded-2xl gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-emerald-900 text-white rounded-xl shadow-xs">
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Purchase Vouchers Hub</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Centralized purchase ledger recording for livestock, feed, health supplies, and farm operating costs.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Voucher Outflow</span>
            <div className="text-base font-bold text-slate-900">₹{totalProcurements.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Grid of Voucher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {voucherCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.type}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.bgGradient} shadow-xs`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${card.badgeColor}`}>
                    {loading ? "..." : `${card.count} Entries`}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{card.subtitle}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Recorded Spend:</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{loading ? "0" : Number(card.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/vouchers/${card.type}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <span>View Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
