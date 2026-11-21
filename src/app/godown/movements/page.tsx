"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Search,
  Send,
  Warehouse,
} from "lucide-react";
import type { GodownStockMovement } from "@/types/estate";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { StatCard } from "@/components/ui/stat-card";

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

  return (
    <PageContainer>
      <PageHeader
        title="Stock Movement Register"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Godown Inventory", href: "/godown" },
          { label: "Movements Register" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/godown"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111827] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg transition-colors shadow-2xs"
            >
              <Warehouse className="w-3.5 h-3.5 text-[#174D3C]" />
              <span>Godown Inventory</span>
            </Link>
            <Link
              href="/godown/issue"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#174D3C] hover:bg-[#103C30] rounded-lg shadow-2xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Issue Stock</span>
            </Link>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Movements"
          value={movements.length}
          subtitle="All transactions logged"
          icon={History}
        />
        <StatCard
          title="Inward Receipts"
          value={inwardCount}
          subtitle="From purchases & inward logs"
          icon={ArrowDownLeft}
        />
        <StatCard
          title="Menu Dispatches"
          value={outwardCount}
          subtitle="Issued to operational modules"
          icon={ArrowUpRight}
        />
      </div>

      {/* Main Table Card */}
      <ContentCard
        title="Movement Audit Trail"
        badge={`${filteredMovements.length} records`}
        actions={
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                typeFilter === "ALL"
                  ? "bg-[#174D3C] text-white"
                  : "bg-[#F1F5F9] text-[#64748B] hover:text-[#111827]"
              }`}
            >
              All ({movements.length})
            </button>
            <button
              onClick={() => setTypeFilter("INWARD_PURCHASE")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                typeFilter === "INWARD_PURCHASE"
                  ? "bg-[#174D3C] text-white"
                  : "bg-[#F1F5F9] text-[#64748B] hover:text-[#111827]"
              }`}
            >
              Inward ({inwardCount})
            </button>
            <button
              onClick={() => setTypeFilter("ISSUE_TO_MENU")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                typeFilter === "ISSUE_TO_MENU"
                  ? "bg-[#174D3C] text-white"
                  : "bg-[#F1F5F9] text-[#64748B] hover:text-[#111827]"
              }`}
            >
              Dispatches ({outwardCount})
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movements by item, category, destination menu, or plot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748B]">Loading stock movements...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#64748B]">No stock movements found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Date</th>
                    <th className="py-2.5 px-4 font-medium">Type</th>
                    <th className="py-2.5 px-4 font-medium">Item & Category</th>
                    <th className="py-2.5 px-4 font-medium text-right">Quantity</th>
                    <th className="py-2.5 px-4 font-medium text-right">Value</th>
                    <th className="py-2.5 px-4 font-medium">Source / Origin</th>
                    <th className="py-2.5 px-4 font-medium">Destination / Allocation</th>
                    <th className="py-2.5 px-4 font-medium">Issued To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#111827]">
                  {filteredMovements.map((mov) => {
                    const isInward = mov.movementType === "INWARD_PURCHASE";

                    return (
                      <tr key={mov.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-[#111827] text-xs">
                          {mov.date}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              isInward
                                ? "bg-[#EAF3EE] text-[#174D3C] border-[#C5DEC8]"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}
                          >
                            {isInward ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3 text-[#174D3C]" />
                                <span>INWARD</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3 text-blue-600" />
                                <span>ISSUE</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111827] text-xs">{mov.itemName}</div>
                          <div className="text-[11px] text-[#64748B]">{mov.category}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#111827] text-xs">
                          {mov.quantity} {mov.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#174D3C] text-xs">
                          ₹{Number(mov.totalCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-[#475569] text-xs">
                          {mov.source}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#111827] text-xs">{mov.destinationMenu}</div>
                          {mov.plotName && (
                            <div className="text-[11px] text-[#64748B] mt-0.5">
                              {mov.plotName} {mov.cropActivityName && `• ${mov.cropActivityName}`}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#475569] text-xs">
                          {mov.issuedTo || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ContentCard>
    </PageContainer>
  );
}
