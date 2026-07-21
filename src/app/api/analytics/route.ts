import { NextResponse } from "next/server";
import {
  getFertilizerLogs,
  getDieselLogs,
  getMachineryLogs,
  getLaborLogs,
  getProductionLogs,
  getSalesLogs,
  getGeneralPurchaseLogs,
} from "@/lib/transaction-logs";
import { getPlots, getCrops } from "@/lib/master-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const plotFilter = searchParams.get("plot");

  const fert = getFertilizerLogs().filter((l) => isWithinDateRange(l.date, startDate, endDate));
  const diesel = getDieselLogs().filter((l) => isWithinDateRange(l.date, startDate, endDate));
  const mach = getMachineryLogs().filter((l) => isWithinDateRange(l.date, startDate, endDate));
  const labor = getLaborLogs().filter((l) => isWithinDateRange(l.date, startDate, endDate));
  const prod = getProductionLogs().filter((l) => isWithinDateRange(l.date, startDate, endDate));
  const sales = getSalesLogs().filter((l) => isWithinDateRange(l.date, startDate, endDate));
  const gen = getGeneralPurchaseLogs().filter((l) => isWithinDateRange(l.date, startDate, endDate));

  // 1. Stock Computations (Sum of purchases - Sum of consumption)
  const fertPurchasedKg = fert.filter((f) => f.transactionType === "PURCHASE").reduce((acc, f) => acc + f.quantityKg, 0);
  const fertConsumedKg = fert.filter((f) => f.transactionType === "CONSUMPTION").reduce((acc, f) => acc + f.quantityKg, 0);
  const currentFertilizerStockKg = Math.max(0, fertPurchasedKg - fertConsumedKg);

  const dieselPurchasedLiters = diesel.filter((d) => d.transactionType === "PURCHASE").reduce((acc, d) => acc + d.quantityLiters, 0);
  const dieselConsumedLiters = diesel.filter((d) => d.transactionType === "CONSUMPTION").reduce((acc, d) => acc + d.quantityLiters, 0);
  const currentDieselStockLiters = Math.max(0, dieselPurchasedLiters - dieselConsumedLiters);

  // 2. Financial Aggregation (Revenue minus Costs)
  const totalRevenue = sales.reduce((acc, s) => acc + s.value, 0);
  const fertilizerCost = fert.filter((f) => f.transactionType === "CONSUMPTION").reduce((acc, f) => acc + f.cost, 0);
  const laborCost = labor.reduce((acc, l) => acc + l.totalCost, 0);
  const generalCost = gen.reduce((acc, g) => acc + g.cost, 0);
  const totalExpenses = fertilizerCost + laborCost + generalCost;
  const netProfit = totalRevenue - totalExpenses;

  // 3. Plot-wise P&L
  const allPlots = getPlots();
  const plotPnL = allPlots.map((p) => {
    const pSales = sales.filter((s) => s.plotName === p.name).reduce((acc, s) => acc + s.value, 0);
    const pFert = fert.filter((f) => f.plotName === p.name && f.transactionType === "CONSUMPTION").reduce((acc, f) => acc + f.cost, 0);
    const pLabor = labor.filter((l) => l.plotName === p.name).reduce((acc, l) => acc + l.totalCost, 0);
    const pGen = gen.filter((g) => g.plotName === p.name).reduce((acc, g) => acc + g.cost, 0);
    const pExp = pFert + pLabor + pGen;
    return {
      plot: p.name,
      Revenue: pSales,
      Expense: pExp,
      NetProfit: pSales - pExp,
    };
  });

  // 4. Crop-wise P&L
  const allCrops = getCrops();
  const cropPnL = allCrops.map((c) => {
    const cSales = sales.filter((s) => s.cropActivityName === c.name).reduce((acc, s) => acc + s.value, 0);
    const cFert = fert.filter((f) => f.cropActivityName === c.name && f.transactionType === "CONSUMPTION").reduce((acc, f) => acc + f.cost, 0);
    const cLabor = labor.filter((l) => l.cropActivityName === c.name).reduce((acc, l) => acc + l.totalCost, 0);
    const cGen = gen.filter((g) => g.cropActivityName === c.name).reduce((acc, g) => acc + g.cost, 0);
    const cExp = cFert + cLabor + cGen;
    return {
      crop: c.name,
      Revenue: cSales,
      Expense: cExp,
      NetProfit: cSales - cExp,
    };
  });

  // 5. Machinery Fuel Efficiency (Liters / Hour per machine)
  const machines = Array.from(new Set(mach.map((m) => m.machineName)));
  const fuelEfficiency = machines.map((machineName) => {
    const mLogs = mach.filter((m) => m.machineName === machineName);
    const totalHours = mLogs.reduce((acc, m) => acc + m.runningHours, 0);
    const totalDiesel = mLogs.reduce((acc, m) => acc + m.dieselConsumedLiters, 0);
    const litersPerHour = totalHours > 0 ? Number((totalDiesel / totalHours).toFixed(2)) : 0;
    return {
      machine: machineName,
      litersPerHour,
      totalHours,
      totalDiesel,
    };
  });

  // 6. Per-Plot Drill-Down Data (if plotFilter query provided or for all)
  const plotDrillDown = allPlots.map((p) => ({
    plotName: p.name,
    fertilizer: fert.filter((f) => f.plotName === p.name),
    machinery: mach.filter((m) => m.plotName === p.name),
    labor: labor.filter((l) => l.plotName === p.name),
    production: prod.filter((pr) => pr.plotName === p.name),
    sales: sales.filter((s) => s.plotName === p.name),
    general: gen.filter((g) => g.plotName === p.name),
  }));

  return NextResponse.json({
    kpis: {
      totalRevenue,
      totalExpenses,
      netProfit,
      currentFertilizerStockKg,
      currentDieselStockLiters,
    },
    plotPnL,
    cropPnL,
    fuelEfficiency,
    plotDrillDown,
  });
}

function isWithinDateRange(logDate: string, startDate?: string | null, endDate?: string | null) {
  if (!startDate && !endDate) return true;
  if (startDate && logDate < startDate) return false;
  if (endDate && logDate > endDate) return false;
  return true;
}
