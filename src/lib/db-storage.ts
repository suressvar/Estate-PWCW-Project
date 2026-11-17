import fs from "node:fs";
import path from "node:path";

import type { EstateDatabase } from "@/types/storage";
import { DEFAULT_PURCHASE_CATEGORIES } from "../types/estate.ts";
import { DEFAULT_CROP_CATEGORIES, DEFAULT_GROUP_TYPES, DEFAULT_SALES_CATEGORIES, DEFAULT_UNITS, defaultSeedData, emptyDatabaseState } from "./storage/defaults.ts";

// Preserve existing imports while keeping contracts and seed data out of the storage engine.
export type {
  BaseLog, CropItem, DieselLogItem, FertilizerLogItem,
  MachineryLogItem, PartyItem, PartyType, PlotCropAssociation,
  PlotItem, ProductionLogItem, VoucherLineItem,
} from "@/types/estate";
export type {
  ActivityType, AttendanceRecord, AttendanceStatus, CropCycleItem, CropCycleStatus, CropExpenseCategory, CropExpenseItem,
  CropIncomeItem, CropIncomeSource, DailyLogItem, DailyLogStatus,
  EmployeeItem, EmployeeRoleItem, EmployeeStatus, EstateDatabase,
  ExpenseCategory, ExpenseLedgerItem, ExpenseUnit,
  FeedPurchase, GeneralExpenseItem, GeneralPurchaseLogItem, GodownItem,
  GodownStockMovement, GroupType, InventoryType, LaborLogItem,
  LeaveRecord, LeaveStatus, LeaveType, LedgerGroupItem,
  MachineItem, MachineType, MachineUsageLogItem, ManualStockValuationItem,
  MedicinePurchase, OperationItem, OtherSaleItem, OtherVoucher,
  PettyCashLedgerItem, PnLSide, PurchaseVoucherItem, SalesLogItem,
  StockInventoryItem, VaccinePurchase, WageEntryItem, WagePaidStatus,
  WageRecord, WageStatus, WageType, WorkActivityItem,
  WorkerActivityLogItem, WorkerAttendanceItem, WorkerAttendanceStatus, WorkerItem,
} from "@/types/storage";
export { DEFAULT_PURCHASE_CATEGORIES } from "../types/estate.ts";
export { DEFAULT_CROP_CATEGORIES, DEFAULT_GROUP_TYPES, DEFAULT_SALES_CATEGORIES, DEFAULT_SEED_PARTIES, DEFAULT_UNITS } from "./storage/defaults.ts";


// In-memory cache
let cachedDb: EstateDatabase | null = null;

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "estate-storage.json");
const TMP_FILE = path.join(DATA_DIR, "estate-storage.tmp");

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error("Error creating data directory", e);
    }
  }
}

let lastStorageMtime = 0;
let transactionDepth = 0;
let pendingDatabase: EstateDatabase | null = null;
let writeLockHeld = false;
const LOCK_FILE = path.join(DATA_DIR, 'estate-storage.lock');

function acquireWriteLock(): () => void {
  if (writeLockHeld) return () => { };
  ensureDataDirectory();
  let handle: number;
  for (let attempt = 0;;attempt++) {
    try { handle = fs.openSync(LOCK_FILE, 'wx'); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (attempt >= 200) throw new Error('Estate storage is busy. Try again. If a previous process stopped unexpectedly, stop all app processes before removing the storage lock.');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }
  }
  writeLockHeld = true;
  return () => {
    try { fs.closeSync(handle); fs.unlinkSync(LOCK_FILE); }
    finally { writeLockHeld = false; }
  };
}

/** A synchronous business operation commits once; errors restore its snapshot. */
export function withTransaction<T>(work: () => T): T {
  if (transactionDepth > 0) return work();
  const release = acquireWriteLock();
  let before: EstateDatabase | null = null;
  try {
    // Read the latest commit after acquiring the cross-process writer lock.
    cachedDb = null;
    before = structuredClone(getDatabase());
    transactionDepth = 1;
    const result = work();
    transactionDepth = 0;
    const pending = pendingDatabase;
    pendingDatabase = null;
    if (pending) saveDatabase(pending);
    return result;
  } catch (error) {
    transactionDepth = 0;
    pendingDatabase = null;
    cachedDb = before;
    throw error;
  } finally { release(); }
}

export function getDatabase(): EstateDatabase {
  if (transactionDepth > 0 && cachedDb) return cachedDb;
  ensureDataDirectory();

  if (fs.existsSync(STORAGE_FILE)) {
    try {
      const stat = fs.statSync(STORAGE_FILE);
      if (cachedDb && stat.mtimeMs === lastStorageMtime) {
        return cachedDb;
      }
      const raw = fs.readFileSync(STORAGE_FILE, "utf8");
      if (!raw.trim()) throw new Error('Empty storage file.');
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid storage root.');
        for (const [key, value] of Object.entries(emptyDatabaseState)) {
          if (Array.isArray(value) && parsed[key] !== undefined && !Array.isArray(parsed[key])) throw new Error(`Invalid storage collection: ${key}`);
        }
        const dbObj: EstateDatabase = { ...structuredClone(emptyDatabaseState), ...parsed };
        if (!parsed.cropCategories || !Array.isArray(parsed.cropCategories) || parsed.cropCategories.length === 0) {
          const existingCropTypes = (dbObj.crops || []).map((c) => c.type).filter(Boolean);
          dbObj.cropCategories = Array.from(new Set([...DEFAULT_CROP_CATEGORIES, ...existingCropTypes]));
        }
        if (!parsed.groupTypes || !Array.isArray(parsed.groupTypes) || parsed.groupTypes.length === 0) {
          const existingGroupTypes = (dbObj.ledgerGroups || []).map((g) => g.groupType).filter(Boolean);
          dbObj.groupTypes = Array.from(new Set([...DEFAULT_GROUP_TYPES, ...existingGroupTypes]));
        }
        if (!dbObj.purchaseCategories || !Array.isArray(dbObj.purchaseCategories) || dbObj.purchaseCategories.length === 0) {
          const existingVoucherCats = (dbObj.generalPurchaseLogs || []).map((v) => v.category).filter(Boolean);
          dbObj.purchaseCategories = Array.from(new Set([...DEFAULT_PURCHASE_CATEGORIES, ...existingVoucherCats]));
        }
        if (!dbObj.godownItems || !Array.isArray(dbObj.godownItems)) {
          dbObj.godownItems = [];
        }
        if (!dbObj.godownMovements || !Array.isArray(dbObj.godownMovements)) {
          dbObj.godownMovements = [];
        }
        if (!dbObj.dailyLogs || !Array.isArray(dbObj.dailyLogs)) {
          dbObj.dailyLogs = [];
        }
        if (!dbObj.cropCycles || !Array.isArray(dbObj.cropCycles)) {
          dbObj.cropCycles = [];
        }
        if (!dbObj.cropExpenses || !Array.isArray(dbObj.cropExpenses)) {
          dbObj.cropExpenses = [];
        }
        if (!dbObj.cropIncomes || !Array.isArray(dbObj.cropIncomes)) {
          dbObj.cropIncomes = [];
        }
        if (!dbObj.workers || !Array.isArray(dbObj.workers)) {
          dbObj.workers = [];
        }
        if (!dbObj.workerAttendances || !Array.isArray(dbObj.workerAttendances)) {
          dbObj.workerAttendances = [];
        }
        if (!dbObj.workerActivityLogs || !Array.isArray(dbObj.workerActivityLogs)) {
          dbObj.workerActivityLogs = [];
        }
        if (!dbObj.wageEntries || !Array.isArray(dbObj.wageEntries)) {
          dbObj.wageEntries = [];
        }
        if (!dbObj.machines || !Array.isArray(dbObj.machines) || dbObj.machines.length === 0) {
          dbObj.machines = [
            {
              id: "m_jd_5050",
              name: "John Deere 5050 D",
              type: "TRACTOR",
              registrationNumber: "TN-38-BZ-4412",
              fuelType: "Diesel",
              active: true,
              notes: "Main farm tractor with rotavator and trolley attachments",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "m_vst_shakti",
              name: "VST Shakti 130DI Tiller",
              type: "TILLER",
              registrationNumber: "TN-38-TR-1029",
              fuelType: "Diesel",
              active: true,
              notes: "Power tiller for inter-cultivation and weeding",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "m_aspee_sprayer",
              name: "Aspee HTP Tractor Sprayer",
              type: "SPRAYER",
              registrationNumber: "ASPEE-HTP-50",
              fuelType: "Diesel / PTO",
              active: true,
              notes: "High pressure orchard and field sprayer",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "m_kirloskar_pump",
              name: "Kirloskar 7.5HP Borewell Pump",
              type: "PUMP",
              registrationNumber: "KIRL-75-SUB",
              fuelType: "Electric",
              active: true,
              notes: "Submersible pump connected to drip irrigation network",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "m_bolero_pickup",
              name: "Mahindra Bolero Maxi Truck Plus",
              type: "VEHICLE",
              registrationNumber: "TN-38-CB-8891",
              fuelType: "Diesel",
              active: true,
              notes: "Estate produce transport and market dispatch vehicle",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }
        if (!dbObj.machineUsageLogs || !Array.isArray(dbObj.machineUsageLogs)) {
          dbObj.machineUsageLogs = [];
        }
        if (!dbObj.generalExpenses || !Array.isArray(dbObj.generalExpenses)) {
          dbObj.generalExpenses = [];
        }
        if (!dbObj.pettyCashLedger || !Array.isArray(dbObj.pettyCashLedger)) {
          dbObj.pettyCashLedger = [];
        }
        if (!dbObj.expenseUnits || !Array.isArray(dbObj.expenseUnits) || dbObj.expenseUnits.length === 0) {
          dbObj.expenseUnits = JSON.parse(JSON.stringify(DEFAULT_UNITS));
        }
        if (!dbObj.salesCategories || !Array.isArray(dbObj.salesCategories) || dbObj.salesCategories.length === 0) {
          dbObj.salesCategories = [...DEFAULT_SALES_CATEGORIES];
        }
        if (!dbObj.parties || !Array.isArray(dbObj.parties)) {
          dbObj.parties = [];
        }
        cachedDb = dbObj;
        lastStorageMtime = stat.mtimeMs;
        return cachedDb as EstateDatabase;
      }
    } catch (e) {
      console.error("Unable to read estate storage; original file preserved.", e);
      throw new Error("Estate storage is unreadable. Restore the backup before continuing; the original file has been preserved.");
    }
  }

  if (cachedDb) {
    return cachedDb;
  }

  if (!writeLockHeld) return withTransaction(() => getDatabase());
  cachedDb = JSON.parse(JSON.stringify(defaultSeedData));
  saveDatabase(cachedDb as EstateDatabase);
  return cachedDb as EstateDatabase;
}

export function saveDatabase(data: EstateDatabase) {
  if (transactionDepth > 0) { pendingDatabase = data; cachedDb = data; return; }
  const release = acquireWriteLock();
  try {
    ensureDataDirectory();
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(TMP_FILE, serialized, { encoding: "utf8", flush: true });
    if (fs.existsSync(STORAGE_FILE)) fs.copyFileSync(STORAGE_FILE, `${STORAGE_FILE}.bak`);
    // Windows scanners and sync clients can briefly hold the destination open.
    // Retry replacement without ever deleting the last committed file.
    for (let attempt = 0;;attempt++) {
      try { fs.renameSync(TMP_FILE, STORAGE_FILE); break; }
      catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (attempt >= 5 || !['EPERM', 'EACCES', 'EBUSY'].includes(code || '')) throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10 * 2 ** attempt);
      }
    }
    cachedDb = data;
    lastStorageMtime = fs.statSync(STORAGE_FILE).mtimeMs;
  } catch (error) {
    cachedDb = null;
    console.error("Estate storage save failed; last saved records were preserved.", error);
    throw new Error("Unable to save estate records. No changes were committed.");
  } finally { release(); }
}


export function resetAllData(): EstateDatabase {
  return withTransaction(() => {
    if (fs.existsSync(STORAGE_FILE)) {
      const backups = path.join(DATA_DIR, 'backups');
      fs.mkdirSync(backups, { recursive: true });
      fs.copyFileSync(STORAGE_FILE, path.join(backups, `estate-before-reset-${Date.now()}.json`));
    }
    const freshEmpty = JSON.parse(JSON.stringify(emptyDatabaseState));
    cachedDb = freshEmpty;
    saveDatabase(freshEmpty);
    return cachedDb as EstateDatabase;
  });
}

