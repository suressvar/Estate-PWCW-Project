import { assertRecordId } from "./validation";
import { randomUUID } from "node:crypto";
import { withTransaction } from "./db-storage";
import { getCropCycles } from "./crop-cycle-data";
import {
getDatabase,
MachineItem,
MachineType,
MachineUsageLogItem,
saveDatabase
} from "./db-storage";
import { getPlots } from "./master-data";
import { dateKey,finiteNumber,oneOf,positiveNumber,referenceExists,requiredText,validateAllocation } from "./validation";
import { getWorkers } from "./worker-data";

export type { MachineItem,MachineType,MachineUsageLogItem };

export interface MachineReportSummary {
  machineId: string;
  machineName: string;
  machineType: MachineType;
  registrationNumber?: string;
  fuelType?: string;
  active: boolean;
  totalUsageCount: number;
  totalHoursUsed: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOperatingCost: number;
}

export interface PlotMachineReportSummary {
  plotId: string;
  plotName: string;
  totalUsageCount: number;
  totalHoursUsed: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOperatingCost: number;
  machineBreakdown: {
    machineId: string;
    machineName: string;
    hoursUsed: number;
    operatingCost: number;
  }[];
}

/**
 * Get all registered machines.
 */
export function getMachines(filter?: { activeOnly?: boolean }): MachineItem[] {
  const db = getDatabase();
  const list = db.machines || [];
  if (filter?.activeOnly) {
    return list.filter((m) => m.active);
  }
  return list;
}

/**
 * Get a machine by ID.
 */
export function getMachineById(id: string): MachineItem | undefined {
  const db = getDatabase();
  return (db.machines || []).find((m) => m.id === id);
}

/**
 * Create a new machine in the register.
 */
export function createMachine(data: {
  name: string;
  type?: MachineType;
  registrationNumber?: string;
  fuelType?: string;
  active?: boolean;
  notes?: string;
}): MachineItem {
  return withTransaction(() => {
  if (!data.name || !data.name.trim()) {
    throw new Error("Machine name is required.");
  }

  const db = getDatabase();
  if (!db.machines) db.machines = [];

  const now = new Date().toISOString();
  const newMachine: MachineItem = {
    id: `m_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    type: data.type || "TRACTOR",
    registrationNumber: data.registrationNumber?.trim() || undefined,
    fuelType: data.fuelType?.trim() || "Diesel",
    active: data.active !== undefined ? Boolean(data.active) : true,
    notes: data.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.machines.unshift(newMachine);
  saveDatabase(db);
  return newMachine;

  });
}

/**
 * Update a machine's details.
 */
export function updateMachine(
  id: string,
  data: Partial<MachineItem>
): MachineItem | undefined {
  return withTransaction(() => {
  assertRecordId(id, data);
  if (data.name !== undefined) data.name = requiredText(data.name, 'Machine name');
  if (data.type !== undefined) oneOf(data.type, ['TRACTOR', 'TILLER', 'SPRAYER', 'PUMP', 'HARVESTER', 'VEHICLE', 'DRONE', 'OTHER'], 'Machine type');
  const db = getDatabase();
  if (!db.machines) return undefined;

  const idx = db.machines.findIndex((m) => m.id === id);
  if (idx < 0) return undefined;

  const updated: MachineItem = {
    ...db.machines[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  db.machines[idx] = updated;
  saveDatabase(db);
  return updated;

  });
}

/**
 * Delete a machine (or soft-deactivate).
 */
function deleteMachineImpl(id: string): boolean {
  const db = getDatabase();
  if (!db.machines) return false;

  const initialCount = db.machines.length;
  db.machines = db.machines.filter((m) => m.id !== id);

  const usageIds = new Set((db.machineUsageLogs || []).filter(log => log.machineId === id).map(log => `machine_log_${log.id}`));
  db.machineUsageLogs = (db.machineUsageLogs || []).filter(log => log.machineId !== id);
  db.cropExpenses = (db.cropExpenses || []).filter(expense => !usageIds.has(expense.sourceRefId || ""));

  saveDatabase(db);
  return db.machines.length < initialCount;
}

/**
 * Get machine usage logs with optional filters.
 */
export function getMachineUsageLogs(filter?: {
  machineId?: string;
  plotId?: string;
  cropCycleId?: string;
  dailyLogId?: string;
  startDate?: string;
  endDate?: string;
}): MachineUsageLogItem[] {
  const db = getDatabase();
  let logs = db.machineUsageLogs || [];

  if (filter?.machineId) {
    logs = logs.filter((l) => l.machineId === filter.machineId);
  }
  if (filter?.plotId) {
    logs = logs.filter((l) => l.plotId === filter.plotId);
  }
  if (filter?.cropCycleId) {
    logs = logs.filter((l) => l.cropCycleId === filter.cropCycleId);
  }
  if (filter?.dailyLogId) {
    logs = logs.filter((l) => l.dailyLogId === filter.dailyLogId);
  }
  if (filter?.startDate) {
    logs = logs.filter((l) => l.date >= filter.startDate!);
  }
  if (filter?.endDate) {
    logs = logs.filter((l) => l.date <= filter.endDate!);
  }

  return logs.sort((a, b) => (b.date > a.date ? 1 : -1));
}

/**
 * Log a machine usage event and automatically/idempotently sync to CropExpense if tied to a CropCycle.
 */
function addMachineUsageLogImpl(data: {
  machineId: string;
  date: string;
  plotId?: string | null;
  dailyLogId?: string | null;
  workerId?: string | null;
  operatorName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  hoursUsed: number;
  workDescription: string;
  fuelCost?: number | null;
  maintenanceCost?: number | null;
  cropCycleId?: string | null;
}): MachineUsageLogItem {
  data.hoursUsed = positiveNumber(data.hoursUsed, "Hours used");
  dateKey(data.date);
  if (data.fuelCost != null) data.fuelCost = finiteNumber(data.fuelCost, "Fuel cost");
  if (data.maintenanceCost != null) data.maintenanceCost = finiteNumber(data.maintenanceCost, "Maintenance cost");
  const machine = getMachineById(data.machineId);
  if (!machine) {
    throw new Error(`Machine with id ${data.machineId} not found.`);
  }

  if (!data.date) {
    throw new Error("Date is required.");
  }
  if (!data.workDescription || !data.workDescription.trim()) {
    throw new Error("Work description is required.");
  }
  if (data.hoursUsed <= 0) {
    throw new Error("Hours used must be greater than zero.");
  }

  const plots = getPlots();
  validateAllocation(data, getDatabase());
  const plot = data.plotId ? plots.find((p) => p.id === data.plotId) : undefined;

  const cycles = getCropCycles();
  const cycle = data.cropCycleId ? cycles.find((c) => c.id === data.cropCycleId) : undefined;

  const workers = getWorkers();
  const worker = data.workerId ? workers.find((w) => w.id === data.workerId) : undefined;
  if (data.workerId) referenceExists(data.workerId, workers, 'Worker');
  const operator = data.operatorName || (worker ? worker.name : undefined);

  const db = getDatabase();
  if (!db.machineUsageLogs) db.machineUsageLogs = [];

  const now = new Date().toISOString();
  const newLog: MachineUsageLogItem = {
    id: `mul_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
    machineId: data.machineId,
    machineName: machine.name,
    machineType: machine.type,
    date: data.date,
    plotId: data.plotId || (cycle ? cycle.plotId : null),
    plotName: plot ? plot.name : cycle ? cycle.plotName : null,
    dailyLogId: data.dailyLogId || null,
    workerId: data.workerId || null,
    operatorName: operator || undefined,
    startTime: data.startTime || undefined,
    endTime: data.endTime || undefined,
    hoursUsed: Number(data.hoursUsed),
    workDescription: data.workDescription.trim(),
    fuelCost: data.fuelCost !== undefined && data.fuelCost !== null ? Number(data.fuelCost) : 0,
    maintenanceCost:
      data.maintenanceCost !== undefined && data.maintenanceCost !== null
        ? Number(data.maintenanceCost)
        : 0,
    cropCycleId: data.cropCycleId || null,
    cropName: cycle ? cycle.cropName : undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.machineUsageLogs.unshift(newLog);
  saveDatabase(db);

  // Sync to CropExpense if cropCycleId is present
  syncMachineLogToCropExpense(newLog);

  return newLog;
}

/**
 * Update machine usage log and resync crop expense.
 */
function updateMachineUsageLogImpl(
  id: string,
  data: Partial<MachineUsageLogItem>
): MachineUsageLogItem | undefined {
  assertRecordId(id, data);
  if (data.hoursUsed !== undefined) data.hoursUsed = positiveNumber(data.hoursUsed, "Hours used");
  if (data.date !== undefined) dateKey(data.date);
  if (data.fuelCost != null) data.fuelCost = finiteNumber(data.fuelCost, "Fuel cost");
  if (data.maintenanceCost != null) data.maintenanceCost = finiteNumber(data.maintenanceCost, "Maintenance cost");
  const db = getDatabase();
  if (!db.machineUsageLogs) return undefined;

  const idx = db.machineUsageLogs.findIndex((u) => u.id === id);
  if (idx < 0) return undefined;

  const current = db.machineUsageLogs[idx];
  const merged = { ...current, ...data };
  dateKey(merged.date); requiredText(merged.workDescription, 'Work description');
  referenceExists(merged.machineId, db.machines || [], 'Machine');
  validateAllocation(merged, db);
  if (merged.workerId) referenceExists(merged.workerId, db.workers || [], 'Worker');
  const updated: MachineUsageLogItem = {
    ...current,
    ...data,
    machineName: db.machines!.find(machine => machine.id === merged.machineId)!.name,
    machineType: db.machines!.find(machine => machine.id === merged.machineId)!.type,
    plotId: merged.plotId || (merged.cropCycleId ? db.cropCycles?.find(cycle => cycle.id === merged.cropCycleId)?.plotId : null),
    updatedAt: new Date().toISOString(),
  };

  db.machineUsageLogs[idx] = updated;
  saveDatabase(db);

  syncMachineLogToCropExpense(updated);
  return updated;
}

/**
 * Delete a machine usage log and clean up any synced crop expense.
 */
function deleteMachineUsageLogImpl(id: string): boolean {
  const db = getDatabase();
  if (!db.machineUsageLogs) return false;

  const initialCount = db.machineUsageLogs.length;
  db.machineUsageLogs = db.machineUsageLogs.filter((u) => u.id !== id);

  // Remove synced crop expense
  if (db.cropExpenses) {
    const sourceRefId = `machine_log_${id}`;
    db.cropExpenses = db.cropExpenses.filter((e) => e.sourceRefId !== sourceRefId);
  }

  saveDatabase(db);
  return db.machineUsageLogs.length < initialCount;
}

/**
 * Idempotent sync of a machine usage log to CropExpense under MACHINERY category.
 */
export function syncMachineLogToCropExpense(log: MachineUsageLogItem): void {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.cropExpenses) db.cropExpenses = [];

  const sourceRefId = `machine_log_${log.id}`;
  const existingIdx = db.cropExpenses.findIndex((e) => e.sourceRefId === sourceRefId);

  const operatingCost = (Number(log.fuelCost) || 0) + (Number(log.maintenanceCost) || 0);

  // If unlinked from cropCycle or total cost is 0, remove if exists
  if (!log.cropCycleId || operatingCost <= 0) {
    if (existingIdx >= 0) {
      db.cropExpenses.splice(existingIdx, 1);
      saveDatabase(db);
    }
    return;
  }

  const desc = `${log.machineName || "Machinery"} Usage: ${log.workDescription} (${log.hoursUsed} hrs, Fuel ₹${log.fuelCost || 0}, Maint ₹${log.maintenanceCost || 0})`;

  if (existingIdx >= 0) {
    db.cropExpenses[existingIdx].cropCycleId = log.cropCycleId;
    db.cropExpenses[existingIdx].amount = operatingCost;
    db.cropExpenses[existingIdx].date = log.date;
    db.cropExpenses[existingIdx].description = desc;
    db.cropExpenses[existingIdx].linkedDailyLogId = log.dailyLogId || null;
    db.cropExpenses[existingIdx].updatedAt = new Date().toISOString();
  } else {
    db.cropExpenses.push({
      id: `ce_mch_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
      cropCycleId: log.cropCycleId,
      category: "MACHINERY",
      amount: operatingCost,
      date: log.date,
      description: desc,
      linkedDailyLogId: log.dailyLogId || null,
      sourceRefId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveDatabase(db);

  });
}

/**
 * Aggregate machinery report: per machine usage, hours, fuel, maintenance, and operating cost.
 */
export function getMachineryReport(): MachineReportSummary[] {
  const machines = getMachines();
  const logs = getMachineUsageLogs();

  return machines.map((m) => {
    const machineLogs = logs.filter((l) => l.machineId === m.id);
    const totalUsageCount = machineLogs.length;
    const totalHoursUsed = machineLogs.reduce((acc, curr) => acc + (Number(curr.hoursUsed) || 0), 0);
    const totalFuelCost = machineLogs.reduce((acc, curr) => acc + (Number(curr.fuelCost) || 0), 0);
    const totalMaintenanceCost = machineLogs.reduce(
      (acc, curr) => acc + (Number(curr.maintenanceCost) || 0),
      0
    );
    const totalOperatingCost = totalFuelCost + totalMaintenanceCost;

    return {
      machineId: m.id,
      machineName: m.name,
      machineType: m.type,
      registrationNumber: m.registrationNumber,
      fuelType: m.fuelType,
      active: m.active,
      totalUsageCount,
      totalHoursUsed: Math.round(totalHoursUsed * 100) / 100,
      totalFuelCost,
      totalMaintenanceCost,
      totalOperatingCost,
    };
  });
}

/**
 * Aggregate machinery consumption report grouped per plot.
 */
export function getPlotMachineryConsumptionReport(): PlotMachineReportSummary[] {
  const plots = getPlots();
  const logs = getMachineUsageLogs();

  return plots.map((p) => {
    const plotLogs = logs.filter((l) => l.plotId === p.id);
    const totalUsageCount = plotLogs.length;
    const totalHoursUsed = plotLogs.reduce((acc, curr) => acc + (Number(curr.hoursUsed) || 0), 0);
    const totalFuelCost = plotLogs.reduce((acc, curr) => acc + (Number(curr.fuelCost) || 0), 0);
    const totalMaintenanceCost = plotLogs.reduce(
      (acc, curr) => acc + (Number(curr.maintenanceCost) || 0),
      0
    );
    const totalOperatingCost = totalFuelCost + totalMaintenanceCost;

    // Group by machine inside this plot
    const machineMap: Record<string, { machineName: string; hoursUsed: number; operatingCost: number }> =
      {};
    for (const l of plotLogs) {
      if (!machineMap[l.machineId]) {
        machineMap[l.machineId] = {
          machineName: l.machineName || "Machine",
          hoursUsed: 0,
          operatingCost: 0,
        };
      }
      machineMap[l.machineId].hoursUsed += Number(l.hoursUsed) || 0;
      machineMap[l.machineId].operatingCost +=
        (Number(l.fuelCost) || 0) + (Number(l.maintenanceCost) || 0);
    }

    const machineBreakdown = Object.entries(machineMap).map(([machineId, data]) => ({
      machineId,
      machineName: data.machineName,
      hoursUsed: Math.round(data.hoursUsed * 100) / 100,
      operatingCost: data.operatingCost,
    }));

    return {
      plotId: p.id,
      plotName: p.name,
      totalUsageCount,
      totalHoursUsed: Math.round(totalHoursUsed * 100) / 100,
      totalFuelCost,
      totalMaintenanceCost,
      totalOperatingCost,
      machineBreakdown,
    };
  });
}

export function addMachineUsageLog(...args: Parameters<typeof addMachineUsageLogImpl>) {
  return withTransaction(() => addMachineUsageLogImpl(...args));
}

export function updateMachineUsageLog(...args: Parameters<typeof updateMachineUsageLogImpl>) {
  return withTransaction(() => updateMachineUsageLogImpl(...args));
}

export function deleteMachineUsageLog(...args: Parameters<typeof deleteMachineUsageLogImpl>) {
  return withTransaction(() => deleteMachineUsageLogImpl(...args));
}

export function deleteMachine(...args: Parameters<typeof deleteMachineImpl>) {
  return withTransaction(() => deleteMachineImpl(...args));
}
