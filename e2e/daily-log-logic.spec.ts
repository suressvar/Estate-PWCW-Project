import { expect,test } from "./fixtures";
import {
addWorkActivity,
autoTransitionPastPlannedActivities,
computeDailyLogStatus,
getDailyLogByPlotAndDate,
getDailyLogs,
updateActivityStatus,
upsertDailyLog
} from "../src/lib/daily-log-data";
import { createPlot,getPlots } from "../src/lib/master-data";
import { createWorker } from "../src/lib/worker-data";

test.describe("Daily Work Tracking - Core Unit & Integration Logic", () => {
  let testPlotId = "p1"; // Plot A - North Field
  const testDatePast = "2026-07-01";

  test.beforeAll(() => { testPlotId = getPlots()[0]?.id || createPlot({ name: "Daily Test Plot", location: "Test", areaAcres: 5, status: "ACTIVE" }).id; });
  test("1. Enforces unique constraint per plot + date via upsert logic", () => {
    // First upsert creates
    const log1 = upsertDailyLog({
      plotId: testPlotId,
      date: testDatePast,
      createdBy: "Field Staff A",
      notes: "Initial planning note",
      status: "PLANNED",
    });

    expect(log1).toBeDefined();
    expect(log1.plotId).toBe(testPlotId);
    expect(log1.date).toBe(testDatePast);
    expect(log1.notes).toBe("Initial planning note");

    // Second upsert for same plot + date updates existing row without creating duplicate
    const log2 = upsertDailyLog({
      plotId: testPlotId,
      date: testDatePast,
      notes: "Updated planning note",
    });

    expect(log2.id).toBe(log1.id); // Same record ID
    expect(log2.notes).toBe("Updated planning note");

    // Verify list contains only 1 log for this plot + date
    const logs = getDailyLogs({ plotId: testPlotId, date: testDatePast, skipAutoTransition: true });
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe(log1.id);
  });

  test("2. WorkActivity defaults to plannedFlag: true, completedFlag: false", () => {
    const worker = createWorker({ name: "Activity assignment fixture", dailyWageRate: 600 });
    const log = upsertDailyLog({
      plotId: testPlotId,
      date: testDatePast,
    });

    const { activity, dailyLog } = addWorkActivity(log.id, {
      activityType: "IRRIGATION",
      description: "2-hour drip cycle North quadrant",
      assignedWorkerIds: [worker.id],
    });

    expect(activity.id).toBeDefined();
    expect(activity.plannedFlag).toBe(true);
    expect(activity.completedFlag).toBe(false);
    expect(activity.reasonIfNotDone).toBeNull();
    expect(activity.carriedForwardFromId).toBeNull();
    expect(activity.assignedWorkerIds).toEqual([worker.id]);
    expect(dailyLog.status).toBe("PLANNED");
  });

  test("3. Updating activity to NOT_DONE strictly requires a valid reason", () => {
    const log = upsertDailyLog({ plotId: testPlotId, date: testDatePast });
    const { activity } = addWorkActivity(log.id, {
      activityType: "WEEDING",
      description: "Inter-row weeding",
    });

    // Attempting NOT_DONE without reason should throw error
    expect(() => {
      updateActivityStatus(activity.id, "NOT_DONE", "");
    }).toThrow(/reason is mandatory/i);

    expect(() => {
      updateActivityStatus(activity.id, "NOT_DONE", "   ");
    }).toThrow(/reason is mandatory/i);

    // Supplying valid reason succeeds
    const { activity: updatedActivity } = updateActivityStatus(
      activity.id,
      "NOT_DONE",
      "Rain interrupted field work"
    );

    expect(updatedActivity.completedFlag).toBe(false);
    expect(updatedActivity.plannedFlag).toBe(false);
    expect(updatedActivity.reasonIfNotDone).toBe("Rain interrupted field work");
  });

  test("4. Computes DailyLog status dynamically from activity states", () => {
    // When all activities done -> COMPLETED
    const statusCompleted = computeDailyLogStatus([
      { completedFlag: true, plannedFlag: false },
      { completedFlag: true, plannedFlag: false },
    ]);
    expect(statusCompleted).toBe("COMPLETED");

    // When some done -> IN_PROGRESS
    const statusInProgress = computeDailyLogStatus([
      { completedFlag: true, plannedFlag: false },
      { completedFlag: false, plannedFlag: true },
    ]);
    expect(statusInProgress).toBe("IN_PROGRESS");

    // When all not done -> NOT_DONE
    const statusNotDone = computeDailyLogStatus([
      { completedFlag: false, plannedFlag: false },
      { completedFlag: false, plannedFlag: false },
    ]);
    expect(statusNotDone).toBe("NOT_DONE");

    // When all pending -> PLANNED
    const statusPlanned = computeDailyLogStatus([
      { completedFlag: false, plannedFlag: true },
      { completedFlag: false, plannedFlag: true },
    ]);
    expect(statusPlanned).toBe("PLANNED");
  });

  test("5. End-of-day auto-transition carries forward incomplete activities with lineage", () => {
    const historicalDate = "2026-06-20";
    const nextDayDate = "2026-06-21";
    const referenceToday = "2026-06-21";

    // Setup past log with 1 completed activity and 1 pending activity
    const pastLog = upsertDailyLog({ plotId: testPlotId, date: historicalDate });
    const { activity: doneAct } = addWorkActivity(pastLog.id, {
      activityType: "HARVESTING",
      description: "Morning tomato harvest batch 1",
    });
    updateActivityStatus(doneAct.id, "DONE");

    const { activity: pendingAct } = addWorkActivity(pastLog.id, {
      activityType: "SPRAYING",
      description: "Neem oil spray for whiteflies",
    });

    // Run auto-transition referencing referenceToday
    const report = autoTransitionPastPlannedActivities(referenceToday);

    expect(report.transitionedActivitiesCount).toBeGreaterThanOrEqual(1);
    expect(report.carriedForwardCount).toBeGreaterThanOrEqual(1);

    // Verify past log still exists with full history
    const refreshedPastLog = getDailyLogByPlotAndDate(testPlotId, historicalDate);
    expect(refreshedPastLog).toBeDefined();
    const refreshedPendingAct = refreshedPastLog?.activities.find((a) => a.id === pendingAct.id);
    expect(refreshedPendingAct?.completedFlag).toBe(false);
    expect(refreshedPendingAct?.plannedFlag).toBe(false);
    expect(refreshedPendingAct?.reasonIfNotDone).toBe("Not marked complete by end of day");

    // Verify next day's log exists and has the carried-forward activity referencing previous id
    const nextDayLog = getDailyLogByPlotAndDate(testPlotId, nextDayDate);
    expect(nextDayLog).toBeDefined();

    const carriedActivity = nextDayLog?.activities.find(
      (a) => a.carriedForwardFromId === pendingAct.id
    );
    expect(carriedActivity).toBeDefined();
    expect(carriedActivity?.description).toBe("Neem oil spray for whiteflies");
    expect(carriedActivity?.activityType).toBe("SPRAYING");
    expect(carriedActivity?.plannedFlag).toBe(true);
    expect(carriedActivity?.completedFlag).toBe(false);

    // Idempotency: calling again should not duplicate carry-forward items
    const secondReport = autoTransitionPastPlannedActivities(referenceToday);
    expect(secondReport.carriedForwardCount).toBe(0);
  });

  test("6. Master Daily Sheet dispatches filled operations across multiple menus", async () => {
    const { getDatabase } = await import("../src/lib/db-storage");
    const testDate = "2026-07-15";

    // Simulate POST payload to /api/daily-log/master-sheet
    const { POST } = await import("../src/app/api/daily-log/master-sheet/route");
    const req = new Request("http://localhost:3000/api/daily-log/master-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: testDate,
        plotId: testPlotId,
        loggedBy: "Supervisor Raman",
        notes: "Clear sunny weather, full operations run",
        activity: {
          activityType: "IRRIGATION",
          description: "4-hour drip run block 1 to 5",
          completedFlag: true,
        },
        labor: {
          menCount: 4,
          womenCount: 2,
          menWageRate: 600,
          womenWageRate: 500,
          totalCost: 3400,
          notes: "Weeding and irrigation supervision",
        },
        fertilizer: {
          fertilizerName: "Urea (46% N)",
          quantityKg: 75,
          cost: 2625,
          notes: "Applied around roots",
        },
        machinery: {
          machineName: "John Deere Tractor",
          runningHours: 4.0,
          dieselConsumedLiters: 18.0,
          dieselCost: 1710,
          notes: "Ploughing north quadrant",
        },
        sales: {
          cropName: "Coffee Arabica",
          quantityKg: 300,
          value: 24000,
          buyerName: "Coimbatore Coffee Traders",
          paymentMode: "Bank Transfer",
        },
        purchase: {
          category: "Tools & Hardware",
          description: "Irrigation drip lateral pipes 16mm",
          cost: 1500,
          vendorName: "Agro Tools Mart",
          paymentMode: "Cash",
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.dispatchedCount).toBe(7);

    const db = getDatabase();

    // 1. Verify Daily Log & Activity
    const dl = (db.dailyLogs || []).find((l) => l.plotId === testPlotId && l.date === testDate);
    expect(dl).toBeDefined();
    expect(dl?.activities.some((a) => a.activityType === "IRRIGATION" && a.completedFlag)).toBe(true);

    // 2. Verify Labor Log
    const labor = db.laborLogs.find((l) => l.date === testDate && l.totalCost === 3400);
    expect(labor).toBeDefined();
    expect(labor?.menCount).toBe(4);
    expect(labor?.womenCount).toBe(2);

    // 3. Verify Fertilizer Log
    const fert = db.fertilizerLogs.find((l) => l.date === testDate && l.fertilizerName === "Urea (46% N)");
    expect(fert).toBeDefined();
    expect(fert?.quantityKg).toBe(75);

    // 4. Verify Diesel Log & Machinery Log
    const diesel = db.dieselLogs.find((l) => l.date === testDate && l.quantityLiters === 18.0);
    expect(diesel).toBeDefined();
    const mach = db.machineryLogs.find((l) => l.date === testDate && l.machineName === "John Deere Tractor");
    expect(mach).toBeDefined();
    expect(mach?.runningHours).toBe(4.0);

    // 5. Verify Sales Log
    const sale = db.salesLogs.find((l) => l.date === testDate && l.cropActivityName === "Coffee Arabica");
    expect(sale).toBeDefined();
    expect(sale?.value).toBe(24000);
    expect(sale?.buyerName).toBe("Coimbatore Coffee Traders");

    // 6. Verify Purchase Voucher
    const pur = db.generalPurchaseLogs.find((l) => l.date === testDate && l.description === "Irrigation drip lateral pipes 16mm");
    expect(pur).toBeDefined();
    expect(pur?.cost).toBe(1500);
  });
});
