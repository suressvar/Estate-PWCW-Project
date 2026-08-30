"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Warehouse,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  ExternalLink,
  Calendar,
  Filter,
  Package,
  Layers,
  Send,
} from "lucide-react";
import type { GodownStockMovement } from "@/types/estate";

export default function GodownMovementsPage() {
  const [movements, setMovements] = useState<GodownStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    async function fetchMovements() {
      try {
        setLoading(true);
        const res = await fetch("/api/godown/movements");
        const data = await res.json();
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load movements:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovements();
  }, []);

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.destinationMenu && m.destinationMenu.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.source && m.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.plotName && m.plotName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "ALL" || m.movementType === typeFilter;

    return matchesSearch && matchesType;
  });

  const inwardCount = movements.filter((m) => m.movementType === "INWARD_PURCHASE").length;
  const outwardCount = movements.filter((m) => m.movementType === "ISSUE_TO_MENU").length;
  const totalCostMoved = movements.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/godown"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Godown Stock Movement Register</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Audit Trail
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/godown"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Warehouse className="w-4 h-4 text-emerald-700" />
            <span>Godown Inventory</span>
          </Link>
          <Link
            href="/godown/issue"
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Issue Stock</span>
          </Link>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Movement Logs</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{movements.length} transactions</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Inward from Purchases</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">{inwardCount} inward receipts</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase">Issued to Menus</span>
            <div className="text-xl font-bold text-blue-700 mt-1">{outwardCount} menu dispatches</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search movements by item, category, destination menu, or plot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Filter Type:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                typeFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({movements.length})
            </button>
            <button
              onClick={() => setTypeFilter("INWARD_PURCHASE")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                typeFilter === "INWARD_PURCHASE" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inward ({inwardCount})
            </button>
            <button
              onClick={() => setTypeFilter("ISSUE_TO_MENU")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                typeFilter === "ISSUE_TO_MENU" ? "bg-blue-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Issued to Menus ({outwardCount})
            </button>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Movement Logs History ({filteredMovements.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading stock movements...</div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No stock movements found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Movement Type</th>
                  <th className="p-3.5">Item & Category</th>
                  <th className="p-3.5 text-right">Quantity</th>
                  <th className="p-3.5 text-right">Total Value</th>
                  <th className="p-3.5">Source / Origin</th>
                  <th className="p-3.5">Destination Menu / Allocation</th>
                  <th className="p-3.5">Issued To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMovements.map((mov) => {
                  const isInward = mov.movementType === "INWARD_PURCHASE";

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="p-3.5 whitespace-nowrap font-medium text-slate-800">
                        {mov.date}
                      </td>

                      {/* Movement Type */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                            isInward
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {isInward ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                              <span>INWARD (Purchase)</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-blue-600" />
                              <span>OUTWARD (Issue)</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Item & Category */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{mov.itemName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{mov.category}</div>
                      </td>

                      {/* Quantity */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                        {mov.quantity} {mov.unit}
                      </td>

                      {/* Total Value */}
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-800 text-sm">
                        ₹{Number(mov.totalCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Source */}
                      <td className="p-3.5 text-slate-600">
                        {mov.source}
                      </td>

                      {/* Destination / Plot Allocation */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{mov.destinationMenu}</div>
                        {mov.plotName && (
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <span>{mov.plotName}</span>
                            {mov.cropActivityName && <span>• {mov.cropActivityName}</span>}
                          </div>
                        )}
                      </td>

                      {/* Issued To */}
                      <td className="p-3.5 text-slate-600">
                        <div className="font-medium text-slate-800">{mov.issuedTo || "—"}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
