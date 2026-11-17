"use client";
import { errorMessage as getErrorMessage } from "@/lib/errors";

import { PlotsCropsNav } from "@/components/plots-crops-nav";
import { StatCard } from "@/components/ui/stat-card";
import { CropCycleStatus } from "@/lib/db-storage";
import {
ArrowRight,
Calendar,
CircleDollarSign,
Filter,
Layers,
MapPin,
Plus,
RefreshCw,
Sprout,
X
} from "lucide-react";
import Link from "next/link";
import React,{ Suspense,useCallback,useEffect,useState } from "react";

interface CropCycleListItem {
  id: string;
  plotId: string;
  plotName: string;
  cropName: string;
  cropType?: string;
  sowingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string | null;
  status: CropCycleStatus;
  notes?: string;
  totalExpenses: number;
  totalIncome: number;
  netProfitLoss: number;
}

interface PlotRollup {
  plotId: string;
  plotName: string;
  areaAcres: number;
  totalCyclesCount: number;
  activeCyclesCount: number;
  closedCyclesCount: number;
  lifetimeExpenses: number;
  lifetimeIncome: number;
  lifetimeProfitLoss: number;
  lifetimeRoiPercent: number;
}

function CropCyclesOverviewContent() {
  const [cycles, setCycles] = useState<CropCycleListItem[]>([]);
  const [estateRollup, setEstateRollup] = useState<{
    estateTotalExpenses: number;
    estateTotalIncome: number;
    estateNetProfitLoss: number;
    estateTotalCycles: number;
    plotRollups: PlotRollup[];
  } | null>(null);

  const [plots, setPlots] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlotFilter, setSelectedPlotFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Modal State for New Crop Cycle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plotId, setPlotId] = useState("");
  const [cropName, setCropName] = useState("");
  const [cropType, setCropType] = useState("");
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState(() =>
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<CropCycleStatus>("SOWN");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cyclesRes, plotsRes] = await Promise.all([
        fetch("/api/crop-cycles?includeRollup=true"),
        fetch("/api/plots"),
      ]);

      if (cyclesRes.ok) {
        const data = await cyclesRes.json();
        setCycles(data.cycles || []);
        setEstateRollup(data.estateRollup || null);
      }
      if (plotsRes.ok) {
        const plotsData = await plotsRes.json();
        setPlots(plotsData);
        if (plotsData.length > 0 && !plotId) {
          setPlotId(plotsData[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load crop cycles", e);
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => { dispose = (() => {
    fetchData();
  })(); }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, [fetchData]);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plotId || !cropName.trim()) {
      setErrorMessage("Plot and Crop Name are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const res = await fetch("/api/crop-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId,
          cropName,
          cropType,
          sowingDate,
          expectedHarvestDate,
          status,
          notes,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setCropName("");
        setCropType("");
        setNotes("");
        fetchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to create crop cycle");
      }
    } catch (e) {
      setErrorMessage(getErrorMessage(e) || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter cycles
  const filteredCycles = cycles.filter((c) => {
    const matchesPlot = selectedPlotFilter === "ALL" || c.plotId === selectedPlotFilter;
    const matchesStatus = selectedStatusFilter === "ALL" || c.status === selectedStatusFilter;
    return matchesPlot && matchesStatus;
  });

  const lifetimeExpenses = estateRollup?.estateTotalExpenses || 0;
  const lifetimeIncome = estateRollup?.estateTotalIncome || 0;
  const lifetimeProfit = estateRollup?.estateNetProfitLoss || 0;
  const activeCount = cycles.filter((c) => c.status === "SOWN" || c.status === "GROWING" || c.status === "HARVESTED").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Subnavigation Bar */}
      <PlotsCropsNav stats={{ cyclesCount: cycles.length }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-lg border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Crop Cycles Financial Performance</h1>
          </div>
        </div>

        <button
          id="new-crop-cycle-btn"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Crop Cycle</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Lifetime Expenses"
          value={`₹${lifetimeExpenses.toLocaleString()}`}
          subtitle="Seeds, fertilizer, labor & machinery"
        />
        <StatCard
          title="Lifetime Revenue"
          value={`₹${lifetimeIncome.toLocaleString()}`}
          subtitle="All crop harvest sales"
        />
        <StatCard
          title="Net Lifetime P&L"
          value={`₹${lifetimeProfit.toLocaleString()}`}
          isPositive={lifetimeProfit >= 0}
          change={lifetimeProfit >= 0 ? "NET PROFIT" : "NET LOSS"}
        />
        <StatCard
          title="Active Crop Cycles"
          value={activeCount.toString()}
          subtitle={`${cycles.length} total cycles tracked`}
        />
      </div>

      {/* Plot-Level Rollup Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Plot Lifetime Financial Rollups</h2>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="plot-rollups-table">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Plot Name</th>
                <th className="py-3 px-4 text-center">Area</th>
                <th className="py-3 px-4 text-center">Cycles</th>
                <th className="py-3 px-4 text-right">Lifetime Expenses</th>
                <th className="py-3 px-4 text-right">Lifetime Revenue</th>
                <th className="py-3 px-4 text-right">Net Profit / Loss</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {estateRollup?.plotRollups && estateRollup.plotRollups.length > 0 ? (
                estateRollup.plotRollups.map((p) => (
                  <tr key={p.plotId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{p.plotName}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">{p.areaAcres} Acres</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                        {p.totalCyclesCount} cycles ({p.activeCyclesCount} active)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      ₹{p.lifetimeExpenses.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                      ₹{p.lifetimeIncome.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${
                          p.lifetimeProfitLoss >= 0
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {p.lifetimeProfitLoss >= 0 ? "+" : ""}₹{p.lifetimeProfitLoss.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedPlotFilter(p.plotId)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                      >
                        Filter Cycles &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    No plot data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter & Crop Cycles Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Plot Filter */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Plot:</span>
              <select
                id="filter-plot-select"
                value={selectedPlotFilter}
                onChange={(e) => setSelectedPlotFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">All Plots ({cycles.length})</option>
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span>Status:</span>
              <select
                id="filter-status-select"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="SOWN">Sown</option>
                <option value="GROWING">Growing</option>
                <option value="HARVESTED">Harvested</option>
                <option value="SOLD">Sold</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredCycles.length} of {cycles.length} crop cycles
          </div>
        </div>

        {/* Cycles Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            Loading crop cycles ledger...
          </div>
        ) : filteredCycles.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
            <Sprout className="w-12 h-12 mx-auto text-emerald-600 mb-2 opacity-60" />
            <h3 className="text-sm font-bold text-slate-800">No Crop Cycles Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No cycles matching the current filter. Create a new crop cycle to begin financial tracking.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs"
            >
              + Create Crop Cycle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="crop-cycles-grid">
            {filteredCycles.map((c) => {
              const isProfit = c.netProfitLoss >= 0;
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                          {c.plotName}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {c.cropName}
                        </h3>
                        {c.cropType && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Variety/Type: {c.cropType}
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          c.status === "CLOSED" || c.status === "SOLD"
                            ? "bg-slate-100 text-slate-700"
                            : c.status === "HARVESTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "GROWING"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sown: {c.sowingDate}</span>
                      <span>&bull;</span>
                      <span>
                        {c.actualHarvestDate ? `Harvested: ${c.actualHarvestDate}` : `Target: ${c.expectedHarvestDate}`}
                      </span>
                    </div>
                  </div>

                  {/* Financial Mini Summary */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Expenses:</span>
                      <span className="text-slate-800">₹{c.totalExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Income:</span>
                      <span className="text-emerald-700">₹{c.totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200/60">
                      <span className="text-slate-700">Net Margin:</span>
                      <span className={isProfit ? "text-emerald-700 font-black" : "text-rose-700 font-black"}>
                        {isProfit ? "+" : ""}₹{c.netProfitLoss.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/crop-cycles/${c.id}`}
                    id={`view-ledger-btn-${c.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors"
                  >
                    <span>View Ledger & Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: New Crop Cycle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Start New Crop Cycle</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateCycle} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Target Plot *</label>
                <select
                  id="cycle-plot-select"
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Crop Name / Variety *</label>
                <input
                  id="cycle-crop-name-input"
                  type="text"
                  placeholder="e.g. Tomato (Shivam F1), Coconut (COD), Groundnut"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Crop Category / Type</label>
                <input
                  id="cycle-crop-type-input"
                  type="text"
                  placeholder="e.g. Vegetables, Cash Crop, Fruits & Orchards"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Sowing Date *</label>
                  <input
                    id="cycle-sowing-date-input"
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Expected Harvest *</label>
                  <input
                    id="cycle-expected-harvest-input"
                    type="date"
                    value={expectedHarvestDate}
                    onChange={(e) => setExpectedHarvestDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Initial Cycle Status</label>
                <select
                  id="cycle-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CropCycleStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="SOWN">Sown</option>
                  <option value="GROWING">Growing</option>
                  <option value="HARVESTED">Harvested</option>
                  <option value="SOLD">Sold</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes / Objectives</label>
                <textarea
                  id="cycle-notes-input"
                  rows={2}
                  placeholder="Target yield, irrigation method, seed batch number..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-crop-cycle-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Start Crop Cycle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CropCyclesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-sm font-bold">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
          Loading Crop Cycles & Financials...
        </div>
      }
    >
      <CropCyclesOverviewContent />
    </Suspense>
  );
}
