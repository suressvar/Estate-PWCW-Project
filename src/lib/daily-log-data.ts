import { withTransaction } from "./db-storage";
import { randomUUID } from "node:crypto";
import {
ActivityType,
DailyLogItem,
DailyLogStatus,
getDatabase,
saveDatabase,
WorkActivityItem,
} from "./db-storage";
import { getEmployees } from "./hr-data";
import { getPlots } from "./master-data";
import { dateKey,oneOf,referenceExists } from "./validation";

export type { ActivityType,DailyLogItem,DailyLogStatus,WorkActivityItem };

/**
 * Format Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get next calendar day string in YYYY-MM-DD format
 */
export function getNextDayKey(dateStr: string): string {
  const date = new Date(`${dateKey(dateStr)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return dateKey(date.toISOString().slice(0, 10));
}

/**
 * Helper to compute DailyLog status based on its activities
 */
export function computeDailyLogStatus(activities: Pick<WorkActivityItem, "completedFlag" | "plannedFlag">[]): DailyLogStatus {
  if (!activities || activities.length === 0) {
    return "PLANNED";
  }

  const allDone = activities.every((a) => a.completedFlag);
  if (allDone) {
    return "COMPLETED";
  }

  const anyDone = activities.some((a) => a.completedFlag);
  if (anyDone) {
    return "IN_PROGRESS";
  }

  const allNotDone = activities.every((a) => !a.completedFlag && !a.plannedFlag);
  if (allNotDone) {
    return "NOT_DONE";
  }

  return "PLANNED";
}

/**
 * Populate display names for plot and assigned workers
 */
function enrichDailyLog(log: DailyLogItem): DailyLogItem {
  const plots = getPlots();
  const employees = getEmployees();

  const plot = plots.find((p) => p.id === log.plotId);
  if (plot) {
    log.plotName = plot.name;
  }

  if (log.activities) {
    for (const act of log.activities) {
      if (act.assignedWorkerIds && act.assignedWorkerIds.length > 0) {
        act.assignedWorkerNames = act.assignedWorkerIds
          .map((id) => {
            const emp = employees.find((e) => e.id === id);
            return emp ? emp.name : id;
          })
          .filter(Boolean);
      } else {
        act.assignedWorkerNames = [];
      }
    }
  }

  return log;
}

/**
 * Retrieve daily logs with optional filters.
 * Runs on-load auto-transition check for past planned activities.
 */
export function getDailyLogs(filters?: {
  date?: string;
  plotId?: string;
  status?: DailyLogStatus;
  skipAutoTransition?: boolean;
}): DailyLogItem[] {
  if (!filters?.skipAutoTransition) {
    autoTransitionPastPlannedActivities();
  }

  const db = getDatabase();
  let logs = (db.dailyLogs || []).map((l) => enrichDailyLog({ ...l }));

  if (filters?.date) {
    logs = logs.filter((l) => l.date === filters.date);
  }

  if (filters?.plotId) {
    logs = logs.filter((l) => l.plotId === filters.plotId);
  }

  if (filters?.status) {
    logs = logs.filter((l) => l.status === filters.status);
  }

  // Sort descending by date, then plotName
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Find daily log by id
 */
export function getDailyLogById(id: string): DailyLogItem | undefined {
  const db = getDatabase();
  const log = (db.dailyLogs || []).find((l) => l.id === id);
  return log ? enrichDailyLog({ ...log }) : undefined;
}

/**
 * Find daily log for a specific plot on a specific date
 */
export function getDailyLogByPlotAndDate(plotId: string, date: string): DailyLogItem | undefined {
  const db = getDatabase();
  const log = (db.dailyLogs || []).find((l) => l.plotId === plotId && l.date === date);
  return log ? enrichDailyLog({ ...log }) : undefined;
}

/**
 * Create or update a DailyLog enforcing unique (plotId, date) constraint.
 */
export function upsertDailyLog(data: {
  date: string;
  plotId: string;
  createdBy?: string;
  notes?: string;
  status?: DailyLogStatus;
}): DailyLogItem {
  return withTransaction(() => {
  dateKey(data.date);
  referenceExists(data.plotId, getPlots(), "Plot");
  if (data.status !== undefined) oneOf(data.status, ["PLANNED", "IN_PROGRESS", "COMPLETED", "NOT_DONE"], "Daily log status");
  const db = getDatabase();
  if (!db.dailyLogs) {
    db.dailyLogs = [];
  }

  const existingIndex = db.dailyLogs.findIndex(
    (l) => l.plotId === data.plotId && l.date === data.date
  );

  const plots = getPlots();
  const plot = plots.find((p) => p.id === data.plotId);
  const plotName = plot ? plot.name : "Unknown Plot";

  if (existingIndex >= 0) {
    // Update existing record
    const existing = db.dailyLogs[existingIndex];
    const updated: DailyLogItem = {
      ...existing,
      plotName,
      createdBy: data.createdBy !== undefined ? data.createdBy : existing.createdBy,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      status: data.status !== undefined ? data.status : existing.status,
      updatedAt: new Date().toISOString(),
    };
    db.dailyLogs[existingIndex] = updated;
    saveDatabase(db);
    return enrichDailyLog({ ...updated });
  }

  // Create new record
  const now = new Date().toISOString();
  const newLog: DailyLogItem = {
    id: `dl_${randomUUID()}_${Math.random().toString(36).substring(2, 7)}`,
    date: data.date,
    plotId: data.plotId,
    plotName,
    status: data.status || "PLANNED",
    createdBy: data.createdBy || "Field Supervisor",
    notes: data.notes || "",
    activities: [],
    createdAt: now,
    updatedAt: now,
  };

  db.dailyLogs.unshift(newLog);
  saveDatabase(db);
  return enrichDailyLog({ ...newLog });

  });
}

/**
 * Add a new activity to a daily log.
 * Activities default to plannedFlag: true, completedFlag: false.
 */
export function addWorkActivity(
  dailyLogId: string,
  data: {
    activityType: ActivityType;
    customActivity?: string;
    description?: string;
    assignedWorkerIds?: string[];
    plannedFlag?: boolean;
    completedFlag?: boolean;
    carriedForwardFromId?: string | null;
  }
): { activity: WorkActivityItem; dailyLog: DailyLogItem } {
  return withTransaction(() => {
  oneOf(data.activityType, ['SOWING', 'WEEDING', 'IRRIGATION', 'SPRAYING', 'HARVESTING', 'FERTILIZER_APPLICATION', 'LAND_PREPARATION', 'PRUNING', 'MAINTENANCE', 'OTHER'], 'Activity type', 'OTHER');
  if (data.assignedWorkerIds !== undefined && !Array.isArray(data.assignedWorkerIds)) throw new Error('Assigned workers must be a list.');
  for (const workerId of data.assignedWorkerIds || []) referenceExists(workerId, [...getDatabase().employees, ...(getDatabase().workers || [])], 'Assigned worker');
  for (const flag of [data.plannedFlag, data.completedFlag]) if (flag !== undefined && typeof flag !== 'boolean') throw new Error('Activity flags must be boolean.');
  const db = getDatabase();
  if (!db.dailyLogs) {
    db.dailyLogs = [];
  }

  const log = db.dailyLogs.find((l) => l.id === dailyLogId);
  if (!log) {
    throw new Error(`Daily log with id ${dailyLogId} not found.`);
  }

  if (!log.activities) {
    log.activities = [];
  }

  const now = new Date().toISOString();
  const newActivity: WorkActivityItem = {
    id: `act_${randomUUID()}_${Math.random().toString(36).substring(2, 7)}`,
    dailyLogId,
    activityType: data.activityType || "OTHER",
    customActivity: data.customActivity?.trim() || undefined,
    description: data.description?.trim() || "",
    plannedFlag: data.plannedFlag !== undefined ? data.plannedFlag : true,
    completedFlag: data.completedFlag !== undefined ? data.completedFlag : false,
    reasonIfNotDone: null,
    carriedForwardFromId: data.carriedForwardFromId || null,
    assignedWorkerIds: data.assignedWorkerIds || [],
    createdAt: now,
    updatedAt: now,
  };

  log.activities.push(newActivity);
  log.status = computeDailyLogStatus(log.activities);
  log.updatedAt = now;

  saveDatabase(db);

  return {
    activity: { ...newActivity },
    dailyLog: enrichDailyLog({ ...log }),
  };

  });
}

/**
 * Update an activity's status with toggle options: DONE, NOT_DONE, PENDING.
 * If marked NOT_DONE, reasonIfNotDone is strictly required.
 */
export function updateActivityStatus(
  activityId: string,
  status: "DONE" | "NOT_DONE" | "PENDING",
  reasonIfNotDone?: string | null
): { activity: WorkActivityItem; dailyLog: DailyLogItem } {
  return withTransaction(() => {
  oneOf(status, ['DONE', 'NOT_DONE', 'PENDING'], 'Activity status');
  const db = getDatabase();
  if (!db.dailyLogs) {
    throw new Error("No daily logs found");
  }

  let foundActivity: WorkActivityItem | null = null;
  let parentLog: DailyLogItem | null = null;

  for (const log of db.dailyLogs) {
    const act = (log.activities || []).find((a) => a.id === activityId);
    if (act) {
      foundActivity = act;
      parentLog = log;
      break;
    }
  }

  if (!foundActivity || !parentLog) {
    throw new Error(`Activity with id ${activityId} not found.`);
  }

  const now = new Date().toISOString();

  if (status === "DONE") {
    foundActivity.completedFlag = true;
    foundActivity.plannedFlag = false;
    foundActivity.reasonIfNotDone = null;
  } else if (status === "NOT_DONE") {
    const trimmedReason = (reasonIfNotDone || "").trim();
    if (!trimmedReason) {
      throw new Error("A reason is mandatory when marking an activity as Not Done.");
    }
    foundActivity.completedFlag = false;
    foundActivity.plannedFlag = false;
    foundActivity.reasonIfNotDone = trimmedReason;
  } else {
    // PENDING (Needed/Planned)
    foundActivity.completedFlag = false;
    foundActivity.plannedFlag = true;
    foundActivity.reasonIfNotDone = null;
  }

  foundActivity.updatedAt = now;
  parentLog.status = computeDailyLogStatus(parentLog.activities);
  parentLog.updatedAt = now;

  saveDatabase(db);

  return {
    activity: { ...foundActivity },
    dailyLog: enrichDailyLog({ ...parentLog }),
  };

  });
}

/**
 * Delete an activity from a daily log
 */
export function deleteWorkActivity(activityId: string): { success: boolean; dailyLog?: DailyLogItem } {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.dailyLogs) return { success: false };

  for (const log of db.dailyLogs) {
    const idx = (log.activities || []).findIndex((a) => a.id === activityId);
    if (idx >= 0) {
      log.activities.splice(idx, 1);
      log.status = computeDailyLogStatus(log.activities);
      log.updatedAt = new Date().toISOString();
      saveDatabase(db);
      return { success: true, dailyLog: enrichDailyLog({ ...log }) };
    }
  }

  return { success: false };

  });
}

/**
 * Auto-transition logic:
 * Checks any DailyLog whose date is strictly before referenceDate (defaults to today)
 * that still has activities marked plannedFlag === true (pending).
 * Auto-transitions them to NOT_DONE with reason 'Not marked complete by end of day' (or existing reason),
 * and automatically carries forward each unfinished activity to the next day's DailyLog
 * with carriedForwardFromId linking to the previous activity.
 * Preserves full history without deleting any prior entries.
 */
export function autoTransitionPastPlannedActivities(referenceDateStr?: string): {
  transitionedActivitiesCount: number;
  carriedForwardCount: number;
} {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.dailyLogs || db.dailyLogs.length === 0) {
    return { transitionedActivitiesCount: 0, carriedForwardCount: 0 };
  }

  const todayStr = referenceDateStr || formatDateKey();
  let transitionedActivitiesCount = 0;
  let carriedForwardCount = 0;
  let dbChanged = false;

  // Find all logs from past dates (< todayStr)
  // Work on a copy of ids to avoid index shift issues when new logs are added
  const pastLogs = db.dailyLogs.filter((l) => l.date < todayStr);

  for (const log of pastLogs) {
    if (!log.activities || log.activities.length === 0) continue;

    const nextDayStr = getNextDayKey(log.date);

    for (const activity of log.activities) {
      // Activity is still planned/pending at end of day
      if (activity.plannedFlag && !activity.completedFlag) {
        // 1. Auto-flag as NOT_DONE for that date with system reason
        activity.plannedFlag = false;
        activity.completedFlag = false;
        if (!activity.reasonIfNotDone) {
          activity.reasonIfNotDone = "Not marked complete by end of day";
        }
        activity.updatedAt = new Date().toISOString();
        transitionedActivitiesCount++;
        dbChanged = true;

        // 2. Ensure next day log exists for this plot
        let nextDayLog = db.dailyLogs.find(
          (l) => l.plotId === log.plotId && l.date === nextDayStr
        );

        if (!nextDayLog) {
          const now = new Date().toISOString();
          const plots = getPlots();
          const plot = plots.find((p) => p.id === log.plotId);
          nextDayLog = {
            id: `dl_${randomUUID()}_${Math.random().toString(36).substring(2, 7)}`,
            date: nextDayStr,
            plotId: log.plotId,
            plotName: plot ? plot.name : log.plotName,
            status: "PLANNED",
            createdBy: "Auto Carry-Forward System",
            notes: `Auto-created to carry forward incomplete work from ${log.date}`,
            activities: [],
            createdAt: now,
            updatedAt: now,
          };
          db.dailyLogs.push(nextDayLog);
        }

        // 3. Check if already carried forward (idempotency check)
        const alreadyCarried = nextDayLog.activities.some(
          (a) => a.carriedForwardFromId === activity.id
        );

        if (!alreadyCarried) {
          const now = new Date().toISOString();
          const carriedActivity: WorkActivityItem = {
            id: `act_cf_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
            dailyLogId: nextDayLog.id,
            activityType: activity.activityType,
            customActivity: activity.customActivity,
            description: activity.description,
            plannedFlag: true,
            completedFlag: false,
            reasonIfNotDone: null,
            carriedForwardFromId: activity.id,
            assignedWorkerIds: activity.assignedWorkerIds ? [...activity.assignedWorkerIds] : [],
            assignedWorkerNames: activity.assignedWorkerNames ? [...activity.assignedWorkerNames] : [],
            createdAt: now,
            updatedAt: now,
          };

          nextDayLog.activities.push(carriedActivity);
          nextDayLog.status = computeDailyLogStatus(nextDayLog.activities);
          nextDayLog.updatedAt = now;
          carriedForwardCount++;
        }
      }
    }

    log.status = computeDailyLogStatus(log.activities);
    log.updatedAt = new Date().toISOString();
  }

  if (dbChanged || carriedForwardCount > 0) {
    saveDatabase(db);
  }

  return {
    transitionedActivitiesCount,
    carriedForwardCount,
  };

  });
}

/**
 * Dashboard Summary across all plots for a given date (defaults to today).
 * Aggregates pending and not-done work items.
 */
export function getDashboardPendingWork(targetDateStr?: string) {
  // Run auto-transition check first
  autoTransitionPastPlannedActivities();

  const todayStr = targetDateStr || formatDateKey();
  const db = getDatabase();
  const plots = getPlots();

  // Find all daily logs for the target date
  const logsForDate = (db.dailyLogs || []).filter((l) => l.date === todayStr);

  let totalPending = 0;
  let totalNotDone = 0;
  let totalCompleted = 0;
  let totalActivities = 0;
  let totalCarriedForward = 0;

  const plotWorkItems: {
    plotId: string;
    plotName: string;
    dailyLogId: string;
    status: DailyLogStatus;
    pendingActivities: WorkActivityItem[];
    notDoneActivities: WorkActivityItem[];
    completedActivities: WorkActivityItem[];
  }[] = [];

  for (const log of logsForDate) {
    const enriched = enrichDailyLog({ ...log });
    const pending = (enriched.activities || []).filter((a) => a.plannedFlag && !a.completedFlag);
    const notDone = (enriched.activities || []).filter((a) => !a.plannedFlag && !a.completedFlag);
    const completed = (enriched.activities || []).filter((a) => a.completedFlag);
    const carried = (enriched.activities || []).filter((a) => !!a.carriedForwardFromId);

    totalPending += pending.length;
    totalNotDone += notDone.length;
    totalCompleted += completed.length;
    totalActivities += (enriched.activities || []).length;
    totalCarriedForward += carried.length;

    if (pending.length > 0 || notDone.length > 0 || completed.length > 0) {
      plotWorkItems.push({
        plotId: log.plotId,
        plotName: enriched.plotName || "Plot",
        dailyLogId: log.id,
        status: log.status,
        pendingActivities: pending,
        notDoneActivities: notDone,
        completedActivities: completed,
      });
    }
  }

  return {
    date: todayStr,
    totalPlotsTracked: logsForDate.length,
    totalAvailablePlots: plots.length,
    totalActivities,
    totalPending,
    totalNotDone,
    totalCompleted,
    totalCarriedForward,
    completionRatePercent:
      totalActivities > 0 ? Math.round((totalCompleted / totalActivities) * 100) : 0,
    plotWorkItems,
  };
}
