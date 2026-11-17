import { withTransaction } from "./db-storage";
import { oneOf, referenceExists, requiredText } from './validation';
import { assertRecordId } from "./validation";
import { randomUUID } from "node:crypto";
import {
ExpenseLedgerItem,
getDatabase,
GroupType,
LedgerGroupItem,
PnLSide,
saveDatabase,
} from "./db-storage";

export type { ExpenseLedgerItem,GroupType,LedgerGroupItem,PnLSide };

export function getGroupTypes(): string[] {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.groupTypes || !Array.isArray(db.groupTypes) || db.groupTypes.length === 0) {
    db.groupTypes = ["EXPENSE", "INCOME", "ASSET", "LIABILITY"];
    saveDatabase(db);
  }
  return db.groupTypes;

  });
}

export function createGroupType(typeName: string): string {
  return withTransaction(() => {
  const trimmed = typeName.trim().toUpperCase();
  if (!trimmed) return "";
  const db = getDatabase();
  if (!db.groupTypes) {
    db.groupTypes = [];
  }
  if (!db.groupTypes.includes(trimmed)) {
    db.groupTypes.push(trimmed);
    saveDatabase(db);
  }
  return trimmed;

  });
}

export function deleteGroupType(typeName: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  const isUsed = db.ledgerGroups.some((g) => g.groupType.toUpperCase() === typeName.toUpperCase());
  if (isUsed) return false;
  if (db.groupTypes) {
    db.groupTypes = db.groupTypes.filter((t) => t.toUpperCase() !== typeName.toUpperCase());
    saveDatabase(db);
  }
  return true;

  });
}

export function getLedgerGroups(): LedgerGroupItem[] {
  return getDatabase().ledgerGroups;
}

export function getLedgerGroupById(id: string): LedgerGroupItem | undefined {
  return getDatabase().ledgerGroups.find((g) => g.id === id);
}

export function createLedgerGroup(data: Omit<LedgerGroupItem, "id" | "createdAt">): LedgerGroupItem {
  return withTransaction(() => {
  data.groupName = requiredText(data.groupName, 'Group name');
  data.pnlSide = oneOf(data.pnlSide, ['DEBIT', 'CREDIT'], 'P&L side', 'DEBIT');
  const db = getDatabase();
  const normalizedType = (data.groupType || "EXPENSE").trim().toUpperCase();

  if (normalizedType && db.groupTypes && !db.groupTypes.includes(normalizedType)) {
    db.groupTypes.push(normalizedType);
  }

  const newGroup: LedgerGroupItem = {
    ...data,
    groupType: normalizedType,
    id: `lg_${randomUUID()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  db.ledgerGroups.push(newGroup);
  saveDatabase(db);
  return newGroup;

  });
}

export function updateLedgerGroup(id: string, data: Partial<LedgerGroupItem>): LedgerGroupItem | undefined {
  return withTransaction(() => {
  assertRecordId(id, data);
  const db = getDatabase();
  if (data.groupName !== undefined) data.groupName = requiredText(data.groupName, 'Group name');
  if (data.pnlSide !== undefined) oneOf(data.pnlSide, ['DEBIT', 'CREDIT'], 'P&L side');
  const normalizedType = data.groupType ? data.groupType.trim().toUpperCase() : undefined;

  if (normalizedType && db.groupTypes && !db.groupTypes.includes(normalizedType)) {
    db.groupTypes.push(normalizedType);
  }

  db.ledgerGroups = db.ledgerGroups.map((g) => (g.id === id ? { ...g, ...data, ...(normalizedType ? { groupType: normalizedType } : {}) } : g));
  saveDatabase(db);
  return db.ledgerGroups.find((g) => g.id === id);

  });
}

export function deleteLedgerGroup(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  const isUsed = db.expenseLedgers.some((l) => l.groupId === id);
  if (isUsed) return false;
  db.ledgerGroups = db.ledgerGroups.filter((g) => g.id !== id);
  saveDatabase(db);
  return true;

  });
}

export function getExpenseLedgers(): ExpenseLedgerItem[] {
  const db = getDatabase();
  return db.expenseLedgers.map((l) => {
    const group = db.ledgerGroups.find((g) => g.id === l.groupId);
    return {
      ...l,
      groupName: group?.groupName || "General",
      groupType: group?.groupType || "EXPENSE",
    };
  });
}

export function getExpenseLedgerById(id: string): ExpenseLedgerItem | undefined {
  const db = getDatabase();
  const ledger = db.expenseLedgers.find((l) => l.id === id);
  if (!ledger) return undefined;
  const group = db.ledgerGroups.find((g) => g.id === ledger.groupId);
  return {
    ...ledger,
    groupName: group?.groupName || "General",
    groupType: group?.groupType || "EXPENSE",
  };
}

export function createExpenseLedger(data: Omit<ExpenseLedgerItem, "id" | "createdAt">): ExpenseLedgerItem {
  return withTransaction(() => {
  const db = getDatabase();
  data.ledgerName = requiredText(data.ledgerName, 'Ledger name');
  referenceExists(data.groupId, db.ledgerGroups, 'Ledger group');
  const group = db.ledgerGroups.find((g) => g.id === data.groupId);
  const newLedger: ExpenseLedgerItem = {
    ...data,
    id: `el_${randomUUID()}`,
    groupName: group?.groupName || "General",
    groupType: group?.groupType || "EXPENSE",
    createdAt: new Date().toISOString().split("T")[0],
  };
  db.expenseLedgers.push(newLedger);
  saveDatabase(db);
  return newLedger;

  });
}

export function updateExpenseLedger(id: string, data: Partial<ExpenseLedgerItem>): ExpenseLedgerItem | undefined {
  return withTransaction(() => {
  assertRecordId(id, data);
  const db = getDatabase();
  if (data.ledgerName !== undefined) data.ledgerName = requiredText(data.ledgerName, 'Ledger name');
  if (data.groupId !== undefined) referenceExists(data.groupId, db.ledgerGroups, 'Ledger group');
  const group = data.groupId ? db.ledgerGroups.find((g) => g.id === data.groupId) : undefined;
  db.expenseLedgers = db.expenseLedgers.map((l) =>
    l.id === id
      ? {
          ...l,
          ...data,
          groupName: group ? group.groupName : l.groupName,
          groupType: group ? group.groupType : l.groupType,
        }
      : l
  );
  saveDatabase(db);
  return getExpenseLedgerById(id);

  });
}

export function deleteExpenseLedger(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  db.expenseLedgers = db.expenseLedgers.filter((l) => l.id !== id);
  saveDatabase(db);
  return true;

  });
}

export function resetAccountingData() {
  return withTransaction(() => {
  const db = getDatabase();
  db.ledgerGroups = [];
  db.expenseLedgers = [];
  saveDatabase(db);

  });
}
