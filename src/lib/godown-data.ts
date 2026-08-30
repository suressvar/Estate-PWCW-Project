import {
  getDatabase,
  saveDatabase,
  GodownItem,
  GodownStockMovement,
  FertilizerLogItem,
  DieselLogItem,
  MachineryLogItem,
  GeneralPurchaseLogItem,
} from "./db-storage";
import {
  addFertilizerLog,
  addDieselLog,
  addMachineryLog,
  addGeneralPurchaseLog,
} from "./transaction-logs";

export type { GodownItem, GodownStockMovement };

export interface IssueItemPayload {
  godownItemId: string;
  destinationMenu: "Fertilizer" | "Diesel" | "Machinery" | "General Purchases / Plot Ops" | string;
  quantity: number;
  date: string;
  plotId?: string;
  plotName?: string;
  cropActivityId?: string;
  cropActivityName?: string;
  issuedTo?: string;
  notes?: string;
}

export function calculateGodownItemStatus(
  available: number,
  minAlert: number
): "IN_STOCK" | "LOW_STOCK" | "EXHAUSTED" {
  if (available <= 0) return "EXHAUSTED";
  if (available <= minAlert) return "LOW_STOCK";
  return "IN_STOCK";
}

export function getGodownItems(): GodownItem[] {
  const db = getDatabase();
  const list = db.godownItems || [];

  return list.map((item) => {
    const available = Number(item.availableQuantity) || 0;
    const rate = Number(item.ratePerUnit) || 0;
    const totalVal = Math.round(available * rate * 100) / 100;
    const status = calculateGodownItemStatus(available, Number(item.minStockAlert) || 0);

    return {
      ...item,
      availableQuantity: available,
      totalValue: totalVal,
      status,
    };
  });
}

export function getGodownItemById(id: string): GodownItem | undefined {
  const items = getGodownItems();
  return items.find((it) => it.id === id);
}

export function getGodownMovements(): GodownStockMovement[] {
  const db = getDatabase();
  return (db.godownMovements || []).slice().sort((a, b) => {
    return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
  });
}

export function getGodownStats() {
  const items = getGodownItems();
  const movements = getGodownMovements();

  const totalItems = items.length;
  const inStockItems = items.filter((i) => i.status === "IN_STOCK").length;
  const lowStockItems = items.filter((i) => i.status === "LOW_STOCK").length;
  const exhaustedItems = items.filter((i) => i.status === "EXHAUSTED").length;
  const totalValuation = items.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  return {
    totalItems,
    inStockItems,
    lowStockItems,
    exhaustedItems,
    totalValuation,
    totalMovements: movements.length,
    categoriesCount: categories.length,
  };
}

export function clearAllGodownData(): boolean {
  const db = getDatabase();
  db.godownItems = [];
  db.godownMovements = [];
  saveDatabase(db);
  return true;
}

export function addGodownItem(
  payload: Omit<GodownItem, "id" | "createdAt" | "lastUpdated" | "totalValue" | "status"> & {
    status?: "IN_STOCK" | "LOW_STOCK" | "EXHAUSTED";
  }
): GodownItem {
  const db = getDatabase();
  if (!db.godownItems) db.godownItems = [];
  if (!db.godownMovements) db.godownMovements = [];

  const now = new Date().toISOString();
  const totalQty = Number(payload.totalReceivedQuantity) || 1;
  const availableQty = payload.availableQuantity !== undefined ? Number(payload.availableQuantity) : totalQty;
  const rate = Number(payload.ratePerUnit) || 0;
  const minAlert = Number(payload.minStockAlert) || Math.max(1, Math.round(totalQty * 0.2));
  const status = calculateGodownItemStatus(availableQty, minAlert);

  const newItem: GodownItem = {
    id: `gdn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: payload.name.trim(),
    category: payload.category || "General Estate Supplies",
    sourceVoucherId: payload.sourceVoucherId,
    sourceVoucherNo: payload.sourceVoucherNo,
    vendorName: payload.vendorName || "Vendor Procurement",
    receivedDate: payload.receivedDate || now.split("T")[0],
    totalReceivedQuantity: totalQty,
    availableQuantity: availableQty,
    unit: payload.unit || "units",
    ratePerUnit: rate,
    totalValue: availableQty * rate,
    location: payload.location || "Godown Main Central Bay",
    minStockAlert: minAlert,
    status,
    notes: payload.notes || "",
    createdAt: now,
    lastUpdated: now,
  };

  db.godownItems.unshift(newItem);

  // Record Inward Movement
  const movement: GodownStockMovement = {
    id: `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    godownItemId: newItem.id,
    itemName: newItem.name,
    category: newItem.category,
    movementType: "INWARD_PURCHASE",
    quantity: totalQty,
    unit: newItem.unit,
    ratePerUnit: rate,
    totalCost: totalQty * rate,
    source: payload.vendorName ? `Vendor Purchase (${payload.vendorName})` : "Purchase Voucher Inward",
    destinationMenu: "Godown Central Store",
    destinationRoute: "/godown",
    date: newItem.receivedDate,
    notes: payload.sourceVoucherNo ? `Inward from ${payload.sourceVoucherNo}` : "Direct Godown Inward",
    createdAt: now,
  };

  db.godownMovements.unshift(movement);

  saveDatabase(db);
  return newItem;
}

/**
 * Automatically inward items from a purchase voucher into the Godown.
 */
export function inwardPurchasedItems(
  voucherItems: Array<{ description: string; quantity: number; unit: string; rate: number; amount: number }>,
  voucherInfo: {
    voucherId?: string;
    voucherNo?: string;
    category?: string;
    vendorName?: string;
    date?: string;
  }
) {
  const db = getDatabase();
  if (!db.godownItems) db.godownItems = [];
  if (!db.godownMovements) db.godownMovements = [];

  const createdItems: GodownItem[] = [];

  for (const it of voucherItems) {
    if (!it.description || !it.description.trim()) continue;

    const rate = Number(it.rate) || (Number(it.quantity) ? Number(it.amount) / Number(it.quantity) : 0);
    const item = addGodownItem({
      name: it.description.trim(),
      category: voucherInfo.category || "General Estate Supplies",
      sourceVoucherId: voucherInfo.voucherId,
      sourceVoucherNo: voucherInfo.voucherNo,
      vendorName: voucherInfo.vendorName,
      receivedDate: voucherInfo.date || new Date().toISOString().split("T")[0],
      totalReceivedQuantity: Number(it.quantity) || 1,
      availableQuantity: Number(it.quantity) || 1,
      unit: it.unit || "units",
      ratePerUnit: rate,
      location: determineDefaultGodownLocation(voucherInfo.category, it.description),
      minStockAlert: Math.max(1, Math.round((Number(it.quantity) || 1) * 0.2)),
      notes: `Procured via Voucher ${voucherInfo.voucherNo || "Purchase"}`,
    });
    createdItems.push(item);
  }

  return createdItems;
}

function determineDefaultGodownLocation(category?: string, name?: string): string {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (cat.includes("fertilizer") || n.includes("fertilizer") || n.includes("urea") || n.includes("npk")) {
    return "Godown Bay A - Dry Fertilizer & Nutrition";
  }
  if (cat.includes("diesel") || cat.includes("fuel") || n.includes("diesel") || n.includes("petrol")) {
    return "Fuel Yard Tank #1 - Secured Fuel Dispenser";
  }
  if (cat.includes("machinery") || n.includes("blade") || n.includes("spare") || n.includes("filter")) {
    return "Tool Crib Rack 4 - Machinery & Equipment Spares";
  }
  if (cat.includes("irrigation") || n.includes("pipe") || n.includes("drip") || n.includes("valve")) {
    return "Hardware Shed Rack 2 - Irrigation & Plumbing";
  }
  if (cat.includes("seed") || n.includes("seed") || n.includes("sapling")) {
    return "Cold Store Chamber - Seeds & Nursery Stocks";
  }
  if (cat.includes("pesticide") || n.includes("bio") || n.includes("spray")) {
    return "Chemical Storage Locker B - Plant Protection";
  }
  return "Godown Main Central Storage Bay";
}

/**
 * Issues an item from the Godown to an appropriate destination menu/module:
 * - Deducts from Godown inventory balance
 * - Creates a GodownStockMovement audit record
 * - Automatically registers the transaction in the destination module's log
 */
export function issueGodownItemToMenu(payload: IssueItemPayload): {
  success: boolean;
  message: string;
  updatedItem: GodownItem;
  movement: GodownStockMovement;
  destinationLog?: any;
} {
  const db = getDatabase();
  if (!db.godownItems) db.godownItems = [];
  if (!db.godownMovements) db.godownMovements = [];

  const itemIndex = db.godownItems.findIndex((it) => it.id === payload.godownItemId);
  if (itemIndex === -1) {
    throw new Error(`Godown Item with ID "${payload.godownItemId}" not found.`);
  }

  const item = db.godownItems[itemIndex];
  const reqQty = Number(payload.quantity);

  if (isNaN(reqQty) || reqQty <= 0) {
    throw new Error("Issue quantity must be greater than zero.");
  }

  if (reqQty > item.availableQuantity) {
    throw new Error(
      `Insufficient stock. Requested ${reqQty} ${item.unit}, but only ${item.availableQuantity} ${item.unit} available in Godown.`
    );
  }

  const now = new Date().toISOString();
  const issueDate = payload.date || now.split("T")[0];
  const newAvailable = Math.round((item.availableQuantity - reqQty) * 100) / 100;
  const status = calculateGodownItemStatus(newAvailable, item.minStockAlert);
  const totalCost = Math.round(reqQty * item.ratePerUnit * 100) / 100;

  // Update Godown Item
  item.availableQuantity = newAvailable;
  item.totalValue = Math.round(newAvailable * item.ratePerUnit * 100) / 100;
  item.status = status;
  item.lastUpdated = now;
  db.godownItems[itemIndex] = item;

  // Determine Destination Route and create destination log
  let destinationRoute = "/godown";
  let destinationLog: any = null;
  const dest = (payload.destinationMenu || "").toLowerCase();

  if (dest.includes("fertilizer")) {
    destinationRoute = "/fertilizer";
    destinationLog = addFertilizerLog({
      plotCropId: payload.cropActivityId,
      plotName: payload.plotName || "General Estate",
      cropActivityName: payload.cropActivityName || "Plot Application",
      transactionType: "CONSUMPTION",
      fertilizerName: item.name,
      quantityKg: reqQty,
      cost: totalCost,
      date: issueDate,
      loggedBy: payload.issuedTo || "Godown Dispatch",
      notes: `Issued from Godown (${item.location}). ${payload.notes || ""}`.trim(),
    });
  } else if (dest.includes("diesel") || dest.includes("fuel")) {
    destinationRoute = "/diesel";
    destinationLog = addDieselLog({
      transactionType: "CONSUMPTION",
      quantityLiters: reqQty,
      cost: totalCost,
      date: issueDate,
      loggedBy: payload.issuedTo || "Godown Dispatch",
      notes: `Dispensed from Godown Fuel Yard. ${payload.notes || ""}`.trim(),
    });
  } else if (dest.includes("machinery")) {
    destinationRoute = "/machinery";
    destinationLog = addMachineryLog({
      plotCropId: payload.cropActivityId,
      plotName: payload.plotName || "Machinery Shed",
      cropActivityName: payload.cropActivityName || "Equipment Maintenance",
      machineName: item.name,
      startTime: `${issueDate}T08:00:00Z`,
      endTime: `${issueDate}T12:00:00Z`,
      runningHours: 0,
      dieselConsumedLiters: 0,
      date: issueDate,
      loggedBy: payload.issuedTo || "Godown Dispatch",
      notes: `Spares / Parts issued from Godown. ${payload.notes || ""}`.trim(),
    });
  } else {
    // General Purchases / Plot Operations / Crops
    destinationRoute = "/general-purchases";
    destinationLog = addGeneralPurchaseLog({
      voucherNo: `GDN-ISS-${Date.now().toString().slice(-4)}`,
      category: item.category || "General Estate Supplies",
      plotCropId: payload.cropActivityId,
      plotName: payload.plotName || "General Estate",
      cropActivityName: payload.cropActivityName || "Plot Operations",
      vendorName: `Godown Store (${item.location})`,
      description: `${item.name} (${reqQty} ${item.unit}) issued to ${payload.plotName || "estate operations"}`,
      items: [
        {
          id: `item_${Date.now()}`,
          description: item.name,
          quantity: reqQty,
          unit: item.unit,
          rate: item.ratePerUnit,
          amount: totalCost,
        },
      ],
      subtotal: totalCost,
      cost: totalCost,
      paymentMode: "Bank Transfer",
      paymentStatus: "PAID",
      date: issueDate,
      loggedBy: payload.issuedTo || "Godown Dispatch",
      notes: `Stock issue from Godown. ${payload.notes || ""}`.trim(),
    });
  }

  // Create Movement Log
  const movement: GodownStockMovement = {
    id: `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    godownItemId: item.id,
    itemName: item.name,
    category: item.category,
    movementType: "ISSUE_TO_MENU",
    quantity: reqQty,
    unit: item.unit,
    ratePerUnit: item.ratePerUnit,
    totalCost,
    source: `Godown Store (${item.location})`,
    destinationMenu: payload.destinationMenu,
    destinationRoute,
    plotId: payload.plotId,
    plotName: payload.plotName,
    cropActivityId: payload.cropActivityId,
    cropActivityName: payload.cropActivityName,
    issuedTo: payload.issuedTo,
    date: issueDate,
    notes: payload.notes || `Issued to ${payload.destinationMenu}`,
    createdAt: now,
  };

  db.godownMovements.unshift(movement);

  saveDatabase(db);

  return {
    success: true,
    message: `Successfully issued ${reqQty} ${item.unit} of "${item.name}" to ${payload.destinationMenu}!`,
    updatedItem: item,
    movement,
    destinationLog,
  };
}

export function isItemMatchingModule(item: { name: string; category?: string }, mod: string): boolean {
  const m = mod.toLowerCase();
  const name = (item.name || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();

  if (m === "fertilizer") {
    return (
      cat.includes("fertilizer") ||
      cat.includes("nutrition") ||
      name.includes("fertilizer") ||
      name.includes("npk") ||
      name.includes("urea") ||
      name.includes("potash") ||
      name.includes("manure") ||
      name.includes("compost") ||
      name.includes("zinc") ||
      name.includes("sulphur") ||
      name.includes("bio") ||
      name.includes("dap") ||
      name.includes("spray")
    );
  }
  if (m === "diesel" || m === "fuel") {
    return (
      cat.includes("diesel") ||
      cat.includes("fuel") ||
      name.includes("diesel") ||
      name.includes("petrol") ||
      name.includes("fuel")
    );
  }
  if (m === "machinery") {
    return (
      cat.includes("machinery") ||
      cat.includes("equipment") ||
      cat.includes("spares") ||
      name.includes("tractor") ||
      name.includes("blade") ||
      name.includes("plough") ||
      name.includes("filter") ||
      name.includes("rotavator") ||
      name.includes("oil") ||
      name.includes("grease") ||
      name.includes("spare") ||
      name.includes("implement")
    );
  }
  return true;
}

export function getGodownItemsForModule(module: string): GodownItem[] {
  const items = getGodownItems();
  return items.filter((it) => isItemMatchingModule(it, module));
}

export function getGodownMovementsForModule(module: string) {
  const movements = getGodownMovements();
  const modLower = module.toLowerCase();

  const matching = movements.filter((m) => {
    const isDest = (m.destinationMenu || "").toLowerCase().includes(modLower);
    const isMatch = isItemMatchingModule({ name: m.itemName, category: m.category }, module);
    return isDest || isMatch;
  });

  const purchases = matching.filter((m) => m.movementType === "INWARD_PURCHASE");
  const consumptions = matching.filter(
    (m) => m.movementType === "ISSUE_TO_MENU" || (m.destinationMenu || "").toLowerCase().includes(modLower)
  );

  return { purchases, consumptions };
}

export function getModuleStockSummary(module: string) {
  const items = getGodownItemsForModule(module);
  const { purchases, consumptions } = getGodownMovementsForModule(module);

  const totalAvailableQty = items.reduce((acc, it) => acc + (it.availableQuantity || 0), 0);
  const totalValuation = items.reduce((acc, it) => acc + (it.totalValue || 0), 0);

  const totalPurchasedQty = purchases.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalPurchasedCost = purchases.reduce((acc, p) => acc + (p.totalCost || 0), 0);

  const totalConsumedQty = consumptions.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalConsumedCost = consumptions.reduce((acc, c) => acc + (c.totalCost || 0), 0);

  return {
    itemsCount: items.length,
    totalAvailableQty,
    totalValuation,
    totalPurchasedQty,
    totalPurchasedCost,
    totalConsumedQty,
    totalConsumedCost,
    items,
    purchases,
    consumptions,
  };
}
