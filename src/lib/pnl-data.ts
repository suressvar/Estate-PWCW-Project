import { getWages } from "./hr-data";
import { dateRange } from './validation';
import { getStockValuations } from "./inventory-data";
import { getOtherSales } from "./sales-data";
import { getVouchers } from "./vouchers-data";

export interface PnLLineItem {
  name: string;
  amount: number;
  subItems?: { name: string; amount: number }[];
  isBalanceFigure?: boolean;
}

export interface PnLStatementResult {
  periodName: string;
  fromDate: string;
  toDate: string;
  debitItems: PnLLineItem[];
  creditItems: PnLLineItem[];
  totalDebitGross: number;
  totalCreditGross: number;
  netProfit: number;
  netLoss: number;
  balancedTotal: number;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    openingStock: number;
    closingStock: number;
    isProfitable: boolean;
    stockValuationMatched: boolean;
  };
}

export function generatePnLStatement(fromDate: string = "2026-04-01", toDate: string = "2027-03-31"): PnLStatementResult {
  dateRange(fromDate, toDate);
  // Date filtering helper
  const inRange = (dStr: string) => {
    if (!dStr) return true;
    return dStr >= fromDate && dStr <= toDate;
  };

  // Stock Valuations
  const valuations = getStockValuations();
  const matchingValuation = valuations.find(item => item.fromDate === fromDate && item.toDate === toDate);
  const currentValuation = matchingValuation || { openingStock: 0, closingStock: 0, periodName: `${fromDate} to ${toDate}` };
  const openingStock = currentValuation.openingStock;
  const closingStock = currentValuation.closingStock;

  // Purchases
  const feedPurchases = getVouchers("feed").filter((f) => inRange(f.purchaseDate));
  const medPurchases = getVouchers("medicine").filter((m) => inRange(m.purchaseDate));
  const vacPurchases = getVouchers("vaccine").filter((v) => inRange(v.purchaseDate));
  const otherVouchers = getVouchers("other").filter((o) => inRange(o.voucherDate));

  const totalFeedPurchases = feedPurchases.reduce((acc: number, i) => acc + i.cost, 0);
  const totalMedPurchases = medPurchases.reduce((acc: number, i) => acc + i.cost, 0);
  const totalVacPurchases = vacPurchases.reduce((acc: number, i) => acc + i.cost, 0);

  // Other vouchers categorized
  const directExpenses = otherVouchers
    .filter((o) => o.pnlCategory === "Direct Expenses")
    .reduce((acc: number, i) => acc + i.amount, 0);

  const indirectExpenses = otherVouchers
    .filter((o) => o.pnlCategory === "Indirect Expenses")
    .reduce((acc: number, i) => acc + i.amount, 0);

  const adminExpenses = otherVouchers
    .filter((o) => o.pnlCategory === "Administrative Expenses")
    .reduce((acc: number, i) => acc + i.amount, 0);

  const equipmentPurchases = otherVouchers
    .filter((o) => o.pnlCategory === "Purchase" || o.particularName?.includes("Equipment"))
    .reduce((acc: number, i) => acc + i.amount, 0);

  // Wages
  const paidWages = getWages()
    .filter((w) => w.status === "PAID" && Boolean(w.paymentDate || (w.year && w.month)) && inRange(w.paymentDate || `${w.year}-${String(w.month).padStart(2, "0")}-01`))
    .reduce((acc, w) => acc + w.netSalary, 0);

  // Sales & Incomes
  const otherSales = getOtherSales().filter((s) => inRange(s.dateOfSale));
  const totalOtherSales = otherSales.reduce((acc, s) => acc + s.totalAmount, 0);

  const directIncome = otherVouchers
    .filter((o) => o.pnlCategory === "Direct Income")
    .reduce((acc: number, i) => acc + i.amount, 0);

  // Build Left Side (DEBIT / EXPENSES) - only include items with transactions/amount > 0
  const allDebitItems: PnLLineItem[] = [
    { name: "To Opening Stock (Produce & Nursery)", amount: openingStock },
    {
      name: "To PWCW Inputs & Nutritional Feed",
      amount: totalFeedPurchases,
      subItems: feedPurchases.map((f) => ({ name: f.feedName, amount: f.cost })),
    },
    {
      name: "To Crop Protection & Bio-Medicine",
      amount: totalMedPurchases,
      subItems: medPurchases.map((m) => ({ name: m.medicineName, amount: m.cost })),
    },
    {
      name: "To Bio-Cultures & Inoculants",
      amount: totalVacPurchases,
      subItems: vacPurchases.map((v) => ({ name: v.vaccineName, amount: v.cost })),
    },
    { name: "To PWCW Worker Wages & Labor Settlements", amount: paidWages },
    { name: "To Direct Operational PWCW Expenses", amount: directExpenses },
    { name: "To Indirect Operational Expenses", amount: indirectExpenses },
    { name: "To Electricity, Irrigation & Administration", amount: adminExpenses },
    { name: "To Equipment & Maintenance Procurement", amount: equipmentPurchases },
  ];
  const debitItems = allDebitItems.filter((i) => i.amount > 0 || (i.subItems && i.subItems.length > 0));

  // Build Right Side (CREDIT / INCOME) - only include items with transactions/amount > 0
  const allCreditItems: PnLLineItem[] = [
    {
      name: "By Crop Harvest & Produce Sales",
      amount: totalOtherSales,
      subItems: otherSales.map((s) => ({ name: s.itemName, amount: s.totalAmount })),
    },
    { name: "By Direct Operational Receipts", amount: directIncome },
    { name: "By Closing Stock (Produce & Inventories)", amount: closingStock },
  ];
  const creditItems = allCreditItems.filter((i) => i.amount > 0 || (i.subItems && i.subItems.length > 0));

  const totalDebitGross = debitItems.reduce((acc, i) => acc + i.amount, 0);
  const totalCreditGross = creditItems.reduce((acc, i) => acc + i.amount, 0);

  let netProfit = 0;
  let netLoss = 0;
  let balancedTotal = Math.max(totalDebitGross, totalCreditGross);

  if (totalCreditGross >= totalDebitGross) {
    netProfit = totalCreditGross - totalDebitGross;
    debitItems.push({
      name: "To Net Profit (Transferred to Capital)",
      amount: netProfit,
      isBalanceFigure: true,
    });
    balancedTotal = totalCreditGross;
  } else {
    netLoss = totalDebitGross - totalCreditGross;
    creditItems.push({
      name: "By Net Loss (Transferred to Capital)",
      amount: netLoss,
      isBalanceFigure: true,
    });
    balancedTotal = totalDebitGross;
  }

  const totalRevenue = totalOtherSales + directIncome;
  const totalExpenses = totalFeedPurchases + totalMedPurchases + totalVacPurchases + paidWages + directExpenses + indirectExpenses + adminExpenses + equipmentPurchases;

  return {
    periodName: currentValuation.periodName,
    fromDate,
    toDate,
    debitItems,
    creditItems,
    totalDebitGross,
    totalCreditGross,
    netProfit,
    netLoss,
    balancedTotal,
    summary: {
      totalRevenue,
      totalExpenses,
      openingStock,
      closingStock,
      isProfitable: totalCreditGross >= totalDebitGross,
      stockValuationMatched: Boolean(matchingValuation),
    },
  };
}
