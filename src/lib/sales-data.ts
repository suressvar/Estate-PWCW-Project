import { getExpenseLedgerById } from "./accounting-data";

export type SaleType = "crop" | "other";

export interface OtherSaleItem {
  id: string;
  srNo: string;
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  dateOfSale: string;
  buyerName: string;
  buyerCity?: string;
  buyerContact?: string;
  ledgerId?: string;
  particularName?: string;
  pnlCategory: string;
  notes?: string;
  invoiceGroupId?: string;
  createdAt: string;
}

// Seed Crop & Produce Sales
let mockOtherSales: OtherSaleItem[] = [
  {
    id: "os-1",
    srNo: "OSR-0001",
    itemName: "Fresh Grade-A Tomatoes",
    quantity: 2500,
    unit: "kg",
    pricePerUnit: 42,
    totalAmount: 105000,
    dateOfSale: "2026-06-22",
    buyerName: "Koyambedu Wholesale Mandi",
    buyerCity: "Chennai",
    buyerContact: "+91 98401 23456",
    ledgerId: "el-8",
    particularName: "Crop & Produce Sales",
    pnlCategory: "Sales",
    invoiceGroupId: "inv-grp-1",
    notes: "First harvest pick batch",
    createdAt: "2026-06-22",
  },
  {
    id: "os-2",
    srNo: "OSR-0002",
    itemName: "Tender Coconut (Bulk Harvest)",
    quantity: 1200,
    unit: "nos",
    pricePerUnit: 35,
    totalAmount: 42000,
    dateOfSale: "2026-07-01",
    buyerName: "Coimbatore Agro Traders",
    buyerCity: "Coimbatore",
    buyerContact: "+91 94433 11223",
    ledgerId: "el-8",
    particularName: "Crop & Produce Sales",
    pnlCategory: "Sales",
    invoiceGroupId: "inv-grp-2",
    notes: "Fresh harvested nuts",
    createdAt: "2026-07-01",
  },
  {
    id: "os-3",
    srNo: "OSR-0003",
    itemName: "Organic Farm Compost & Vermicompost",
    quantity: 80,
    unit: "bags",
    pricePerUnit: 250,
    totalAmount: 20000,
    dateOfSale: "2026-07-05",
    buyerName: "Green Valley Organic Orchards",
    buyerCity: "Pollachi",
    buyerContact: "+91 97881 22334",
    ledgerId: "el-9",
    particularName: "Organic Compost & Bio-Fertilizer Sales",
    pnlCategory: "Sales",
    invoiceGroupId: "inv-grp-3",
    notes: "50kg aged bag lot",
    createdAt: "2026-07-05",
  },
];

export function getOtherSales(): OtherSaleItem[] {
  return mockOtherSales;
}

export function getSaleById(type: string, id: string) {
  return mockOtherSales.find((s) => s.id === id);
}

export function getSalesByInvoiceGroup(invoiceGroupId: string) {
  const otherItems = mockOtherSales.filter((s) => s.invoiceGroupId === invoiceGroupId);

  const buyerName = otherItems[0]?.buyerName || "Walk-in Customer";
  const buyerCity = otherItems[0]?.buyerCity || "";
  const buyerContact = otherItems[0]?.buyerContact || "";
  const dateOfSale = otherItems[0]?.dateOfSale || new Date().toISOString().split("T")[0];

  const totalAmount = otherItems.reduce((acc, i) => acc + i.totalAmount, 0);

  return {
    invoiceGroupId,
    dateOfSale,
    buyerName,
    buyerCity,
    buyerContact,
    otherItems,
    totalAmount,
  };
}

export function createMultiItemSale(type: string, payload: any) {
  const invoiceGroupId = `inv_${Date.now()}`;
  const ledger = payload.ledgerId ? getExpenseLedgerById(payload.ledgerId) : undefined;
  const particularName = ledger ? ledger.ledgerName : payload.particularName || "Crop & Produce Sales";

  const created: OtherSaleItem[] = [];
  const items = payload.items || [];
  items.forEach((item: any, idx: number) => {
    const srNo = `OSR-${String(mockOtherSales.length + 1 + idx).padStart(4, "0")}`;
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.pricePerUnit) || 0;
    const record: OtherSaleItem = {
      id: `os_${Date.now()}_${idx}`,
      srNo,
      itemName: item.itemName || "Crop Produce",
      quantity: qty,
      unit: item.unit || "kg",
      pricePerUnit: rate,
      totalAmount: qty * rate,
      dateOfSale: payload.dateOfSale || new Date().toISOString().split("T")[0],
      buyerName: payload.buyerName,
      buyerCity: payload.buyerCity,
      buyerContact: payload.buyerContact,
      ledgerId: payload.ledgerId,
      particularName,
      pnlCategory: "Sales",
      notes: payload.notes || item.notes,
      invoiceGroupId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    mockOtherSales.unshift(record);
    created.push(record);
  });

  return { invoiceGroupId, items: created };
}

export function updateSale(type: string, id: string, payload: any) {
  mockOtherSales = mockOtherSales.map((s) => {
    if (s.id === id) {
      const qty = payload.quantity !== undefined ? Number(payload.quantity) : s.quantity;
      const rate = payload.pricePerUnit !== undefined ? Number(payload.pricePerUnit) : s.pricePerUnit;
      return {
        ...s,
        ...payload,
        quantity: qty,
        pricePerUnit: rate,
        totalAmount: qty * rate,
      };
    }
    return s;
  });
  return mockOtherSales.find((s) => s.id === id);
}

export function deleteSale(type: string, id: string): boolean {
  mockOtherSales = mockOtherSales.filter((s) => s.id !== id);
  return true;
}

export function calculateSalesAnalytics() {
  const totalRevenue = mockOtherSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalInvoices = new Set(mockOtherSales.map((s) => s.invoiceGroupId || s.id)).size;
  const avgOrderValue = totalInvoices > 0 ? Math.round(totalRevenue / totalInvoices) : 0;
  const topProduct = mockOtherSales.length > 0 ? mockOtherSales[0].itemName : "Fresh Tomatoes";

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  mockOtherSales.forEach((s) => {
    const key = s.itemName.split(" ")[0] || "Produce";
    categoryMap[key] = (categoryMap[key] || 0) + s.totalAmount;
  });

  const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Monthly breakdown
  const monthlyRevenue = [
    { month: "Jan 2026", revenue: 45000 },
    { month: "Feb 2026", revenue: 62000 },
    { month: "Mar 2026", revenue: 84000 },
    { month: "Apr 2026", revenue: 95000 },
    { month: "May 2026", revenue: 110000 },
    { month: "Jun 2026", revenue: 105000 },
    { month: "Jul 2026", revenue: 62000 },
  ];

  return {
    kpis: {
      totalRevenue,
      totalInvoices,
      avgOrderValue,
      topProduct,
    },
    monthlyRevenue,
    categoryDistribution,
    recentTransactions: mockOtherSales.slice(0, 10),
  };
}

export const getSalesAnalytics = calculateSalesAnalytics;
export const updateSaleItem = updateSale;
export const deleteSaleItem = deleteSale;
