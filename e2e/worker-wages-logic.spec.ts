import { expect,test } from "./fixtures";
import { createCropCycle } from "../src/lib/crop-cycle-data";
import { upsertDailyLog } from "../src/lib/daily-log-data";
import { getDatabase } from "../src/lib/db-storage";
import { createPlot,getPlots } from "../src/lib/master-data";
import {
addWorkerActivityLog,
calculateWageForAttendance,
createWorker,
getMonthlyWorkerSummary,
getWorkerActivityLogs,
recordWagePayment,
upsertWorkerAttendanceAndWage
} from "../src/lib/worker-data";

test.describe("Worker Management & Wage Computation - Unit & Integration Logic", () => {
  let testPlotId: string;
  let testWorkerId: string;
  let testCropCycleId: string;
  let testDailyLogId: string;

  test.beforeAll(() => {
    // 1. Resolve test plot
    const plots = getPlots();
    testPlotId = plots[0]?.id || createPlot({ name: "Wage Test Plot", location: "Test", areaAcres: 5, status: "ACTIVE" }).id;

    // 2. Create dedicated test worker
    const worker = createWorker({
      name: "Chinnaswamy Test Worker",
      phone: "9843210987",
      role: "Pruning & Harvesting Specialist",
      dailyWageRate: 600,
      active: true,
    });
    testWorkerId = worker.id;

    // 3. Create test crop cycle
    const cycle = createCropCycle({
      plotId: testPlotId,
      cropName: "Test Banana Labor Cycle",
      sowingDate: "2026-06-01",
      expectedHarvestDate: "2026-09-30",
    });
    testCropCycleId = cycle.id;

    // 4. Create test daily log
    const dl = upsertDailyLog({
      plotId: testPlotId,
      date: "2026-06-15",
      notes: "Testing labor activity logging",
    });
    testDailyLogId = dl.id;
  });

  test("1. Wage computation edge cases (Full Day, Half Day, Absent, Leave, Hourly Override, Manual Override)", () => {
    const dailyRate = 600;

    // Case A: Full day PRESENT
    const fullDay = calculateWageForAttendance(dailyRate, "PRESENT");
    expect(fullDay.hoursWorked).toBe(8);
    expect(fullDay.computedAmount).toBe(600);

    // Case B: Half day HALF_DAY
    const halfDay = calculateWageForAttendance(dailyRate, "HALF_DAY");
    expect(halfDay.hoursWorked).toBe(4);
    expect(halfDay.computedAmount).toBe(300);

    // Case C: Absent ABSENT
    const absent = calculateWageForAttendance(dailyRate, "ABSENT");
    expect(absent.hoursWorked).toBe(0);
    expect(absent.computedAmount).toBe(0);

    // Case D: Leave LEAVE
    const leave = calculateWageForAttendance(dailyRate, "LEAVE");
    expect(leave.hoursWorked).toBe(0);
    expect(leave.computedAmount).toBe(0);

    // Case E: Manual hours worked override (e.g. 6 hours at ₹600/day -> ₹450)
    const partialHours = calculateWageForAttendance(dailyRate, "PRESENT", 6);
    expect(partialHours.hoursWorked).toBe(6);
    expect(partialHours.computedAmount).toBe(450);

    // Case F: Overtime hours (e.g. 10 hours at ₹600/day -> ₹750)
    const overtimeHours = calculateWageForAttendance(dailyRate, "PRESENT", 10);
    expect(overtimeHours.hoursWorked).toBe(10);
    expect(overtimeHours.computedAmount).toBe(750);

    // Case G: Manual amount override (e.g. task bonus override ₹800)
    const manualAmount = calculateWageForAttendance(dailyRate, "PRESENT", 8, 800);
    expect(manualAmount.computedAmount).toBe(800);
  });

  test("2. Attendance upsert prevents duplicate records and recalculates wage in lockstep", () => {
    const testDate = "2026-06-16";

    // First: Record as Half Day
    const first = upsertWorkerAttendanceAndWage({
      workerId: testWorkerId,
      date: testDate,
      status: "HALF_DAY",
    });

    expect(first.attendance.status).toBe("HALF_DAY");
    expect(first.attendance.hoursWorked).toBe(4);
    expect(first.wage.computedAmount).toBe(300);
    expect(first.wage.paidStatus).toBe("UNPAID");

    // Second: Supervisor updates to Full Day on same date
    const second = upsertWorkerAttendanceAndWage({
      workerId: testWorkerId,
      date: testDate,
      status: "PRESENT",
      hoursWorked: 8,
    });

    expect(second.attendance.id).toBe(first.attendance.id);
    expect(second.attendance.status).toBe("PRESENT");
    expect(second.attendance.hoursWorked).toBe(8);
    expect(second.wage.id).toBe(first.wage.id);
    expect(second.wage.computedAmount).toBe(600);

    // Verify DB contains strictly 1 attendance and 1 wage entry for worker+date
    const db = getDatabase();
    const attMatches = (db.workerAttendances || []).filter(
      (a) => a.workerId === testWorkerId && a.date === testDate
    );
    const wageMatches = (db.wageEntries || []).filter(
      (w) => w.workerId === testWorkerId && w.date === testDate
    );

    expect(attMatches.length).toBe(1);
    expect(wageMatches.length).toBe(1);
  });

  test("3. Idempotent sync of WageEntry to CropCycle CropExpense under LABOR category", () => {
    const laborDate = "2026-06-17";

    // Mark attendance with crop cycle link
    const { wage } = upsertWorkerAttendanceAndWage({
      workerId: testWorkerId,
      date: laborDate,
      status: "PRESENT",
      cropCycleId: testCropCycleId,
    });

    expect(wage.computedAmount).toBe(600);
    expect(wage.cropCycleId).toBe(testCropCycleId);

    // Verify CropExpense table has synced labor entry
    const db = getDatabase();
    const expectedRef = `wage_${wage.id}`;
    const syncedExpense = (db.cropExpenses || []).find((e) => e.sourceRefId === expectedRef);

    expect(syncedExpense).toBeDefined();
    expect(syncedExpense?.category).toBe("LABOR");
    expect(syncedExpense?.amount).toBe(600);
    expect(syncedExpense?.cropCycleId).toBe(testCropCycleId);

    // Now edit the attendance to 10 hours overtime (₹750)
    upsertWorkerAttendanceAndWage({
      workerId: testWorkerId,
      date: laborDate,
      status: "PRESENT",
      hoursWorked: 10,
      cropCycleId: testCropCycleId,
    });

    // Verify CropExpense updated in-place without duplicating
    const freshDb = getDatabase();
    const matches = (freshDb.cropExpenses || []).filter((e) => e.sourceRefId === expectedRef);
    expect(matches.length).toBe(1);
    expect(matches[0].amount).toBe(750);
  });

  test("4. Worker Activity Logging tied to DailyLog and Plot", () => {
    const act = addWorkerActivityLog({
      workerId: testWorkerId,
      dailyLogId: testDailyLogId,
      plotId: testPlotId,
      cropCycleId: testCropCycleId,
      activityDescription: "Sprayed bio-pesticide and de-suckered banana shoots",
      timeSpentHours: 4.5,
    });

    expect(act.id).toBeDefined();
    expect(act.workerId).toBe(testWorkerId);
    expect(act.activityDescription).toContain("de-suckered banana shoots");
    expect(act.timeSpentHours).toBe(4.5);

    const logs = getWorkerActivityLogs({ workerId: testWorkerId, dailyLogId: testDailyLogId });
    expect(logs.some((l) => l.id === act.id)).toBe(true);
  });

  test("5. Wage payment settlement (UNPAID -> PARTIAL -> PAID)", () => {
    const payDate = "2026-06-18";
    const { wage } = upsertWorkerAttendanceAndWage({
      workerId: testWorkerId,
      date: payDate,
      status: "PRESENT",
      hoursWorked: 8, // ₹600
    });

    expect(wage.paidStatus).toBe("UNPAID");
    expect(wage.paidAmount).toBe(0);

    // Partial Payment: Pay ₹250 of ₹600
    const partial = recordWagePayment(wage.id, {
      paidAmount: 250,
      paidDate: payDate,
      paymentNotes: "Partial cash advance",
    });

    expect(partial?.paidStatus).toBe("PARTIAL");
    expect(partial?.paidAmount).toBe(250);

    // Settle Remaining: Pay remaining ₹350 (Total ₹600)
    const settled = recordWagePayment(wage.id, {
      paidAmount: 600,
      paidDate: payDate,
      paymentNotes: "Full settlement via UPI",
    });

    expect(settled?.paidStatus).toBe("PAID");
    expect(settled?.paidAmount).toBe(600);
  });

  test("6. Monthly Worker Summary calculation & CSV generation", () => {
    const summary = getMonthlyWorkerSummary(2026, 6);

    expect(summary.year).toBe(2026);
    expect(summary.month).toBe(6);
    expect(summary.summaries.length).toBeGreaterThan(0);

    const chinnaswamy = summary.summaries.find((s) => s.workerId === testWorkerId);
    expect(chinnaswamy).toBeDefined();
    expect(chinnaswamy?.totalDaysRecorded).toBeGreaterThanOrEqual(3);
    expect(chinnaswamy?.totalWagesEarned).toBeGreaterThan(0);
    expect(chinnaswamy?.attendancePercent).toBeGreaterThan(0);

    // Verify CSV contains proper headers and rows
    expect(summary.csvString).toContain("Worker ID,Worker Name,Role / Skill");
    expect(summary.csvString).toContain("Chinnaswamy Test Worker");
    expect(summary.csvString).toMatch(/^"?TOTAL"?,/m);
  });
});
