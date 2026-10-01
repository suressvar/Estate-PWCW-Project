"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Users,
  FlaskConical,
  Tractor,
  Sprout,
  ShoppingCart,
  FileText,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RotateCcw,
  DollarSign,
  AlertCircle,
  Calendar as CalendarIcon,
  MapPin,
  Fuel,
  RefreshCw,
  X,
  Layers,
  Check,
} from "lucide-react";
import { ActivityType } from "@/lib/db-storage";
import { MACHINE_RATES } from "@/types/estate";

const ACTIVITY_TYPES: { label: string; value: ActivityType }[] = [
  { label: "Irrigation & Water", value: "IRRIGATION" },
  { label: "Weeding & Cleaning", value: "WEEDING" },
  { label: "Fertilizer Application", value: "FERTILIZER_APPLICATION" },
  { label: "Spraying & Pest Control", value: "SPRAYING" },
  { label: "Harvesting & Picking", value: "HARVESTING" },
  { label: "Sowing & Planting", value: "SOWING" },
  { label: "Land Preparation", value: "LAND_PREPARATION" },
  { label: "Pruning & Tying", value: "PRUNING" },
  { label: "Machinery Maintenance", value: "MAINTENANCE" },
  { label: "Other / Custom Activity", value: "OTHER" },
];

const COMMON_FERTILIZERS = [
  "Urea (46% N)",
  "DAP (18-46-0)",
  "MOP (Muriate of Potash)",
  "NPK 19-19-19",
  "NPK 20-20-0",
  "Ammonium Sulphate",
  "Neem Cake / Organic Manure",
  "Zinc Sulphate Micronutrient",
  "Boron & Micronutrient Mix",
  "Cow Dung Compost",
];

const PURCHASE_CATEGORIES = [
  "General Estate Supplies",
  "Tools & Hardware",
  "Machinery Spares & Repairs",
  "Irrigation & Piping",
  "Pesticides & Bio",
  "Seeds & Saplings",
  "Fertilizer & Nutrition",
];

interface MasterDailySheetProps {
  selectedDate: string;
  selectedPlotId: string;
  plots: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  onDateChange: (date: string) => void;
  onPlotChange: (plotId: string) => void;
  onSuccess: (result: any) => void;
}

export function MasterDailySheet({
  selectedDate,
  selectedPlotId,
  plots,
  employees,
  onDateChange,
  onPlotChange,
  onSuccess,
}: MasterDailySheetProps) {
  // Master options fetched from APIs
  const [crops, setCrops] = useState<{ id: string; name: string }[]>([]);
  const [plotCrops, setPlotCrops] = useState<any[]>([]);
  const [machines, setMachines] = useState<{ id: string; name: string; type?: string }[]>([]);
  const [godownItems, setGodownItems] = useState<any[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // Form State
  const [loggedBy, setLoggedBy] = useState("Field Supervisor");
  const [notes, setNotes] = useState("");

  // Section 1: Field Activity
  const [hasActivity, setHasActivity] = useState(true);
  const [activityType, setActivityType] = useState<ActivityType>("IRRIGATION");
  const [customActivity, setCustomActivity] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityCompleted, setActivityCompleted] = useState(true);
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<string[]>([]);

  // Section 2: Labor & Manpower
  const [menCount, setMenCount] = useState<number | "">("");
  const [womenCount, setWomenCount] = useState<number | "">("");
  const [menWageRate, setMenWageRate] = useState<number | "">(600);
  const [womenWageRate, setWomenWageRate] = useState<number | "">(500);
  const [laborCostManual, setLaborCostManual] = useState<number | "">("");
  const [laborNotes, setLaborNotes] = useState("");

  // Section 3: Fertilizer Application
  const [fertilizerName, setFertilizerName] = useState("");
  const [fertQuantityKg, setFertQuantityKg] = useState<number | "">("");
  const [fertCost, setFertCost] = useState<number | "">("");
  const [fertNotes, setFertNotes] = useState("");

  // Section 4: Machinery & Diesel Run
  const [machineName, setMachineName] = useState("");
  const [runningHours, setRunningHours] = useState<number | "">("");
  const [dieselLiters, setDieselLiters] = useState<number | "">("");
  const [dieselCost, setDieselCost] = useState<number | "">("");
  const [machineNotes, setMachineNotes] = useState("");

  // Section 5: Harvest & Produce Sales
  const [salesCropName, setSalesCropName] = useState("");
  const [salesQtyKg, setSalesQtyKg] = useState<number | "">("");
  const [salesRatePerKg, setSalesRatePerKg] = useState<number | "">("");
  const [salesTotalValue, setSalesTotalValue] = useState<number | "">("");
  const [buyerName, setBuyerName] = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [salesNotes, setSalesNotes] = useState("");

  // Section 6: Purchases & Expenses
  const [purchaseCategory, setPurchaseCategory] = useState("General Estate Supplies");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [purchaseCost, setPurchaseCost] = useState<number | "">("");
  const [purchaseVendor, setPurchaseVendor] = useState("");
  const [purchasePaymentMode, setPurchasePaymentMode] = useState("Cash");
  const [purchaseNotes, setPurchaseNotes] = useState("");

  // Submission & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load auxiliary master data
  useEffect(() => {
    async function loadAuxiliaryData() {
      try {
        setLoadingMaster(true);
        const [cropsRes, pcRes, machRes, gdnRes] = await Promise.all([
          fetch("/api/crops"),
          fetch("/api/plot-crops"),
          fetch("/api/machines?activeOnly=true"),
          fetch("/api/godown/items"),
        ]);

        if (cropsRes.ok) {
          const cropsData = await cropsRes.json();
          setCrops(cropsData);
          if (cropsData.length > 0 && !salesCropName) {
            setSalesCropName(cropsData[0].name);
          }
        }
        if (pcRes.ok) {
          const pcData = await pcRes.json();
          setPlotCrops(Array.isArray(pcData) ? pcData : []);
        }
        if (machRes.ok) {
          const mData = await machRes.json();
          if (mData.data && Array.isArray(mData.data)) {
            setMachines(mData.data);
          }
        }
        if (gdnRes.ok) {
          const gData = await gdnRes.json();
          if (gData.items && Array.isArray(gData.items)) {
            setGodownItems(gData.items);
          }
        }
      } catch (err) {
        console.error("Error loading master data for daily sheet:", err);
      } finally {
        setLoadingMaster(false);
      }
    }
    loadAuxiliaryData();
  }, []);

  // Set default crop based on selected plot
  useEffect(() => {
    if (selectedPlotId && plotCrops.length > 0) {
      const match = plotCrops.find((pc) => pc.plotId === selectedPlotId);
      if (match) {
        setSalesCropName(match.cropActivityName);
      }
    }
  }, [selectedPlotId, plotCrops]);

  // Auto calculate labor cost
  const calculatedLaborCost = useMemo(() => {
    const men = Number(menCount) || 0;
    const women = Number(womenCount) || 0;
    const mRate = Number(menWageRate) || 0;
    const wRate = Number(womenWageRate) || 0;
    return men * mRate + women * wRate;
  }, [menCount, womenCount, menWageRate, womenWageRate]);

  // Auto calculate fuel liters & cost when machine / hours change
  const handleHoursChange = (hrs: number | "") => {
    setRunningHours(hrs);
    if (hrs && Number(hrs) > 0 && machineName) {
      const rate = MACHINE_RATES[machineName] || 3.0;
      const estimatedLiters = Math.round(Number(hrs) * rate * 10) / 10;
      setDieselLiters(estimatedLiters);
      setDieselCost(Math.round(estimatedLiters * 95));
    }
  };

  const handleMachineSelect = (mName: string) => {
    setMachineName(mName);
    if (runningHours && Number(runningHours) > 0) {
      const rate = MACHINE_RATES[mName] || 3.0;
      const estimatedLiters = Math.round(Number(runningHours) * rate * 10) / 10;
      setDieselLiters(estimatedLiters);
      setDieselCost(Math.round(estimatedLiters * 95));
    }
  };

  // Auto calculate sales total value
  const handleSalesQtyOrRate = (qty: number | "", rate: number | "") => {
    if (qty && rate && Number(qty) > 0 && Number(rate) > 0) {
      setSalesTotalValue(Math.round(Number(qty) * Number(rate)));
    }
  };

  // Selected plot details
  const currentPlot = plots.find((p) => p.id === selectedPlotId);

  // Active section counters
  const activeSectionsCount = useMemo(() => {
    let count = 0;
    if (hasActivity && (activityType || customActivity)) count++;
    if (Number(menCount) > 0 || Number(womenCount) > 0) count++;
    if (fertilizerName.trim() && Number(fertQuantityKg) > 0) count++;
    if (machineName.trim() || Number(dieselLiters) > 0) count++;
    if (salesCropName.trim() && (Number(salesQtyKg) > 0 || Number(salesTotalValue) > 0)) count++;
    if (Number(purchaseCost) > 0 || purchaseDescription.trim()) count++;
    return count;
  }, [
    hasActivity,
    activityType,
    customActivity,
    menCount,
    womenCount,
    fertilizerName,
    fertQuantityKg,
    machineName,
    dieselLiters,
    salesCropName,
    salesQtyKg,
    salesTotalValue,
    purchaseCost,
    purchaseDescription,
  ]);

  // Handle Submit
  const handleSaveMasterSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (activeSectionsCount === 0 && !notes.trim()) {
      setErrorMessage("Please fill at least one operation section or add daily estate remarks before saving.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        date: selectedDate,
        plotId: selectedPlotId,
        loggedBy,
        notes: notes.trim() || undefined,
        activity: hasActivity
          ? {
              activityType,
              customActivity: activityType === "OTHER" ? customActivity.trim() : undefined,
              description: activityDescription.trim() || undefined,
              assignedWorkerIds,
              completedFlag: activityCompleted,
            }
          : undefined,
        labor:
          Number(menCount) > 0 || Number(womenCount) > 0 || (laborCostManual && Number(laborCostManual) > 0)
            ? {
                menCount: Number(menCount) || 0,
                womenCount: Number(womenCount) || 0,
                menWageRate: Number(menWageRate) || 600,
                womenWageRate: Number(womenWageRate) || 500,
                totalCost: laborCostManual ? Number(laborCostManual) : calculatedLaborCost,
                notes: laborNotes.trim() || undefined,
              }
            : undefined,
        fertilizer:
          fertilizerName.trim() && Number(fertQuantityKg) > 0
            ? {
                fertilizerName: fertilizerName.trim(),
                quantityKg: Number(fertQuantityKg),
                cost: fertCost ? Number(fertCost) : 0,
                notes: fertNotes.trim() || undefined,
              }
            : undefined,
        machinery:
          machineName.trim() || Number(dieselLiters) > 0
            ? {
                machineName: machineName.trim() || undefined,
                runningHours: Number(runningHours) || 0,
                dieselConsumedLiters: Number(dieselLiters) || 0,
                dieselCost: Number(dieselCost) || 0,
                notes: machineNotes.trim() || undefined,
              }
            : undefined,
        sales:
          salesCropName.trim() && (Number(salesQtyKg) > 0 || Number(salesTotalValue) > 0)
            ? {
                cropName: salesCropName.trim(),
                quantityKg: Number(salesQtyKg) || 0,
                value: Number(salesTotalValue) || 0,
                buyerName: buyerName.trim() || "Market Harvest Dispatch",
                paymentMode,
                paymentStatus: "PAID" as const,
                notes: salesNotes.trim() || undefined,
              }
            : undefined,
        purchase:
          Number(purchaseCost) > 0 || purchaseDescription.trim()
            ? {
                category: purchaseCategory,
                description: purchaseDescription.trim() || `${purchaseCategory} Purchase`,
                cost: Number(purchaseCost) || 0,
                vendorName: purchaseVendor.trim() || undefined,
                paymentMode: purchasePaymentMode,
                notes: purchaseNotes.trim() || undefined,
              }
            : undefined,
      };

      const res = await fetch("/api/daily-log/master-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch daily sheet");
      }

      setDispatchResult(data);
      onSuccess(data);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while saving the sheet.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset Form
  const handleResetForm = () => {
    setNotes("");
    setCustomActivity("");
    setActivityDescription("");
    setAssignedWorkerIds([]);
    setMenCount("");
    setWomenCount("");
    setLaborCostManual("");
    setLaborNotes("");
    setFertilizerName("");
    setFertQuantityKg("");
    setFertCost("");
    setFertNotes("");
    setMachineName("");
    setRunningHours("");
    setDieselLiters("");
    setDieselCost("");
    setMachineNotes("");
    setSalesQtyKg("");
    setSalesRatePerKg("");
    setSalesTotalValue("");
    setBuyerName("");
    setSalesNotes("");
    setPurchaseDescription("");
    setPurchaseCost("");
    setPurchaseVendor("");
    setPurchaseNotes("");
    setDispatchResult(null);
    setErrorMessage("");
  };

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
            <p className="text-[11px] text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
              Record everything that happened on <strong>{selectedDate}</strong> for{" "}
              <strong>{currentPlot?.name || "Selected Plot"}</strong> in one place. Only fill the sections that occurred today; leave anything that did not happen empty. Upon saving, all data is automatically routed into its respective menu.
            </p>
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
      {dispatchResult && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-900 text-white shadow-xl border border-emerald-700/60 space-y-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-emerald-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">Daily Sheet Successfully Dispatched!</h4>
                <p className="text-[11px] text-emerald-200">{dispatchResult.message}</p>
              </div>
            </div>
            <button
              onClick={() => setDispatchResult(null)}
              className="p-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-xs">
            {dispatchResult.dispatched?.activity && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
                <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                  <span>Work Activity</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200">
                    {dispatchResult.dispatched.activity.status}
                  </span>
                </div>
                <div className="text-white mt-0.5 font-semibold text-xs">{dispatchResult.dispatched.activity.activityType}</div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">Routed to Daily Work Log</div>
              </div>
            )}

            {dispatchResult.dispatched?.labor && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
                <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                  <span>Labor & Wages</span>
                  <Link href="/workers" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                    View in HR <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="text-white mt-0.5 font-semibold text-xs">
                  {dispatchResult.dispatched.labor.menCount} Men + {dispatchResult.dispatched.labor.womenCount} Women
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  Payout: ₹{dispatchResult.dispatched.labor.totalCost?.toLocaleString()}
                </div>
              </div>
            )}

            {dispatchResult.dispatched?.fertilizer && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
                <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                  <span>Fertilizer Applied</span>
                  <Link href="/fertilizer" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                    View in Fertilizer <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="text-white mt-0.5 font-semibold text-xs">{dispatchResult.dispatched.fertilizer.fertilizerName}</div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  {dispatchResult.dispatched.fertilizer.quantityKg} kg • ₹{dispatchResult.dispatched.fertilizer.cost}
                </div>
              </div>
            )}

            {dispatchResult.dispatched?.diesel && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
                <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                  <span>Fuel Dispense</span>
                  <Link href="/diesel" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                    View in Diesel <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="text-white mt-0.5 font-semibold text-xs">
                  {dispatchResult.dispatched.diesel.quantityLiters} Liters
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">Cost: ₹{dispatchResult.dispatched.diesel.cost}</div>
              </div>
            )}

            {dispatchResult.dispatched?.machinery && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
                <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                  <span>Machinery Operating</span>
                  <Link href="/machinery" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                    View in Fleet <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="text-white mt-0.5 font-semibold text-xs">{dispatchResult.dispatched.machinery.machineName}</div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  {dispatchResult.dispatched.machinery.runningHours} running hours
                </div>
              </div>
            )}

            {dispatchResult.dispatched?.sales && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
                <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                  <span>Crop Harvest Sale</span>
                  <Link href="/sales" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                    View in Sales <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="text-white mt-0.5 font-semibold text-xs">
                  {dispatchResult.dispatched.sales.cropName} ({dispatchResult.dispatched.sales.quantityKg} kg)
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  Revenue: ₹{dispatchResult.dispatched.sales.value?.toLocaleString()}
                </div>
              </div>
            )}

            {dispatchResult.dispatched?.purchase && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
                <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                  <span>Purchase Voucher</span>
                  <Link href="/purchases" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                    View in Purchases <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="text-white mt-0.5 font-semibold text-xs">{dispatchResult.dispatched.purchase.description}</div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  Amount: ₹{dispatchResult.dispatched.purchase.cost?.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Supervisor / Logged By</label>
              <input
                id="master-sheet-logged-by"
                type="text"
                placeholder="Supervisor Name"
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 1: FIELD WORK ACTIVITY */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ClipboardList className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">1. Planned or Completed Field Work</h4>
                <p className="text-[10px] text-slate-500">Scheduled agricultural operation for this plot</p>
              </div>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={hasActivity}
                onChange={(e) => setHasActivity(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>Include Activity</span>
            </label>
          </div>

          {hasActivity && (
            <div className="p-3.5 sm:p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Activity Type</label>
                  <select
                    id="master-activity-type"
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as ActivityType)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {activityType === "OTHER" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Custom Activity Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Trellising, Honey extraction"
                      value={customActivity}
                      onChange={(e) => setCustomActivity(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Execution Status Today</label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setActivityCompleted(true)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                        activityCompleted
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityCompleted(false)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                        !activityCompleted
                          ? "bg-amber-500 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>Keep as Planned</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2 md:col-span-3">
                  <label className="text-[11px] font-bold text-slate-600">Instructions / Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Specific zone, rows, block dosage, or field notes..."
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Workers Assignment */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-500" />
                  Assign Estate Staff to this Activity:
                </label>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {employees.map((emp) => {
                    const isSelected = assignedWorkerIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setAssignedWorkerIds(assignedWorkerIds.filter((id) => id !== emp.id));
                          } else {
                            setAssignedWorkerIds([...assignedWorkerIds, emp.id]);
                          }
                        }}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border transition-all ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {emp.name}
                      </button>
                    );
                  })}
                  {employees.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">No employees loaded in roster.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: LABOR & MANPOWER PAYOUT */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-800 flex items-center justify-center font-bold">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">2. Labor & Manpower Payout</h4>
                <p className="text-[10px] text-slate-500">Casual daily labor headcount and wages (Pushes to Labor Logs & HR)</p>
              </div>
            </div>
            {calculatedLaborCost > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-100 text-violet-800">
                ₹{calculatedLaborCost.toLocaleString()}
              </span>
            )}
          </div>

          <div className="p-3.5 sm:p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Men Count</label>
                <input
                  id="master-men-count"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={menCount}
                  onChange={(e) => setMenCount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Women Count</label>
                <input
                  id="master-women-count"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={womenCount}
                  onChange={(e) => setWomenCount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Men Rate (₹/day)</label>
                <input
                  type="number"
                  min="0"
                  value={menWageRate}
                  onChange={(e) => setMenWageRate(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Women Rate (₹/day)</label>
                <input
                  type="number"
                  min="0"
                  value={womenWageRate}
                  onChange={(e) => setWomenWageRate(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Total Labor Cost (₹) <span className="text-[10px] text-slate-400 font-normal">(Auto-calculated)</span>
                </label>
                <input
                  type="number"
                  placeholder={calculatedLaborCost ? String(calculatedLaborCost) : "Auto-computed"}
                  value={laborCostManual}
                  onChange={(e) => setLaborCostManual(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-black text-violet-900 bg-violet-50/40 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Labor Remarks / Task (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Coffee weeding, Coconut plucking, Basin cleaning"
                  value={laborNotes}
                  onChange={(e) => setLaborNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: FERTILIZER & CHEMICAL APPLICATION */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <FlaskConical className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">3. Fertilizer & Nutrition Application</h4>
                <p className="text-[10px] text-slate-500">Applied inputs (Pushes directly to Fertilizer Menu at /fertilizer)</p>
              </div>
            </div>
            {fertilizerName && Number(fertQuantityKg) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                {fertQuantityKg} kg
              </span>
            )}
          </div>

          <div className="p-3.5 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Fertilizer Name</label>
                <input
                  id="master-fertilizer-name"
                  type="text"
                  list="fertilizer-suggestions"
                  placeholder="e.g. Urea, DAP, NPK 19-19-19"
                  value={fertilizerName}
                  onChange={(e) => setFertilizerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                <datalist id="fertilizer-suggestions">
                  {COMMON_FERTILIZERS.map((f, i) => (
                    <option key={i} value={f} />
                  ))}
                  {godownItems
                    .filter((g) => g.category?.toLowerCase().includes("fertilizer") || g.category?.toLowerCase().includes("nutrition"))
                    .map((g) => (
                      <option key={g.id} value={g.name}>
                        Stock: {g.availableQuantity} {g.unit}
                      </option>
                    ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Quantity Applied (kg)</label>
                <input
                  id="master-fertilizer-qty"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={fertQuantityKg}
                  onChange={(e) => {
                    const q = e.target.value === "" ? "" : Number(e.target.value);
                    setFertQuantityKg(q);
                    // Approximate cost if not set
                    if (q && !fertCost) {
                      setFertCost(Math.round(Number(q) * 35));
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Cost / Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="₹ 0"
                  value={fertCost}
                  onChange={(e) => setFertCost(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Application Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Basal dose around root zone, Folier spray 200L tank"
                value={fertNotes}
                onChange={(e) => setFertNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: MACHINERY RUN & DIESEL CONSUMPTION */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Tractor className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">4. Machinery Fleet & Diesel Dispense</h4>
                <p className="text-[10px] text-slate-500">Operating run & fuel consumption (Pushes to /diesel & /machinery)</p>
              </div>
            </div>
            {Number(dieselLiters) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 flex items-center gap-1">
                <Fuel className="w-2.5 h-2.5 text-cyan-600" />
                {dieselLiters} L
              </span>
            )}
          </div>

          <div className="p-3.5 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600">Select Machine</label>
                <select
                  id="master-machine-select"
                  value={machineName}
                  onChange={(e) => handleMachineSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="">-- Choose Machine (Leave empty if none) --</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} {m.type ? `(${m.type})` : ""}
                    </option>
                  ))}
                  {Object.keys(MACHINE_RATES).map((name) => (
                    <option key={name} value={name}>
                      {name} (Standard Rate)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Hours Run (hrs)</label>
                <input
                  id="master-machine-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0.0"
                  value={runningHours}
                  onChange={(e) => handleHoursChange(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Diesel Used (Liters)</label>
                <input
                  id="master-diesel-liters"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0.0"
                  value={dieselLiters}
                  onChange={(e) => {
                    const l = e.target.value === "" ? "" : Number(e.target.value);
                    setDieselLiters(l);
                    if (l) setDieselCost(Math.round(Number(l) * 95));
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-cyan-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Estimated Fuel Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="₹ 0"
                  value={dieselCost}
                  onChange={(e) => setDieselCost(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Work Details (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Deep tilling, Sprayer operating on inter-crop"
                  value={machineNotes}
                  onChange={(e) => setMachineNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: HARVEST & PRODUCE SALES YIELD */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Sprout className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">5. Harvest & Produce Sales Yield</h4>
                <p className="text-[10px] text-slate-500">Harvest output or market sales (Pushes to Sales Register at /sales)</p>
              </div>
            </div>
            {Number(salesTotalValue) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
                + ₹{Number(salesTotalValue).toLocaleString()}
              </span>
            )}
          </div>

          <div className="p-3.5 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Harvested Crop</label>
                <input
                  id="master-sales-crop"
                  type="text"
                  list="crops-suggestions"
                  placeholder="e.g. Coffee Arabica, Coconut"
                  value={salesCropName}
                  onChange={(e) => setSalesCropName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <datalist id="crops-suggestions">
                  {crops.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Quantity (kg / units)</label>
                <input
                  id="master-sales-qty"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={salesQtyKg}
                  onChange={(e) => {
                    const q = e.target.value === "" ? "" : Number(e.target.value);
                    setSalesQtyKg(q);
                    handleSalesQtyOrRate(q, salesRatePerKg);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Rate (₹/kg)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={salesRatePerKg}
                  onChange={(e) => {
                    const r = e.target.value === "" ? "" : Number(e.target.value);
                    setSalesRatePerKg(r);
                    handleSalesQtyOrRate(salesQtyKg, r);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Total Inflow Value (₹)</label>
                <input
                  id="master-sales-value"
                  type="number"
                  min="0"
                  placeholder="₹ 0"
                  value={salesTotalValue}
                  onChange={(e) => setSalesTotalValue(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-black text-amber-900 bg-amber-50/50 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Buyer / Mandi Trader</label>
                <input
                  type="text"
                  placeholder="Buyer Name or Local Mandi"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit / On Account">Credit / On Account</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Harvest Batch / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Grade A cherry picking, Bag batch #4"
                  value={salesNotes}
                  onChange={(e) => setSalesNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: GENERAL PURCHASES & PETTY EXPENSES */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">6. Daily Field Purchases & Petty Expenses</h4>
                <p className="text-[10px] text-slate-500">Consumables, repairs, hardware (Pushes to Purchases at /purchases)</p>
              </div>
            </div>
            {Number(purchaseCost) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900">
                - ₹{Number(purchaseCost).toLocaleString()}
              </span>
            )}
          </div>

          <div className="p-3.5 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Expense Category</label>
                <select
                  value={purchaseCategory}
                  onChange={(e) => setPurchaseCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  {PURCHASE_CATEGORIES.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Item Description / Particulars</label>
                <input
                  id="master-purchase-desc"
                  type="text"
                  placeholder="e.g. PVC Joiners, Pruning shears, Hose clip"
                  value={purchaseDescription}
                  onChange={(e) => setPurchaseDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Cost (₹)</label>
                <input
                  id="master-purchase-cost"
                  type="number"
                  min="0"
                  placeholder="₹ 0"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-rose-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Vendor / Shop Name</label>
                <input
                  type="text"
                  placeholder="Local Hardware / Dealer"
                  value={purchaseVendor}
                  onChange={(e) => setPurchaseVendor(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Payment Mode</label>
                <select
                  value={purchasePaymentMode}
                  onChange={(e) => setPurchasePaymentMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="Cash">Cash (Petty Cash)</option>
                  <option value="UPI / QR">UPI / QR</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Credit / Due</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 7: GENERAL ESTATE REMARKS & WEATHER */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-slate-500" />
            General Estate Observations, Rainfall & Supervisor Notes
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
