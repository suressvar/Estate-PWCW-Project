import { NextResponse } from "next/server";
import { upsertDailyLog, addWorkActivity, ActivityType } from "@/lib/daily-log-data";
import {
  addFertilizerLog,
  addDieselLog,
  addMachineryLog,
  addLaborLog,
  addSalesLog,
  addGeneralPurchaseLog,
} from "@/lib/transaction-logs";
import { getPlots, getPlotCrops } from "@/lib/master-data";
import { inwardPurchasedItems } from "@/lib/godown-data";

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
    const plotCrop = plotCrops.find((pc) => pc.id === body.plotCropId || pc.plotId === body.plotId);
    const cropActivityName = plotCrop?.cropActivityName || "General Crop";

    const loggedBy = body.loggedBy?.trim() || "Field Supervisor";
    const date = body.date;

    const dispatched: {
      dailyLog?: any;
      activity?: any;
      labor?: any;
      fertilizer?: any;
      diesel?: any;
      machinery?: any;
      sales?: any;
      purchase?: any;
    } = {};

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
      const men = Number(body.labor.menCount) || 0;
      const women = Number(body.labor.womenCount) || 0;
      const menRate = Number(body.labor.menWageRate) || 600;
      const womenRate = Number(body.labor.womenWageRate) || 500;
      const calculatedCost = men * menRate + women * womenRate;
      const totalCost = Number(body.labor.totalCost) || calculatedCost;

      if (men > 0 || women > 0 || totalCost > 0) {
        const laborLog = addLaborLog({
          plotCropId: body.plotCropId,
          plotName,
          cropActivityName,
          menCount: men,
          womenCount: women,
          menWageRate: menRate,
          womenWageRate: womenRate,
          totalCost,
          date,
          loggedBy,
          notes: body.labor.notes?.trim() || `Daily master sheet labor record for ${plotName}`,
        });

        dispatched.labor = {
          id: laborLog.id,
          menCount: men,
          womenCount: women,
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
      const dieselCost = Number(body.machinery.dieselCost) || (dieselLiters * 95);

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
          paymentMode: (body.sales.paymentMode as any) || "Bank Transfer",
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
          voucherNo: `PUR-DAY-${Date.now().toString().slice(-6)}`,
          category: body.purchase.category?.trim() || "General Estate Supplies",
          plotCropId: body.plotCropId,
          plotName,
          cropActivityName,
          vendorName: body.purchase.vendorName?.trim() || "Local Supplier",
          description: desc || "Daily Field Purchase / Procurement",
          subtotal: cost,
          cost,
          paymentMode: (body.purchase.paymentMode as any) || "Cash",
          paymentStatus: "PAID",
          date,
          loggedBy,
          notes: body.purchase.notes?.trim() || `Daily master sheet purchase for ${plotName}`,
        });

        try {
          if (pLog.items && pLog.items.length > 0) {
            inwardPurchasedItems(pLog.items, {
              voucherId: pLog.id,
              voucherNo: pLog.voucherNo,
              category: pLog.category,
              vendorName: pLog.vendorName,
              date: pLog.date,
            });
          }
        } catch (err) {
          console.error("Auto inward failed in master sheet:", err);
        }

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
  } catch (err: any) {
    console.error("Error in master-sheet route:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process master daily sheet" },
      { status: 500 }
    );
  }
}
