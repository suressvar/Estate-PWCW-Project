import { withTransaction } from "./db-storage";
import { assertRecordId } from "./validation";
import { randomUUID } from "node:crypto";
import {
getDatabase,
PartyItem,
PartyType,
saveDatabase
} from "./db-storage";

export type { PartyItem,PartyType };

function ensureParties(): PartyItem[] {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.parties || !Array.isArray(db.parties)) {
    db.parties = [];
    saveDatabase(db);
  }
  return db.parties ?? [];

  });
}

export function getParties(type?: PartyType): PartyItem[] {
  const parties = ensureParties();
  if (type) {
    return parties.filter((p) => p.type === type || p.type === "Both");
  }
  return parties;
}

export function getPartyById(id: string): PartyItem | undefined {
  const parties = ensureParties();
  return parties.find((p) => p.id === id);
}

export function createParty(data: Omit<PartyItem, "id" | "createdAt">): PartyItem {
  return withTransaction(() => {
  const db = getDatabase();
  const parties = ensureParties();

  const newParty: PartyItem = {
    ...data,
    id: `pty_${randomUUID()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };

  parties.unshift(newParty);
  db.parties = parties;
  saveDatabase(db);
  return newParty;

  });
}

export function updateParty(id: string, data: Partial<PartyItem>): PartyItem | undefined {
  return withTransaction(() => {
  assertRecordId(id, data);
  const db = getDatabase();
  const parties = ensureParties();

  const index = parties.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  parties[index] = {
    ...parties[index],
    ...data,
    updatedAt: new Date().toISOString().split("T")[0],
  };

  db.parties = parties;
  saveDatabase(db);
  return parties[index];

  });
}

export function deleteParty(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  const parties = ensureParties();

  const initialLength = parties.length;
  db.parties = parties.filter((p) => p.id !== id);
  if (db.parties.length !== initialLength) {
    saveDatabase(db);
    return true;
  }
  return false;

  });
}
