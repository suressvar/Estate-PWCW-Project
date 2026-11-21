import { getDatabase, withTransaction } from "@/lib/db-storage";
import { dateKey, finiteNumber, oneOf, referenceExists, ValidationError } from "@/lib/validation";
import { ActivityType,addWorkActivity,upsertDailyLog } from "@/lib/daily-log-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { inwardPurchasedItems } from "@/lib/godown-data";
import { getPlotCrops,getPlots } from "@/lib/master-data";
import {
addDieselLog,
addFertilizerLog,
addGeneralPurchaseLog,
addLaborLog,
addMachineryLog,
addSalesLog,
} from "@/lib/transaction-logs";
import { NextResponse } from "next/server";

export interface MasterSheetDispatch {
  dailyLog?: { id: string; plotName: string; date: string };
  activity?: { id: string; activityType: string; customActivity?: string; status: string };
  labor?: { id: string; menCount: number; womenCount: number; workingHours: number; totalCost: number };
  fertilizer?: { id: string; fertilizerName: string; quantityKg: number; cost: number };
  diesel?: { id: string; quantityLiters: number; cost: number };
  machinery?: { id: string; machineName: string; runningHours: number; dieselConsumedLiters: number };
  sales?: { id: string; cropName: string; quantityKg: number; value: number };
  purchase?: { id: string; description: string; cost: number };
}
export interface MasterSheetResult { success: boolean; message: string; dispatchedCount: number; dispatched: MasterSheetDispatch }

export interface MasterDailySheetPayload {
  date: string; // YYYY-MM-DD
  plotId: string;
  plotCropId?: string;
  loggedBy?: string;
  notes?: string;

  // 1. Work Activity
  activity?: {
    activityType?: ActivityType;
    customActivity?: string;
    description?: string;
    assignedWorkerIds?: string[];
    completedFlag?: boolean;
  };

  // 2. Labor & Manpower
  labor?: {
    menCount?: number | string;
    womenCount?: number | string;
    workingHours?: number | string;
    menWageRate?: number | string;
    womenWageRate?: number | string;
    totalCost?: number | string;
    notes?: string;
  };

  // 3. Fertilizer Application
  fertilizer?: {
    fertilizerName?: string;
    quantityKg?: number | string;
    cost?: number | string;
    notes?: string;
  };

  // 4. Diesel & Fleet Machinery
  machinery?: {
    machineName?: string;
    runningHours?: number | string;
    dieselConsumedLiters?: number | string;
    dieselCost?: number | string;
    startTime?: string;
    endTime?: string;
    notes?: string;
  };

  // 5. Harvest & Produce Sales
  sales?: {
    cropName?: string;
    quantityKg?: number | string;
    value?: number | string;
    buyerName?: string;
    paymentMode?: string;
    paymentStatus?: "PAID" | "PENDING";
    notes?: string;
  };

  // 6. Purchases & Expenses
  purchase?: {
    category?: string;
    description?: string;
    cost?: number | string;
    vendorName?: string;
    paymentMode?: string;
    notes?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: MasterDailySheetPayload = await request.json();
    return withTransaction(() => {
    dateKey(body.date); referenceExists(body.plotId, getDatabase().plots, "Plot");
    const numeric = { labor: ["menCount", "womenCount", "workingHours", "menWageRate", "womenWageRate", "totalCost"], fertilizer: ["quantityKg", "cost"], machinery: ["runningHours", "dieselConsumedLiters", "dieselCost"], sales: ["quantityKg", "value"], purchase: ["cost"] } as const;
    for (const [section, keys] of Object.entries(numeric)) {
      const value = body[section as keyof typeof numeric]; if (value === undefined) continue;
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError(`${section} must be an object.`);
      const record = value as Record<string, unknown>;
      for (const key of keys) if (record[key] !== undefined) finiteNumber(record[key], `${section} ${key}`);
    }
    if (body.labor) {
      for (const count of [body.labor.menCount, body.labor.womenCount]) if (count !== undefined && !Number.isInteger(Number(count))) throw new ValidationError("Worker counts must be whole numbers.");
      if (body.labor.workingHours !== undefined && Number(body.labor.workingHours) > 24) throw new ValidationError("Working hours cannot exceed 24 in a daily sheet.");
    }
    if (body.activity?.completedFlag !== undefined && typeof body.activity.completedFlag !== "boolean") throw new ValidationError("Activity completion must be a boolean.");
    if (body.sales?.paymentStatus !== undefined) oneOf(body.sales.paymentStatus, ["PAID", "PENDING"], "Payment status");
    if (body.plotCropId) {
      const association = getPlotCrops().find(item => item.id === body.plotCropId);
      if (!association || association.plotId !== body.plotId) throw new ValidationError("Crop assignment does not belong to this plot.");
    }


    if (!body.date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (!body.plotId) {
      return NextResponse.json({ error: "Plot ID is required" }, { status: 400 });
    }

    const plots = getPlots();
    const plot = plots.find((p) => p.id === body.plotId);
    const plotName = plot?.name || "General Estate";

    const plotCrops = getPlotCrops();
    const plotCrop = body.plotCropId ? plotCrops.find(pc => pc.id === body.plotCropId) : plotCrops.find(pc => pc.plotId === body.plotId);
    const cropActivityName = plotCrop?.cropActivityName || "General Crop";

    const loggedBy = body.loggedBy?.trim() || "Field Supervisor";
    const date = body.date;

    const dispatched: MasterSheetDispatch = {};

    let dispatchedCount = 0;

    // 1. Daily Log Base Record
    const dailyLog = upsertDailyLog({
      plotId: body.plotId,
      date,
      createdBy: loggedBy,
      notes: body.notes?.trim() || undefined,
    });
    dispatched.dailyLog = { id: dailyLog.id, plotName, date };

    // 2. Work Activity (Field Operations)
    if (body.activity && (body.activity.activityType || body.activity.customActivity)) {
      const actType = (body.activity.activityType as ActivityType) || "OTHER";
      const isCompleted = Boolean(body.activity.completedFlag);

      const { activity } = addWorkActivity(dailyLog.id, {
        activityType: actType,
        customActivity: body.activity.customActivity?.trim() || undefined,
        description: body.activity.description?.trim() || "",
        assignedWorkerIds: Array.isArray(body.activity.assignedWorkerIds) ? body.activity.assignedWorkerIds : [],
        plannedFlag: !isCompleted,
        completedFlag: isCompleted,
      });

      dispatched.activity = {
        id: activity.id,
        activityType: activity.activityType,
        customActivity: activity.customActivity,
        status: isCompleted ? "COMPLETED" : "PLANNED",
      };
      dispatchedCount++;
    }

    // 3. Labor & Manpower Payout
    if (body.labor) {
      const men = finiteNumber(body.labor.menCount, "Men count", 0, 0);
      const women = finiteNumber(body.labor.womenCount, "Women count", 0, 0);
      const workingHours = finiteNumber(body.labor.workingHours, "Working hours", 0, 8);
      const menRate = finiteNumber(body.labor.menWageRate, "Men wage rate", 0, 600);
      const womenRate = finiteNumber(body.labor.womenWageRate, "Women wage rate", 0, 500);
      const calculatedCost = Math.round((men * menRate + women * womenRate) * (workingHours / 8));
      const totalCost = finiteNumber(body.labor.totalCost, "Labor cost", 0, calculatedCost);

      if (men > 0 || women > 0 || totalCost > 0) {
        const laborLog = addLaborLog({
          plotCropId: body.plotCropId,
          plotName,
          cropActivityName,
          menCount: men,
          womenCount: women,
          workingHours,
          menWageRate: menRate,
          womenWageRate: womenRate,
          totalCost,
          date,
          loggedBy,
          notes: body.labor.notes?.trim() || `Daily master sheet labor record for ${plotName} (${workingHours} hrs)`,
        });

        dispatched.labor = {
          id: laborLog.id,
          menCount: men,
          womenCount: women,
          workingHours,
          totalCost,
        };
        dispatchedCount++;
      }
    }

    // 4. Fertilizer & Nutrition Application
    if (body.fertilizer && body.fertilizer.fertilizerName?.trim()) {
      const qtyKg = Number(body.fertilizer.quantityKg) || 0;
      const cost = Number(body.fertilizer.cost) || 0;

      if (qtyKg > 0 || cost > 0) {
        const fertLog = addFertilizerLog({
          plotCropId: body.plotCropId,
          plotName,
          cropActivityName,
          transactionType: "CONSUMPTION",
          fertilizerName: body.fertilizer.fertilizerName.trim(),
          quantityKg: qtyKg,
          cost,
          date,
          loggedBy,
          notes: body.fertilizer.notes?.trim() || `Applied via Daily Master Sheet on ${plotName}`,
        });

        dispatched.fertilizer = {
          id: fertLog.id,
          fertilizerName: fertLog.fertilizerName,
          quantityKg: qtyKg,
          cost,
        };
        dispatchedCount++;
      }
    }

    // 5. Machinery & Diesel Run
    if (body.machinery) {
      const machineName = body.machinery.machineName?.trim() || "";
      const runningHours = Number(body.machinery.runningHours) || 0;
      const dieselLiters = Number(body.machinery.dieselConsumedLiters) || 0;
      const dieselCost = finiteNumber(body.machinery.dieselCost, "Fuel cost", 0, dieselLiters * 95);

      if (dieselLiters > 0) {
        const dLog = addDieselLog({
          transactionType: "CONSUMPTION",
          quantityLiters: dieselLiters,
          cost: dieselCost,
          date,
          loggedBy,
          notes: body.machinery.notes?.trim() || `Fuel used for ${machineName || "Machinery"} on ${plotName}`,
        });
        dispatched.diesel = {
          id: dLog.id,
          quantityLiters: dieselLiters,
          cost: dieselCost,
        };
        dispatchedCount++;
      }

      if (machineName && (runningHours > 0 || dieselLiters > 0)) {
        const mLog = addMachineryLog({
          plotCropId: body.plotCropId,
          plotName,
          cropActivityName,
          machineName,
          startTime: body.machinery.startTime || "08:00",
          endTime: body.machinery.endTime || "12:00",
          runningHours,
          dieselConsumedLiters: dieselLiters,
          date,
          loggedBy,
          notes: body.machinery.notes?.trim() || `Daily master sheet operating run on ${plotName}`,
        });
        dispatched.machinery = {
          id: mLog.id,
          machineName,
          runningHours,
          dieselConsumedLiters: dieselLiters,
        };
        dispatchedCount++;
      }
    }

    // 6. Harvest & Produce Sales Yield
    if (body.sales) {
      const cropName = body.sales.cropName?.trim() || cropActivityName;
      const qtyKg = Number(body.sales.quantityKg) || 0;
      const val = Number(body.sales.value) || 0;

      if (qtyKg > 0 || val > 0) {
        const sLog = addSalesLog({
          voucherType: "Harvest Crop Sale",
          plotCropId: body.plotCropId,
          plotName,
          cropActivityName: cropName,
          quantityKg: qtyKg,
          value: val,
          buyerName: body.sales.buyerName?.trim() || "Local Mandi / Market",
          paymentMode: (body.sales.paymentMode as "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit / On Account") || "Bank Transfer",
          paymentStatus: body.sales.paymentStatus || "PAID",
          date,
          loggedBy,
          notes: body.sales.notes?.trim() || `Daily master sheet harvest sales from ${plotName}`,
          subtotal: val,
        });

        dispatched.sales = {
          id: sLog.id,
          cropName,
          quantityKg: qtyKg,
          value: val,
        };
        dispatchedCount++;
      }
    }

    // 7. General Purchases / Petty Expenses
    if (body.purchase) {
      const cost = Number(body.purchase.cost) || 0;
      const desc = body.purchase.description?.trim() || "";

      if (cost > 0 || desc) {
        const pLog = addGeneralPurchaseLog({
          category: body.purchase.category?.trim() || "General Estate Supplies",
          plotCropId: body.plotCropId,
          plotName,
          cropActivityName,
          vendorName: body.purchase.vendorName?.trim() || "Local Supplier",
          description: desc || "Daily Field Purchase / Procurement",
          subtotal: cost,
          cost,
          paymentMode: (body.purchase.paymentMode as "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit") || "Cash",
          paymentStatus: "PAID",
          date,
          loggedBy,
          notes: body.purchase.notes?.trim() || `Daily master sheet purchase for ${plotName}`,
        });

        if (pLog.items && pLog.items.length > 0) inwardPurchasedItems(pLog.items, { voucherId: pLog.id, voucherNo: pLog.voucherNo, category: pLog.category, vendorName: pLog.vendorName, date: pLog.date });

        dispatched.purchase = {
          id: pLog.id,
          description: pLog.description,
          cost,
        };
        dispatchedCount++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Daily Sheet processed successfully! Dispatched ${dispatchedCount} operation${
          dispatchedCount === 1 ? "" : "s"
        } across estate modules.`,
        dispatchedCount,
        dispatched,
      },
      { status: 201 }
    );
    });
  } catch (err) {
    console.error("Error in master-sheet route:", err);
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) || "Failed to process master daily sheet" },
      { status: err instanceof ValidationError || err instanceof SyntaxError ? 400 : 500 }
    );
  }
}
