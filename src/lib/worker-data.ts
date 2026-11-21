import { csvDocument } from './csv';
import { assertRecordId } from "./validation";
import { employeeDailyRate } from './payroll';
import { validateAllocation, ValidationError, referenceExists } from './validation';
import { randomUUID } from "node:crypto";
import { withTransaction } from "./db-storage";
import { addCropExpense,deleteCropExpense,getCropCycleById } from "./crop-cycle-data";
import {
getDatabase,
saveDatabase,
WageEntryItem,
WagePaidStatus,
WorkerActivityLogItem,
WorkerAttendanceItem,
WorkerAttendanceStatus,
WorkerItem,
} from "./db-storage";
import { getPlots } from "./master-data";
import { dateKey,finiteNumber,oneOf,requiredText } from "./validation";

export interface MonthlyWorkerSummaryRow {
  workerId: string;
  workerName: string;
  role: string;
  dailyWageRate: number;
  totalDaysRecorded: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercent: number;
  totalHoursWorked: number;
  totalWagesEarned: number;
  totalWagesPaid: number;
  balanceDue: number;
}

/**
 * Get all workers, optionally filtered by active status.
 */
export function getWorkers(filters?: { activeOnly?: boolean }): WorkerItem[] {
  return withTransaction(() => {
  const db = getDatabase();
  let modified = false;

  if (db.employees && db.employees.length > 0) {
    if (!db.workers) db.workers = [];

    for (const emp of db.employees) {
      if (typeof emp.name !== "string" || !emp.name.trim()) continue;
      const dailyRate = employeeDailyRate(emp);
      const isActive = emp.status === "ACTIVE";
      const existingIdx = db.workers.findIndex((w) => w.id === emp.id);
      if (existingIdx === -1) {
        db.workers.push({
          id: emp.id,
          name: emp.name,
          phone: emp.phone,
          role: emp.roleName || "General Field Worker",
          dailyWageRate: dailyRate,
          active: isActive,
          createdAt: emp.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        modified = true;
      } else {
        const w = db.workers[existingIdx];
        if (
          w.id !== emp.id ||
          w.name !== emp.name ||
          w.dailyWageRate !== dailyRate ||
          w.active !== isActive ||
          w.role !== (emp.roleName || "General Field Worker") ||
          w.phone !== emp.phone
        ) {
          db.workers[existingIdx] = {
            ...w,
            id: emp.id,
            name: emp.name,
            phone: emp.phone,
            role: emp.roleName || "General Field Worker",
            dailyWageRate: dailyRate,
            active: isActive,
            updatedAt: new Date().toISOString(),
          };
          modified = true;
        }
      }
    }

    if (modified) {
      saveDatabase(db);
    }

  }

  let workers = db.workers || [];
  if (filters?.activeOnly) {
    workers = workers.filter((w) => w.active);
  }
  return workers;

  });
}

/**
 * Get worker by ID.
 */
export function getWorkerById(id: string): WorkerItem | undefined {
  const db = getDatabase();
  return (db.workers || []).find((w) => w.id === id);
}

/**
 * Create a new worker.
 */
export function createWorker(data: {
  name: string;
  phone?: string;
  role?: string;
  dailyWageRate: number;
  active?: boolean;
}): WorkerItem {
  return withTransaction(() => {
  if (!data.name || !data.name.trim()) {
    throw new Error("Worker name is required.");
  }
  data.dailyWageRate = finiteNumber(data.dailyWageRate, "Daily wage rate");
  if (data.dailyWageRate === undefined || data.dailyWageRate < 0) {
    throw new Error("Valid daily wage rate is required.");
  }

  const db = getDatabase();
  if (!db.workers) db.workers = [];

  const now = new Date().toISOString();
  const newWorker: WorkerItem = {
    id: `w_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    phone: data.phone?.trim() || undefined,
    role: data.role?.trim() || "General Field Worker",
    dailyWageRate: Number(data.dailyWageRate),
    active: data.active !== undefined ? data.active : true,
    createdAt: now,
    updatedAt: now,
  };

  db.workers.push(newWorker);
  saveDatabase(db);
  return newWorker;

  });
}

/**
 * Update worker details.
 */
export function updateWorker(
  id: string,
  data: Partial<WorkerItem>
): WorkerItem | undefined {
  return withTransaction(() => {
  assertRecordId(id, data);
  if (data.name !== undefined) data.name = requiredText(data.name, "Worker name");
  if (data.dailyWageRate !== undefined) data.dailyWageRate = finiteNumber(data.dailyWageRate, "Daily wage rate");
  if (data.id !== undefined && data.id !== id) throw new Error("Worker ID cannot be changed.");
  const db = getDatabase();
  if (!db.workers) return undefined;

  const idx = db.workers.findIndex((w) => w.id === id);
  if (idx < 0) return undefined;

  const updated: WorkerItem = {
    ...db.workers[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  db.workers[idx] = updated;
  saveDatabase(db);
  return updated;

  });
}

/**
 * Delete a worker and associated logs.
 */
function deleteWorkerImpl(id: string): boolean {
  const db = getDatabase();
  if ((db.wages || []).some(wage => wage.employeeId === id && wage.status === 'PAID') || (db.wageEntries || []).some(wage => wage.workerId === id && Number(wage.paidAmount) > 0)) return false;
  let modified = false;
  const mirrored = new Set((db.wageEntries || []).filter(wage => wage.workerId === id).map(wage => `wage_${wage.id}`));
  db.cropExpenses = (db.cropExpenses || []).filter(expense => !mirrored.has(expense.sourceRefId || ''));

  if (db.workers) {
    const initialCount = db.workers.length;
    db.workers = db.workers.filter((w) => w.id !== id);
    if (db.workers.length < initialCount) modified = true;
  }
  if (db.employees) {
    const initialEmpCount = db.employees.length;
    db.employees = db.employees.filter((e) => e.id !== id);
    if (db.employees.length < initialEmpCount) modified = true;
  }
  if (db.attendance) {
    db.attendance = db.attendance.filter((a) => a.employeeId !== id);
  }
  if (db.wages) {
    db.wages = db.wages.filter((w) => w.employeeId !== id);
  }
  if (db.leaves) {
    db.leaves = db.leaves.filter((l) => l.employeeId !== id);
  }
  if (db.workerAttendances) {
    db.workerAttendances = db.workerAttendances.filter((a) => a.workerId !== id);
  }
  if (db.workerActivityLogs) {
    db.workerActivityLogs = db.workerActivityLogs.filter((a) => a.workerId !== id);
  }
  if (db.wageEntries) {
    db.wageEntries = db.wageEntries.filter((we) => we.workerId !== id);
  }

  saveDatabase(db);
  return modified;
}

/**
 * Pure calculation helper: calculates hours worked and computed amount from wage rate and status.
 */
export function calculateWageForAttendance(
  dailyWageRate: number,
  status: WorkerAttendanceStatus,
  hoursWorked?: number,
  manualOverrideAmount?: number
): { hoursWorked: number; computedAmount: number } {
  if (status === "ABSENT" || status === "LEAVE") {
    return {
      hoursWorked: 0,
      computedAmount: 0,
    };
  }

  if (manualOverrideAmount !== undefined && manualOverrideAmount !== null) {
    const hours =
      hoursWorked !== undefined && hoursWorked >= 0
        ? hoursWorked
        : status === "HALF_DAY"
        ? 4
        : 8;
    return {
      hoursWorked: hours,
      computedAmount: Number(manualOverrideAmount),
    };
  }

  if (status === "HALF_DAY") {
    const hours = hoursWorked !== undefined && hoursWorked >= 0 ? hoursWorked : 4;
    // If specific hours provided other than 4, compute proportionally based on 8hr day
    const computed =
      hoursWorked !== undefined && hoursWorked >= 0
        ? Math.round((dailyWageRate / 8) * hours * 100) / 100
        : Math.round(dailyWageRate * 0.5 * 100) / 100;
    return {
      hoursWorked: hours,
      computedAmount: computed,
    };
  }

  // PRESENT
  const hours = hoursWorked !== undefined && hoursWorked >= 0 ? hoursWorked : 8;
  const computed =
    hoursWorked !== undefined && hoursWorked >= 0 && hoursWorked !== 8
      ? Math.round((dailyWageRate / 8) * hours * 100) / 100
      : dailyWageRate;

  return {
    hoursWorked: hours,
    computedAmount: computed,
  };
}

/**
 * Syncs a WageEntry into Prompt 2's CropExpense table under the "LABOR" category.
 * Idempotent: updates existing expense if sourceRefId matches, or creates one.
 * If cropCycleId is null, removes any previously linked expense.
 */
export function syncWageToCropExpense(wageEntry: WageEntryItem): void {
  return withTransaction(() => {
  const db = getDatabase();
  const sourceRefId = `wage_${wageEntry.id}`;

  if (!wageEntry.cropCycleId) {
    // Unlinked from crop cycle -> delete any existing synced expense
    if (db.cropExpenses) {
      const existing = db.cropExpenses.find((e) => e.sourceRefId === sourceRefId);
      if (existing) {
        deleteCropExpense(existing.id);
      }
    }
    return;
  }

  const cycle = getCropCycleById(wageEntry.cropCycleId);
  if (!cycle) return;

  const worker = getWorkerById(wageEntry.workerId);
  const workerName = worker?.name || wageEntry.workerName || "Worker";
  const desc = `Field Labor: ${workerName} (${wageEntry.date})`;

  if (!db.cropExpenses) db.cropExpenses = [];
  const existingIdx = db.cropExpenses.findIndex((e) => e.sourceRefId === sourceRefId);

  if (existingIdx >= 0) {
    // Update in-place
    db.cropExpenses[existingIdx].cropCycleId = wageEntry.cropCycleId;
    db.cropExpenses[existingIdx].amount = wageEntry.computedAmount;
    db.cropExpenses[existingIdx].date = wageEntry.date;
    db.cropExpenses[existingIdx].description = desc;
    db.cropExpenses[existingIdx].updatedAt = new Date().toISOString();
    saveDatabase(db);
  } else {
    // Create new
    addCropExpense({
      cropCycleId: wageEntry.cropCycleId,
      category: "LABOR",
      amount: wageEntry.computedAmount,
      date: wageEntry.date,
      description: desc,
      sourceRefId: sourceRefId,
    });
  }

  });
}

/**
 * Upsert attendance and auto-calculate wage entry in perfect lockstep.
 * Prevents double attendance entries for same worker+date.
 */
function upsertWorkerAttendanceAndWageImpl(data: {
  workerId: string;
  date: string;
  status: WorkerAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
  notes?: string;
  cropCycleId?: string | null;
  manualWageOverride?: number;
}): { attendance: WorkerAttendanceItem; wage: WageEntryItem } {
  dateKey(data.date);
  oneOf(data.status, ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"], "Attendance status");
  if (data.hoursWorked !== undefined) finiteNumber(data.hoursWorked, "Hours worked");
  if (data.manualWageOverride !== undefined) finiteNumber(data.manualWageOverride, "Wage override");
  const worker = getWorkerById(data.workerId);
  if (!worker) {
    throw new Error(`Worker with ID ${data.workerId} not found.`);
  }
  if (!data.date) {
    throw new Error("Date is required.");
  }

  const db = getDatabase();
  if (!db.workerAttendances) db.workerAttendances = [];
  if (!db.wageEntries) db.wageEntries = [];
  validateAllocation(db, undefined, data.cropCycleId);

  const now = new Date().toISOString();

  // 1. Calculate hours & wage
  const { hoursWorked, computedAmount } = calculateWageForAttendance(
    worker.dailyWageRate,
    data.status,
    data.hoursWorked,
    data.manualWageOverride
  );
  const paidEntry = db.wageEntries.find(entry => entry.workerId === data.workerId && entry.date === data.date);
  if (Number(paidEntry?.paidAmount) > computedAmount) throw new ValidationError('Attendance cannot reduce earned wages below the amount already paid. Record a payment correction first.');

  // 2. Upsert Attendance
  const existingAttIdx = db.workerAttendances.findIndex(
    (a) => a.workerId === data.workerId && a.date === data.date
  );

  let attendance: WorkerAttendanceItem;
  if (existingAttIdx >= 0) {
    attendance = {
      ...db.workerAttendances[existingAttIdx],
      workerName: worker.name,
      status: data.status,
      checkInTime: data.checkInTime !== undefined ? data.checkInTime : db.workerAttendances[existingAttIdx].checkInTime,
      checkOutTime: data.checkOutTime !== undefined ? data.checkOutTime : db.workerAttendances[existingAttIdx].checkOutTime,
      hoursWorked: hoursWorked,
      notes: data.notes !== undefined ? data.notes : db.workerAttendances[existingAttIdx].notes,
      updatedAt: now,
    };
    db.workerAttendances[existingAttIdx] = attendance;
  } else {
    attendance = {
      id: `wa_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
      workerId: data.workerId,
      workerName: worker.name,
      date: data.date,
      status: data.status,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      hoursWorked: hoursWorked,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    db.workerAttendances.push(attendance);
  }

  // 3. Upsert WageEntry
  const existingWageIdx = db.wageEntries.findIndex(
    (w) => w.workerId === data.workerId && w.date === data.date
  );

  let wage: WageEntryItem;
  if (existingWageIdx >= 0) {
    const prev = db.wageEntries[existingWageIdx];
    const cropCycleId = data.cropCycleId !== undefined ? data.cropCycleId : prev.cropCycleId;
    
    // Determine paid status based on current paid amount and newly computed amount
    let paidStatus: WagePaidStatus = prev.paidStatus;
    if (prev.paidAmount >= computedAmount && computedAmount > 0) {
      paidStatus = "PAID";
    } else if (prev.paidAmount > 0 && prev.paidAmount < computedAmount) {
      paidStatus = "PARTIAL";
    } else if (prev.paidAmount === 0) {
      paidStatus = "UNPAID";
    }

    wage = {
      ...prev,
      workerName: worker.name,
      computedAmount,
      paidStatus,
      cropCycleId,
      updatedAt: now,
    };
    db.wageEntries[existingWageIdx] = wage;
  } else {
    wage = {
      id: `we_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
      workerId: data.workerId,
      workerName: worker.name,
      date: data.date,
      computedAmount,
      paidStatus: "UNPAID",
      paidAmount: 0,
      paidDate: null,
      cropCycleId: data.cropCycleId || null,
      paymentNotes: null,
      createdAt: now,
      updatedAt: now,
    };
    db.wageEntries.push(wage);
  }

  // 4. Synchronize to db.attendance for HR & Salary Calculator
  if (!db.attendance) db.attendance = [];
  const existingAttRecordIdx = db.attendance.findIndex(
    (a) => a.employeeId === data.workerId && a.attendanceDate === data.date
  );
  if (existingAttRecordIdx >= 0) {
    db.attendance[existingAttRecordIdx] = {
      ...db.attendance[existingAttRecordIdx],
      employeeName: worker.name,
      status: data.status,
      notes: data.notes,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
    };
  } else {
    db.attendance.push({
      id: `att_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
      employeeId: data.workerId,
      employeeName: worker.name,
      attendanceDate: data.date,
      status: data.status,
      notes: data.notes,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      createdAt: now,
    });
  }

  saveDatabase(db);

  // 5. Auto-sync to CropExpense if linked to a crop cycle
  syncWageToCropExpense(wage);

  return { attendance, wage };
}

/**
 * Get full attendance sheet for a chosen date across all active workers.
 */
export function getDailyAttendanceSheet(date: string) {
  const db = getDatabase();
  const allWorkers = db.workers || [];
  const attendances = (db.workerAttendances || []).filter((a) => a.date === date);
  const wages = (db.wageEntries || []).filter((w) => w.date === date);
  const activities = (db.workerActivityLogs || []).filter((al) => {
    // Check if dailyLog matches date
    const dl = (db.dailyLogs || []).find((d) => d.id === al.dailyLogId);
    return dl ? dl.date === date : false;
  });

  // Calculate if the selected date is Sunday
  const dObj = new Date(date + "T00:00:00");
  const isSunday = dObj.getDay() === 0;

  const workerRows = allWorkers.map((w) => {
    let att = attendances.find((a) => a.workerId === w.id);
    let wage = wages.find((wg) => wg.workerId === w.id);
    const workerActivities = activities.filter((act) => act.workerId === w.id);

    // Sundays are calculated as just leave (weekly off): no salary, no absent mark
    if (!att && isSunday) {
      att = {
        id: `sunday_leave_${w.id}_${date}`,
        workerId: w.id,
        date: date,
        status: "LEAVE",
        hoursWorked: 0,
        notes: "Sunday (Weekly Off / Leave)",
        createdAt: date,
        updatedAt: date,
      };
      if (!wage) {
        wage = {
          id: `sunday_wage_${w.id}_${date}`,
          workerId: w.id,
          workerName: w.name,
          date: date,
          computedAmount: 0,
          paidStatus: "UNPAID",
          paidAmount: 0,
          paidDate: null,
          cropCycleId: null,
          paymentNotes: "Sunday Weekly Off (Leave)",
          createdAt: date,
          updatedAt: date,
        };
      }
    }

    return {
      ...w,
      attendance: att,
      wage: wage,
      activities: workerActivities,
    };
  });

  let presentCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let totalHoursWorked = 0;
  let totalWagesComputed = 0;

  for (const row of workerRows) {
    if (row.attendance) {
      if (row.attendance.status === "PRESENT") presentCount++;
      else if (row.attendance.status === "HALF_DAY") halfDayCount++;
      else if (row.attendance.status === "ABSENT") absentCount++;
      else if (row.attendance.status === "LEAVE") leaveCount++;

      totalHoursWorked += Number(row.attendance.hoursWorked) || 0;
    }
    if (row.wage) {
      totalWagesComputed += Number(row.wage.computedAmount) || 0;
    }
  }

  return {
    date,
    isSunday,
    workers: workerRows,
    summary: {
      totalWorkers: allWorkers.length,
      activeWorkers: allWorkers.filter((w) => w.active).length,
      presentCount,
      halfDayCount,
      absentCount,
      leaveCount,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      totalWagesComputed,
    },
  };
}

/**
 * Log specific activities completed by a worker under a DailyLog and Plot.
 */
export function addWorkerActivityLog(data: {
  workerId: string;
  dailyLogId: string;
  plotId: string;
  cropCycleId?: string | null;
  activityDescription: string;
  timeSpentHours?: number;
}): WorkerActivityLogItem {
  return withTransaction(() => {
  const worker = getWorkerById(data.workerId);
  if (!worker) {
    throw new Error(`Worker with ID ${data.workerId} not found.`);
  }
  if (!data.dailyLogId) {
    throw new Error("dailyLogId is required.");
  }
  if (!data.plotId) {
    throw new Error("plotId is required.");
  }
  if (!data.activityDescription || !data.activityDescription.trim()) {
    throw new Error("Activity description is required.");
  }

  const db = getDatabase();
  if (!db.workerActivityLogs) db.workerActivityLogs = [];
  referenceExists(data.dailyLogId, db.dailyLogs || [], 'Daily log');
  validateAllocation(db, data.plotId, data.cropCycleId);
  const parentLog = db.dailyLogs!.find(log => log.id === data.dailyLogId)!;
  if (parentLog.plotId !== data.plotId) throw new ValidationError('Daily log does not belong to the selected plot.');
  const timeSpentHours = finiteNumber(data.timeSpentHours, 'Time spent', 0, 8);

  const plots = getPlots();
  const plot = plots.find((p) => p.id === data.plotId);
  const cycle = data.cropCycleId ? getCropCycleById(data.cropCycleId) : undefined;

  const now = new Date().toISOString();
  const newActivity: WorkerActivityLogItem = {
    id: `wal_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
    workerId: data.workerId,
    workerName: worker.name,
    dailyLogId: data.dailyLogId,
    plotId: data.plotId,
    plotName: plot ? plot.name : "Plot",
    cropCycleId: data.cropCycleId || null,
    cropName: cycle ? cycle.cropName : undefined,
    activityDescription: data.activityDescription.trim(),
    timeSpentHours,
    createdAt: now,
    updatedAt: now,
  };

  db.workerActivityLogs.unshift(newActivity);
  saveDatabase(db);
  return newActivity;

  });
}

/**
 * Get worker activity logs with optional filters.
 */
export function getWorkerActivityLogs(filters?: {
  workerId?: string;
  dailyLogId?: string;
  plotId?: string;
  cropCycleId?: string;
}): WorkerActivityLogItem[] {
  const db = getDatabase();
  let logs = db.workerActivityLogs || [];

  if (filters?.workerId) {
    logs = logs.filter((l) => l.workerId === filters.workerId);
  }
  if (filters?.dailyLogId) {
    logs = logs.filter((l) => l.dailyLogId === filters.dailyLogId);
  }
  if (filters?.plotId) {
    logs = logs.filter((l) => l.plotId === filters.plotId);
  }
  if (filters?.cropCycleId) {
    logs = logs.filter((l) => l.cropCycleId === filters.cropCycleId);
  }

  return logs;
}

/**
 * Delete a worker activity log.
 */
export function deleteWorkerActivityLog(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.workerActivityLogs) return false;

  const initial = db.workerActivityLogs.length;
  db.workerActivityLogs = db.workerActivityLogs.filter((l) => l.id !== id);
  saveDatabase(db);
  return db.workerActivityLogs.length < initial;

  });
}

/**
 * Record a wage payment (supports partial or full settlement).
 */
export function recordWagePayment(
  wageId: string,
  data: {
    paidAmount: number;
    paidDate?: string;
    paymentNotes?: string;
  }
): WageEntryItem | undefined {
  return withTransaction(() => {
  data.paidAmount = finiteNumber(data.paidAmount, "Payment amount");
  if (data.paidDate) dateKey(data.paidDate, "Payment date");
  const db = getDatabase();
  if (!db.wageEntries) return undefined;

  const idx = db.wageEntries.findIndex((w) => w.id === wageId);
  if (idx < 0) return undefined;

  const current = db.wageEntries[idx];
  const newPaidAmount = Number(data.paidAmount);
  if (newPaidAmount > current.computedAmount) throw new ValidationError('Payment cannot exceed the computed wage.');

  let paidStatus: WagePaidStatus = "UNPAID";
  if (newPaidAmount >= current.computedAmount && current.computedAmount > 0) {
    paidStatus = "PAID";
  } else if (newPaidAmount > 0) {
    paidStatus = "PARTIAL";
  }

  const updated: WageEntryItem = {
    ...current,
    paidAmount: newPaidAmount,
    paidStatus,
    paidDate: data.paidDate || new Date().toISOString().split("T")[0],
    paymentNotes: data.paymentNotes?.trim() || current.paymentNotes,
    updatedAt: new Date().toISOString(),
  };

  db.wageEntries[idx] = updated;
  saveDatabase(db);
  return updated;

  });
}

/**
 * Get wage register with date range and status filters.
 */
export function getWageRegister(filters?: {
  startDate?: string;
  endDate?: string;
  workerId?: string;
  paidStatus?: WagePaidStatus | "ALL";
}) {
  const db = getDatabase();
  let entries = db.wageEntries || [];

  if (filters?.startDate) {
    entries = entries.filter((e) => e.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    entries = entries.filter((e) => e.date <= filters.endDate!);
  }
  if (filters?.workerId && filters.workerId !== "ALL") {
    entries = entries.filter((e) => e.workerId === filters.workerId);
  }
  if (filters?.paidStatus && filters.paidStatus !== "ALL") {
    entries = entries.filter((e) => e.paidStatus === filters.paidStatus);
  }

  // Attach fresh worker names and plot/cycle info
  const workers = db.workers || [];
  const cycles = db.cropCycles || [];

  const enriched = entries.map((e) => {
    const worker = workers.find((w) => w.id === e.workerId);
    const cycle = e.cropCycleId ? cycles.find((c) => c.id === e.cropCycleId) : undefined;
    return {
      ...e,
      workerName: worker ? worker.name : e.workerName || "Worker",
      workerRole: worker?.role,
      cropCycleName: cycle ? cycle.cropName : undefined,
      balance: Math.max(0, Number(e.computedAmount) - Number(e.paidAmount)),
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalComputed = enriched.reduce((sum, e) => sum + (Number(e.computedAmount) || 0), 0);
  const totalPaid = enriched.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);
  const totalBalance = Math.max(0, totalComputed - totalPaid);

  return {
    entries: enriched,
    totalComputed,
    totalPaid,
    totalBalance,
  };
}

/**
 * Monthly worker summary: attendance %, total hours, total wages earned, total paid, balance due.
 * Generates structured metrics and ready-to-download CSV string.
 */
export function getMonthlyWorkerSummary(year: number, month: number) {
  const db = getDatabase();
  const workers = db.workers || [];
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const monthAttendances = (db.workerAttendances || []).filter((a) =>
    a.date.startsWith(monthPrefix)
  );
  const monthWages = (db.wageEntries || []).filter((w) =>
    w.date.startsWith(monthPrefix)
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  let maxDayToCheck = daysInMonth;
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    maxDayToCheck = 0;
  } else if (year === currentYear && month === currentMonth) {
    maxDayToCheck = currentDay;
  }

  const summaries: MonthlyWorkerSummaryRow[] = workers.map((w) => {
    const workerAtts = monthAttendances.filter((a) => a.workerId === w.id);
    const workerWages = monthWages.filter((wg) => wg.workerId === w.id);

    // Calculate unrecorded Sundays for this worker (only elapsed Sundays)
    let unrecordedSundays = 0;
    for (let d = 1; d <= maxDayToCheck; d++) {
      const dObj = new Date(year, month - 1, d);
      if (dObj.getDay() === 0) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (!workerAtts.some((a) => a.date === dateStr)) {
          unrecordedSundays++;
        }
      }
    }

    const presentDays = workerAtts.filter((a) => a.status === "PRESENT").length;
    const halfDays = workerAtts.filter((a) => a.status === "HALF_DAY").length;
    const absentDays = workerAtts.filter((a) => a.status === "ABSENT").length;
    // Sundays calculate as just leave; leaves receive no salary and are NOT marked absent
    const leaveDays = workerAtts.filter((a) => a.status === "LEAVE").length + unrecordedSundays;
    const totalDaysRecorded = workerAtts.length + unrecordedSundays;

    // Attendance % formula: based on working days (present + half + absent), leaves do not penalize as absences
    const workingDaysCount = presentDays + halfDays + absentDays;
    const attendancePercent =
      workingDaysCount > 0
        ? Math.round(((presentDays + halfDays * 0.5) / workingDaysCount) * 1000) / 10
        : 0;

    const totalHoursWorked = workerAtts.reduce(
      (sum, a) => sum + (Number(a.hoursWorked) || 0),
      0
    );
    const totalWagesEarned = workerWages.reduce(
      (sum, wg) => sum + (Number(wg.computedAmount) || 0),
      0
    );
    const totalWagesPaid = workerWages.reduce(
      (sum, wg) => sum + (Number(wg.paidAmount) || 0),
      0
    );
    const balanceDue = Math.max(0, totalWagesEarned - totalWagesPaid);

    return {
      workerId: w.id,
      workerName: w.name,
      role: w.role || "Worker",
      dailyWageRate: w.dailyWageRate,
      totalDaysRecorded,
      presentDays,
      halfDays,
      absentDays,
      leaveDays,
      attendancePercent,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      totalWagesEarned,
      totalWagesPaid,
      balanceDue,
    };
  });

  const estateTotals = {
    totalHours: summaries.reduce((s, r) => s + r.totalHoursWorked, 0),
    totalWagesEarned: summaries.reduce((s, r) => s + r.totalWagesEarned, 0),
    totalWagesPaid: summaries.reduce((s, r) => s + r.totalWagesPaid, 0),
    totalBalanceDue: summaries.reduce((s, r) => s + r.balanceDue, 0),
  };

  // Generate CSV text
  const headers = [
    "Worker ID",
    "Worker Name",
    "Role / Skill",
    "Daily Wage Rate (₹)",
    "Days Recorded",
    "Present Days",
    "Half Days",
    "Absent Days",
    "Leave Days",
    "Attendance %",
    "Total Hours Worked",
    "Wages Earned (₹)",
    "Wages Paid (₹)",
    "Balance Due (₹)",
  ];

  const csvRows = summaries.map((r) => [
    r.workerId,
    r.workerName,
    r.role,
    r.dailyWageRate,
    r.totalDaysRecorded,
    r.presentDays,
    r.halfDays,
    r.absentDays,
    r.leaveDays,
    `${r.attendancePercent}%`,
    r.totalHoursWorked,
    r.totalWagesEarned,
    r.totalWagesPaid,
    r.balanceDue,
  ]);

  // Append estate total row
  csvRows.push([
    'TOTAL',
    `All Workers (${summaries.length})`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    estateTotals.totalHours,
    estateTotals.totalWagesEarned,
    estateTotals.totalWagesPaid,
    estateTotals.totalBalanceDue,
  ]);

  const csvString = csvDocument(headers, csvRows);

  return {
    year,
    month,
    monthName: new Date(year, month - 1, 1).toLocaleString("default", { month: "long" }),
    summaries,
    estateTotals,
    csvString,
  };
}

export function upsertWorkerAttendanceAndWage(...args: Parameters<typeof upsertWorkerAttendanceAndWageImpl>) {
  return withTransaction(() => upsertWorkerAttendanceAndWageImpl(...args));
}

export function deleteWorker(...args: Parameters<typeof deleteWorkerImpl>) {
  return withTransaction(() => deleteWorkerImpl(...args));
}
