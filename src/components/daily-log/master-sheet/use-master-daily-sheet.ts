"use client";

import type { MasterSheetResult } from "@/app/api/daily-log/master-sheet/route";
import type { PlotCropAssociation } from "@/types/estate";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { MACHINE_RATES } from "@/types/estate";
import type { ActivityType, GodownItem } from "@/types/storage";
import React, { useEffect, useMemo, useState } from "react";

export interface MasterDailySheetProps {
  selectedDate: string;
  selectedPlotId: string;
  plots: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  onDateChange: (date: string) => void;
  onPlotChange: (plotId: string) => void;
  onSuccess: (result: MasterSheetResult) => void;
}

export function useMasterDailySheet({
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
  const [plotCrops, setPlotCrops] = useState<PlotCropAssociation[]>([]);
  const [machines, setMachines] = useState<{ id: string; name: string; type?: string }[]>([]);
  const [godownItems, setGodownItems] = useState<GodownItem[]>([]);

  // Form State
  const [selectedPlotCropId, setSelectedPlotCropId] = useState("");
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
  const [workingHours, setWorkingHours] = useState<number | "">(8);
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
  const [dispatchResult, setDispatchResult] = useState<MasterSheetResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load auxiliary master data
  useEffect(() => {
    async function loadAuxiliaryData() {
      try {
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
      }
    }
    loadAuxiliaryData();
  }, [salesCropName]);

  // Memoize filtered plot-crops for currently selected plot
  const filteredPlotCrops = useMemo(() => {
    return plotCrops.filter((pc) => pc.plotId === selectedPlotId);
  }, [plotCrops, selectedPlotId]);

  // Set default crop based on selected plot
  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        if (selectedPlotId && plotCrops.length > 0) {
          const matchingCrops = plotCrops.filter((pc) => pc.plotId === selectedPlotId);
          if (matchingCrops.length > 0) {
            const activeMatch = matchingCrops.find((pc) => pc.status === "ACTIVE") || matchingCrops[0];
            setSelectedPlotCropId(activeMatch.id);
            setSalesCropName(activeMatch.cropActivityName);
          } else {
            setSelectedPlotCropId("");
            if (crops.length > 0) {
              setSalesCropName(crops[0].name);
            }
          }
        }
      })();
    }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, [selectedPlotId, plotCrops, crops]);

  const handlePlotCropChange = (val: string) => {
    setSelectedPlotCropId(val);
    const match = plotCrops.find((pc) => pc.id === val);
    if (match) {
      setSalesCropName(match.cropActivityName);
    } else {
      const cropMatch = crops.find((c) => `crop_${c.id}` === val || c.id === val);
      if (cropMatch) {
        setSalesCropName(cropMatch.name);
      }
    }
  };

  // Auto calculate labor cost (based on working hours against standard 8-hour shift)
  const calculatedLaborCost = useMemo(() => {
    const men = Number(menCount) || 0;
    const women = Number(womenCount) || 0;
    const mRate = Number(menWageRate) || 0;
    const wRate = Number(womenWageRate) || 0;
    const hrs = workingHours !== "" && Number(workingHours) > 0 ? Number(workingHours) : 8;
    const hoursRatio = hrs / 8;
    return Math.round((men * mRate + women * wRate) * hoursRatio);
  }, [menCount, womenCount, menWageRate, womenWageRate, workingHours]);

  const updateFuelEstimate = (name: string, hours: number | "") => {
    const rate = MACHINE_RATES[name] || 3.0;
    const estimatedLiters = Math.round(Number(hours) * rate * 10) / 10;
    setDieselLiters(estimatedLiters);
    setDieselCost(Math.round(estimatedLiters * 95));
  };

  // Auto calculate fuel liters & cost when machine / hours change
  const handleHoursChange = (hrs: number | "") => {
    setRunningHours(hrs);
    if (hrs && Number(hrs) > 0 && machineName) {
      updateFuelEstimate(machineName, hrs);
    }
  };

  const handleMachineSelect = (mName: string) => {
    setMachineName(mName);
    if (runningHours && Number(runningHours) > 0) {
      updateFuelEstimate(mName, runningHours);
    }
  };

  // Auto calculate sales total value
  const handleSalesQtyOrRate = (qty: number | "", rate: number | "") => {
    if (qty && rate && Number(qty) > 0 && Number(rate) > 0) {
      setSalesTotalValue(Math.round(Number(qty) * Number(rate)));
    }
  };

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
        plotCropId: selectedPlotCropId && !selectedPlotCropId.startsWith("crop_") ? selectedPlotCropId : undefined,
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
              workingHours: workingHours === "" ? 8 : Number(workingHours),
              menWageRate: menWageRate === "" ? 600 : Number(menWageRate),
              womenWageRate: womenWageRate === "" ? 500 : Number(womenWageRate),
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
    } catch (err) {
      setErrorMessage(getErrorMessage(err) || "An error occurred while saving the sheet.");
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

  return {
    activeSectionsCount,
    handleResetForm,
    errorMessage,
    setErrorMessage,
    dispatchResult,
    setDispatchResult,
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
    setHasActivity,
    activityType,
    setActivityType,
    customActivity,
    setCustomActivity,
    setActivityCompleted,
    activityCompleted,
    activityDescription,
    setActivityDescription,
    employees,
    assignedWorkerIds,
    setAssignedWorkerIds,
    calculatedLaborCost,
    menCount,
    setMenCount,
    womenCount,
    setWomenCount,
    workingHours,
    setWorkingHours,
    menWageRate,
    setMenWageRate,
    womenWageRate,
    setWomenWageRate,
    laborCostManual,
    setLaborCostManual,
    laborNotes,
    setLaborNotes,
    fertilizerName,
    fertQuantityKg,
    setFertilizerName,
    godownItems,
    setFertQuantityKg,
    fertCost,
    setFertCost,
    fertNotes,
    setFertNotes,
    dieselLiters,
    machineName,
    handleMachineSelect,
    machines,
    runningHours,
    handleHoursChange,
    setDieselLiters,
    setDieselCost,
    dieselCost,
    machineNotes,
    setMachineNotes,
    salesTotalValue,
    salesCropName,
    setSalesCropName,
    salesQtyKg,
    setSalesQtyKg,
    handleSalesQtyOrRate,
    salesRatePerKg,
    setSalesRatePerKg,
    setSalesTotalValue,
    buyerName,
    setBuyerName,
    paymentMode,
    setPaymentMode,
    salesNotes,
    setSalesNotes,
    purchaseCost,
    purchaseCategory,
    setPurchaseCategory,
    purchaseDescription,
    setPurchaseDescription,
    setPurchaseCost,
    purchaseVendor,
    setPurchaseVendor,
    purchasePaymentMode,
    setPurchasePaymentMode,
    notes,
    setNotes,
    loggedBy,
    setLoggedBy,
    submitting,
  };
}

export type MasterDailySheetState = ReturnType<typeof useMasterDailySheet>;
