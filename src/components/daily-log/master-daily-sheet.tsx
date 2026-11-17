"use client";

import { ActivitySection } from "@/components/daily-log/master-sheet/activity-section";
import { DispatchResult } from "@/components/daily-log/master-sheet/dispatch-result";
import { FertilizerSection } from "@/components/daily-log/master-sheet/fertilizer-section";
import { LaborSection } from "@/components/daily-log/master-sheet/labor-section";
import { MachinerySection } from "@/components/daily-log/master-sheet/machinery-section";
import { PurchaseSection } from "@/components/daily-log/master-sheet/purchase-section";
import { SalesSection } from "@/components/daily-log/master-sheet/sales-section";
import { useMasterDailySheet, type MasterDailySheetProps } from "@/components/daily-log/master-sheet/use-master-daily-sheet";
import {
  AlertCircle,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  FileText,
  MapPin,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sprout,
  X
} from "lucide-react";

export function MasterDailySheet(props: MasterDailySheetProps) {
  const sheet = useMasterDailySheet(props);
  const {
    activeSectionsCount,
    handleResetForm,
    errorMessage,
    setErrorMessage,
    handleSaveMasterSheet,
    selectedDate,
    onDateChange,
    selectedPlotId,
    onPlotChange,
    plots,
    plotCrops,
    selectedPlotCropId,
    handlePlotCropChange,
    filteredPlotCrops,
    crops,
    hasActivity,
    activityType,
    customActivity,
    calculatedLaborCost,
    menCount,
    womenCount,
    fertilizerName,
    fertQuantityKg,
    dieselLiters,
    machineName,
    salesTotalValue,
    salesCropName,
    salesQtyKg,
    purchaseCost,
    purchaseDescription,
    notes,
    setNotes,
    loggedBy,
    setLoggedBy,
    submitting,
  } = sheet;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Banner Alert Explaining the All-in-One Concept */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-600/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950">
              Master Daily Operations Sheet (Day Book)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
            <Check className="w-3 h-3 text-emerald-600" />
            {activeSectionsCount} Active Section{activeSectionsCount === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={handleResetForm}
            className="p-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-md transition-colors"
            title="Clear and reset sheet fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="ml-auto text-rose-500 hover:text-rose-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUCCESS DISPATCH MODAL */}
      <DispatchResult {...sheet} />

      {/* THE MASTER FORM */}
      <form onSubmit={handleSaveMasterSheet} className="space-y-3.5">
        {/* Top Control Bar: Date, Plot & Logged By */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <CalendarIcon className="w-3 h-3 text-emerald-600" />
                Date of Operations
              </label>
              <input
                id="master-sheet-date"
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-emerald-600" />
                Target Plot / Zone
              </label>
              <select
                id="master-sheet-plot"
                value={selectedPlotId}
                onChange={(e) => onPlotChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {plots.map((p) => {
                  const plotCropNames = plotCrops
                    .filter((pc) => pc.plotId === p.id && pc.status === "ACTIVE")
                    .map((pc) => pc.cropActivityName);
                  const cropSuffix = plotCropNames.length > 0 ? ` (${plotCropNames.join(", ")})` : "";
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name}{cropSuffix}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Sprout className="w-3 h-3 text-emerald-600" />
                Crop(s)
              </label>
              <select
                id="master-sheet-crop"
                value={selectedPlotCropId}
                onChange={(e) => handlePlotCropChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {filteredPlotCrops.length > 0 ? (
                  filteredPlotCrops.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.cropActivityName} {pc.status === "ACTIVE" ? "" : `(${pc.status})`}
                    </option>
                  ))
                ) : crops.length > 0 ? (
                  <>
                    <option value="">No Active Crop Mapped to Plot</option>
                    {crops.map((c) => (
                      <option key={c.id} value={`crop_${c.id}`}>
                        {c.name} (General)
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">No Active Crop Mapped to Plot</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 1: FIELD WORK ACTIVITY */}
        <ActivitySection {...sheet} />

        {/* SECTION 2: LABOR & MANPOWER PAYOUT */}
        <LaborSection {...sheet} />

        {/* SECTION 3: FERTILIZER & CHEMICAL APPLICATION */}
        <FertilizerSection {...sheet} />

        {/* SECTION 4: MACHINERY RUN & DIESEL CONSUMPTION */}
        <MachinerySection {...sheet} />

        {/* SECTION 5: HARVEST & PRODUCE SALES YIELD */}
        <SalesSection {...sheet} />

        {/* SECTION 6: GENERAL PURCHASES & PETTY EXPENSES */}
        <PurchaseSection {...sheet} />

        {/* SECTION 7: GENERAL ESTATE REMARKS & WEATHER */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-slate-500" />
                General Estate Observations, Rainfall & Remarks
              </label>
              <textarea
                id="master-sheet-notes"
                rows={2}
                placeholder="Weather conditions, water pump run observations, insect scouting notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                Supervisor / Logged By
              </label>
              <input
                id="master-sheet-logged-by"
                type="text"
                placeholder="Field Supervisor"
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SUBMIT ACTION BAR */}
        <div className="sticky bottom-3 z-40 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-emerald-300 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-slate-800">Dispatching:</span>
            {hasActivity && (activityType || customActivity) && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                ✓ 1 Field Task
              </span>
            )}
            {(Number(menCount) > 0 || Number(womenCount) > 0) && (
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-semibold text-[10px]">
                ✓ Labor (₹{calculatedLaborCost})
              </span>
            )}
            {fertilizerName.trim() && Number(fertQuantityKg) > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold text-[10px]">
                ✓ {fertQuantityKg}kg Fertilizer
              </span>
            )}
            {(machineName.trim() || Number(dieselLiters) > 0) && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[10px]">
                ✓ Machinery & Fuel
              </span>
            )}
            {salesCropName.trim() && (Number(salesQtyKg) > 0 || Number(salesTotalValue) > 0) && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-[10px]">
                ✓ Harvest Sale
              </span>
            )}
            {(Number(purchaseCost) > 0 || purchaseDescription.trim()) && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[10px]">
                ✓ Purchase Expense
              </span>
            )}
            {activeSectionsCount === 0 && (
              <span className="text-slate-400 italic text-[11px]">No section data entered yet (empty sections will be skipped)</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Reset Sheet
            </button>
            <button
              id="save-master-sheet-btn"
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching to Menus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Save & Dispatch to All Menus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
