import { money } from "./money";
import { employeeDailyRate } from "./payroll";
import { getWorkers, upsertWorkerAttendanceAndWage, syncWageToCropExpense, deleteWorker } from "./worker-data";
import { referenceExists, ValidationError } from "./validation";
import { assertRecordId } from "./validation";
import { randomUUID } from "node:crypto";
import { withTransaction } from "./db-storage";
import {
AttendanceRecord,
AttendanceStatus,
EmployeeItem,
EmployeeRoleItem,
EmployeeStatus,
getDatabase,
LeaveRecord,
LeaveStatus,
LeaveType,
saveDatabase,
WageRecord,
WageStatus,
WageType,
} from "./db-storage";
import { dateKey,dateRange,finiteNumber,oneOf,requiredText } from "./validation";

export type {
AttendanceRecord,AttendanceStatus,EmployeeItem,EmployeeRoleItem,EmployeeStatus,LeaveRecord,LeaveStatus,LeaveType,WageRecord,WageStatus,WageType
};

// =================== ROLES ===================
export function getEmployeeRoles(): EmployeeRoleItem[] {
  return getDatabase().employeeRoles;
}

export function createEmployeeRole(
  roleNameOrData: string | Omit<EmployeeRoleItem, "id">,
  description?: string
): EmployeeRoleItem {
  return withTransaction(() => {
  const db = getDatabase();
  const newRole: EmployeeRoleItem =
    typeof roleNameOrData === "string"
      ? { id: `er_${randomUUID()}`, roleName: roleNameOrData, description }
      : { ...roleNameOrData, id: `er_${randomUUID()}` };
  db.employeeRoles.push(newRole);
  saveDatabase(db);
  return newRole;

  });
}

export function updateEmployeeRole(id: string, data: Partial<EmployeeRoleItem>): EmployeeRoleItem | undefined {
  return withTransaction(() => {
  assertRecordId(id, data);
  const db = getDatabase();
  db.employeeRoles = db.employeeRoles.map((r) => (r.id === id ? { ...r, ...data } : r));
  saveDatabase(db);
  return db.employeeRoles.find((r) => r.id === id);

  });
}

export function deleteEmployeeRole(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  const isUsed = db.employees.some((e) => e.roleId === id);
  if (isUsed) return false;
  db.employeeRoles = db.employeeRoles.filter((r) => r.id !== id);
  saveDatabase(db);
  return true;

  });
}

// =================== EMPLOYEES ===================
export function getEmployees(): EmployeeItem[] {
  const db = getDatabase();
  return db.employees.map((e) => {
    const role = db.employeeRoles.find((r) => r.id === e.roleId);
    return {
      ...e,
      roleName: role ? role.roleName : e.roleName || "Staff",
    };
  });
}

export function getEmployeeById(id: string): EmployeeItem | undefined {
  const db = getDatabase();
  const emp = db.employees.find((e) => e.id === id);
  if (!emp) return undefined;
  const role = db.employeeRoles.find((r) => r.id === emp.roleId);
  return {
    ...emp,
    roleName: role ? role.roleName : emp.roleName || "Staff",
  };
}

function createEmployeeImpl(data: Omit<EmployeeItem, "id" | "createdAt">): EmployeeItem {
  data.name = requiredText(data.name, "Employee name");
  data.wageRate = finiteNumber(data.wageRate, "Wage rate");
  data.wageType = oneOf(data.wageType, ["DAILY", "MONTHLY", "HOURLY"], "Wage type");
  data.status = oneOf(data.status, ["ACTIVE", "INACTIVE", "RESIGNED"], "Employee status");
  const db = getDatabase();
  const role = data.roleId ? db.employeeRoles.find((r) => r.id === data.roleId) : undefined;
  const newEmp: EmployeeItem = {
    ...data,
    id: `emp_${randomUUID()}`,
    roleName: role ? role.roleName : "Staff",
    createdAt: new Date().toISOString().split("T")[0],
  };
  db.employees.unshift(newEmp);

  // Automatically sync to workers for attendance, field operations & daily logs
  if (!db.workers) db.workers = [];
  const dailyRate = employeeDailyRate(newEmp);
  const workerIdx = db.workers.findIndex((w) => w.id === newEmp.id);
  const workerRecord = {
    id: newEmp.id,
    name: newEmp.name,
    phone: newEmp.phone,
    role: newEmp.roleName || "General Field Worker",
    dailyWageRate: dailyRate,
    active: newEmp.status === "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (workerIdx >= 0) {
    db.workers[workerIdx] = workerRecord;
  } else {
    db.workers.push(workerRecord);
  }

  saveDatabase(db);
  return newEmp;
}

function updateEmployeeImpl(id: string, data: Partial<EmployeeItem>): EmployeeItem | undefined {
  assertRecordId(id, data);
  const current = getEmployeeById(id);
  if (!current) return undefined;
  const merged = { ...current, ...data };
  requiredText(merged.name, "Employee name"); finiteNumber(merged.wageRate, "Wage rate");
  oneOf(merged.wageType, ["DAILY", "MONTHLY", "HOURLY"], "Wage type");
  oneOf(merged.status, ["ACTIVE", "INACTIVE", "RESIGNED"], "Employee status");
  if (data.id !== undefined && data.id !== id) throw new Error("Employee ID cannot be changed.");
  const db = getDatabase();
  const role = data.roleId ? db.employeeRoles.find((r) => r.id === data.roleId) : undefined;
  db.employees = db.employees.map((e) =>
    e.id === id
      ? {
          ...e,
          ...data,
          roleName: role ? role.roleName : data.roleName || e.roleName,
        }
      : e
  );

  // Sync to db.workers
  if (!db.workers) db.workers = [];
  const updatedEmp = db.employees.find((e) => e.id === id);
  if (updatedEmp) {
    const dailyRate = employeeDailyRate(updatedEmp);
    const workerIdx = db.workers.findIndex((w) => w.id === id);
    const workerRecord = {
      id: updatedEmp.id,
      name: updatedEmp.name,
      phone: updatedEmp.phone,
      role: updatedEmp.roleName || "General Field Worker",
      dailyWageRate: dailyRate,
      active: updatedEmp.status === "ACTIVE",
      updatedAt: new Date().toISOString(),
    };
    if (workerIdx >= 0) {
      db.workers[workerIdx] = { ...db.workers[workerIdx], ...workerRecord };
    } else {
      db.workers.push({ ...workerRecord, createdAt: new Date().toISOString() });
    }
  }

  saveDatabase(db);
  return getEmployeeById(id);
}

export function deleteEmployee(id: string, force: boolean = false): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  const exists = db.employees.some((e) => e.id === id);
  if (!exists) return false;
  if (db.wages.some(wage => wage.employeeId === id && wage.status === 'PAID') || (db.wageEntries || []).some(wage => wage.workerId === id && Number(wage.paidAmount) > 0)) return false;

  if (!force) {
    const hasAttendance = db.attendance.some((a) => a.employeeId === id);
    const hasWages = db.wages.some((w) => w.employeeId === id);
    if (hasAttendance || hasWages) return false;
  }

  return deleteWorker(id);

  });
}

// =================== ATTENDANCE ===================
export function getAttendanceForMonth(year: number, month: number): AttendanceRecord[] {
  const db = getDatabase();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return db.attendance
    .filter((a) => a.attendanceDate.startsWith(prefix))
    .map((a) => {
      const emp = db.employees.find((e) => e.id === a.employeeId);
      return { ...a, employeeName: emp?.name || "Unknown" };
    });
}

function markAttendanceImpl(payload: {
  employeeId: string; attendanceDate: string; status: AttendanceStatus;
  notes?: string; checkInTime?: string; checkOutTime?: string;
}): AttendanceRecord {
  dateKey(payload.attendanceDate);
  oneOf(payload.status, ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"], "Attendance status");
  const db = getDatabase();
  referenceExists(payload.employeeId, db.employees, "Employee");
  getWorkers();
  upsertWorkerAttendanceAndWage({
    workerId: payload.employeeId, date: payload.attendanceDate,
    status: payload.status === "HOLIDAY" ? "LEAVE" : payload.status,
    notes: payload.notes, checkInTime: payload.checkInTime, checkOutTime: payload.checkOutTime,
  });
  const record = db.attendance.find(item => item.employeeId === payload.employeeId && item.attendanceDate === payload.attendanceDate)!;
  record.status = payload.status;
  saveDatabase(db);
  return record;
}

function bulkMarkAttendanceImpl(attendanceDate: string, status: AttendanceStatus) {
  const db = getDatabase();
  const activeEmps = (db.employees || []).filter((e) => e.status === "ACTIVE");
  activeEmps.forEach((emp) => {
    markAttendance({
      employeeId: emp.id,
      attendanceDate,
      status,
    });
  });
  return { success: true, count: activeEmps.length };
}

export function getAttendanceSummary(year: number, month: number, workingDays: number = 26) {
  const db = getDatabase();
  const activeEmps = getEmployees();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // Only count elapsed days when calculating unrecorded weekly offs (never future dates)
  let maxDayToCheck = daysInMonth;
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    maxDayToCheck = 0;
  } else if (year === currentYear && month === currentMonth) {
    maxDayToCheck = currentDay;
  }

  const allAttendance = db.attendance || [];
  const allWorkerAtts = db.workerAttendances || [];

  return activeEmps.map((emp) => {
    // Merge records from both attendance tables deduplicated by date
    const dateMap = new Map<string, { status: AttendanceStatus; hoursWorked: number }>();

    allAttendance
      .filter((a) => (a.employeeId === emp.id) && a.attendanceDate.startsWith(prefix))
      .forEach((a) => {
        dateMap.set(a.attendanceDate, {
          status: a.status,
          hoursWorked: a.status === "PRESENT" ? 8 : a.status === "HALF_DAY" ? 4 : 0,
        });
      });

    allWorkerAtts
      .filter((wa) => (wa.workerId === emp.id) && wa.date.startsWith(prefix))
      .forEach((wa) => {
        dateMap.set(wa.date, {
          status: dateMap.get(wa.date)?.status === "HOLIDAY" ? "HOLIDAY" : wa.status as AttendanceStatus,
          hoursWorked: wa.hoursWorked === undefined ? (wa.status === "PRESENT" ? 8 : wa.status === "HALF_DAY" ? 4 : 0) : Number(wa.hoursWorked),
        });
      });

    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let leave = 0;
    let holiday = 0;
    let totalHoursWorked = 0;

    dateMap.forEach((rec) => {
      if (rec.status === "PRESENT") {
        present += 1;
        totalHoursWorked += rec.hoursWorked;
      } else if (rec.status === "ABSENT") {
        absent += 1;
      } else if (rec.status === "HALF_DAY") {
        halfDay += 1;
        totalHoursWorked += rec.hoursWorked;
      } else if (rec.status === "LEAVE") {
        leave += 1;
      } else if (rec.status === "HOLIDAY") {
        holiday += 1;
      }
    });

    // Unrecorded Sundays that have occurred in the month calculate as leave / weekly off
    let unrecordedSundays = 0;
    for (let d = 1; d <= maxDayToCheck; d++) {
      const dObj = new Date(year, month - 1, d);
      if (dObj.getDay() === 0) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (!dateMap.has(dateStr)) {
          unrecordedSundays++;
        }
      }
    }
    leave += unrecordedSundays;

    const effectivePresentDays = present + halfDay * 0.5;
    const totalRecordedDays = dateMap.size + unrecordedSundays;
    const attendancePercent =
      workingDays > 0
        ? Math.min(100, Math.round((effectivePresentDays / workingDays) * 100))
        : totalRecordedDays > 0
        ? Math.min(100, Math.round((effectivePresentDays / totalRecordedDays) * 100))
        : 0;

    return {
      computedWagesTotal: money([...dateMap.entries()].reduce((sum, [day, record]) => {
        const captured = (db.wageEntries || []).find(row => row.workerId === emp.id && row.date === day);
        const fallback = emp.wageType === "HOURLY" ? record.hoursWorked * emp.wageRate : record.status === "PRESENT" ? emp.wageRate : record.status === "HALF_DAY" ? emp.wageRate / 2 : 0;
        return sum + (captured ? captured.computedAmount : fallback);
      }, 0)),
      employeeId: emp.id,
      employeeName: emp.name,
      roleName: emp.roleName,
      wageType: emp.wageType,
      wageRate: Number(emp.wageRate) || 0,
      presentDays: effectivePresentDays,
      rawPresentDays: present,
      halfDays: halfDay,
      absentDays: absent,
      leaveDays: leave,
      holidays: holiday,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      effectivePresentDays,
      workingDays,
      attendancePercent,
    };
  });
}

// =================== WAGES & SALARY ===================
export function getWages(year?: number, month?: number): WageRecord[] {
  const db = getDatabase();
  let list = db.wages || [];
  if (year) list = list.filter((w) => w.year === year);
  if (month) list = list.filter((w) => w.month === month);
  const emps = db.employees || [];
  return list.map((w) => {
    const emp = emps.find((e) => e.id === w.employeeId);
    return {
      ...w,
      employeeName: emp?.name || w.employeeName || "Employee",
      roleName: emp?.roleName || w.roleName || "Staff",
    };
  });
}

export function calculateSalariesForMonth(year: number, month: number, workingDays: number = 26): WageRecord[] {
  return withTransaction(() => {
  if (!Number.isInteger(year) || year < 1900 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) throw new Error('Invalid salary period.');
  if (!Number.isInteger(workingDays) || workingDays < 1 || workingDays > 31) throw new Error('Working days must be between 1 and 31.');
  const db = getDatabase();
  const summary = getAttendanceSummary(year, month, workingDays);
  if (!db.wages) db.wages = [];
  const calculatedList: WageRecord[] = [];

  summary.forEach((item) => {
    let gross = 0;
    if (item.wageType === "DAILY") {
      gross = item.computedWagesTotal;
    } else if (item.wageType === "MONTHLY") {
      if (item.effectivePresentDays === 0 && item.absentDays === 0) {
        // No attendance logged for this employee this month
        gross = 0;
      } else if (item.absentDays > 0 && workingDays > 0) {
        // Deduction proportional to unexcused absent days
        const perDayRate = item.wageRate / workingDays;
        gross = Math.max(0, Math.round(item.wageRate - item.absentDays * perDayRate));
      } else {
        // Full monthly salary
        gross = Math.round(item.wageRate);
      }
    } else {
      gross = item.computedWagesTotal;
    }

    const existingIdx = db.wages.findIndex(
      (w) => w.employeeId === item.employeeId && w.year === year && w.month === month
    );
    const existing = existingIdx >= 0 ? db.wages[existingIdx] : undefined;
    if (existing?.status === 'PAID') { calculatedList.push(existing); return; }

    const bonus = existing?.bonus !== undefined ? Number(existing.bonus) || 0 : 0;
    const deductions = existing?.deductions !== undefined ? Number(existing.deductions) || 0 : 0;
    const net = Math.max(0, gross + bonus - deductions);

    const wageObj: WageRecord = {
      id: existing ? existing.id : `w_${randomUUID()}_${item.employeeId}`,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      roleName: item.roleName,
      month,
      year,
      workingDays,
      presentDays: item.effectivePresentDays,
      absentDays: item.absentDays,
      wageRate: item.wageRate,
      wageType: item.wageType,
      grossSalary: gross,
      deductions: deductions,
      bonus: bonus,
      netSalary: net,
      status: existing?.status || "PENDING",
      paymentDate: existing?.paymentDate,
      paymentMode: existing?.paymentMode,
      paymentReference: existing?.paymentReference,
      notes: existing?.notes,
      calculatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      db.wages[existingIdx] = wageObj;
    } else {
      db.wages.push(wageObj);
    }
    calculatedList.push(wageObj);
  });

  saveDatabase(db);
  return calculatedList;

  });
}

export function updateWageRecord(id: string, data: Partial<WageRecord>) {
  return withTransaction(() => {
  assertRecordId(id, data);
  for (const key of ['grossSalary', 'bonus', 'deductions'] as const) if (data[key] !== undefined) data[key] = finiteNumber(data[key], key);
  const current = getDatabase().wages.find(wage => wage.id === id);
  if (current?.status === 'PAID') throw new Error('Paid salary records cannot be changed.');
  if (current) for (const key of ['employeeId', 'year', 'month', 'status', 'grossSalary', 'wageRate', 'wageType', 'workingDays'] as const) {
    if (data[key] !== undefined && data[key] !== current[key]) throw new ValidationError(`Salary ${key} is derived and cannot be changed through an adjustment.`);
  }
  const db = getDatabase();
  if (!db.wages) db.wages = [];
  db.wages = db.wages.map((w) => {
    if (w.id === id) {
      const gross = data.grossSalary !== undefined ? Number(data.grossSalary) : w.grossSalary;
      const bonus = data.bonus !== undefined ? Number(data.bonus) : w.bonus;
      const deductions = data.deductions !== undefined ? Number(data.deductions) : w.deductions;
      const net = Math.max(0, gross + bonus - deductions);
      return {
        ...w,
        notes: data.notes === undefined ? w.notes : data.notes,
        grossSalary: gross,
        bonus,
        deductions,
        netSalary: net,
      };
    }
    return w;
  });
  saveDatabase(db);
  return db.wages.find((w) => w.id === id);

  });
}

export function markWagePaid(id: string, paymentDetails: { paymentDate: string; paymentMode: string; paymentReference?: string; notes?: string }) {
  return withTransaction(() => {
  dateKey(paymentDetails.paymentDate, 'Payment date'); requiredText(paymentDetails.paymentMode, 'Payment mode');
  const db = getDatabase();
  db.wages = db.wages.map((w) =>
    w.id === id
      ? {
          ...w,
          paymentDate: paymentDetails.paymentDate,
          paymentMode: paymentDetails.paymentMode,
          paymentReference: paymentDetails.paymentReference,
          notes: paymentDetails.notes,
          status: "PAID",
        }
      : w
  );
  saveDatabase(db);
  return db.wages.find((w) => w.id === id);

  });
}

// =================== LEAVES ===================
export function getLeaves(): LeaveRecord[] {
  const db = getDatabase();
  return db.leaves.map((l) => {
    const emp = db.employees.find((e) => e.id === l.employeeId);
    return { ...l, employeeName: emp?.name || "Employee" };
  });
}

function validateLeave(data: Omit<LeaveRecord, "id" | "appliedDate">) {
  dateRange(data.fromDate, data.toDate);
  referenceExists(data.employeeId, getDatabase().employees, "Employee");
  oneOf(data.leaveType, ["CASUAL", "SICK", "EMERGENCY", "UNPAID"], "Leave type");
  oneOf(data.status, ["APPROVED", "PENDING", "REJECTED"], "Leave status", "APPROVED");
  const days = Math.round((Date.parse(data.toDate) - Date.parse(data.fromDate)) / 86400000) + 1;
  if (days > 366) throw new ValidationError("A leave request cannot exceed 366 days.");
  return days;
}
function applyLeave(leave: LeaveRecord) {
  if (leave.status !== "APPROVED") return;
  const db = getDatabase();
  if (db.leaves.some(other => other.id !== leave.id && other.employeeId === leave.employeeId && other.status === "APPROVED" && other.fromDate <= leave.toDate && other.toDate >= leave.fromDate)) throw new ValidationError("Approved leave dates overlap an existing request.");
  leave.attendanceSnapshots = [];
  for (let time = Date.parse(leave.fromDate); time <= Date.parse(leave.toDate); time += 86400000) {
    const day = new Date(time).toISOString().slice(0, 10);
    leave.attendanceSnapshots.push(structuredClone({ date: day,
      attendance: db.attendance.find(row => row.employeeId === leave.employeeId && row.attendanceDate === day),
      workerAttendance: (db.workerAttendances || []).find(row => row.workerId === leave.employeeId && row.date === day),
      wage: (db.wageEntries || []).find(row => row.workerId === leave.employeeId && row.date === day),
    }));
    markAttendance({ employeeId: leave.employeeId, attendanceDate: day, status: "LEAVE", notes: `Leave record: ${leave.id}` });
  }
}
function reverseLeave(leave: LeaveRecord) {
  if (leave.status !== "APPROVED") return;
  if (!leave.attendanceSnapshots) throw new ValidationError("This legacy approved leave needs an attendance review before it can be reversed.");
  const db = getDatabase();
  for (const snapshot of leave.attendanceSnapshots) {
    const current = db.attendance.find(row => row.employeeId === leave.employeeId && row.attendanceDate === snapshot.date);
    if (current?.status !== "LEAVE" || current.notes !== `Leave record: ${leave.id}`) continue;
    const wage = (db.wageEntries || []).find(row => row.workerId === leave.employeeId && row.date === snapshot.date);
    if (wage && wage.paidAmount > (snapshot.wage?.computedAmount || 0)) throw new ValidationError("Leave reversal would conflict with paid wage records.");
    db.attendance = db.attendance.filter(row => row.employeeId !== leave.employeeId || row.attendanceDate !== snapshot.date);
    db.workerAttendances = (db.workerAttendances || []).filter(row => row.workerId !== leave.employeeId || row.date !== snapshot.date);
    db.wageEntries = (db.wageEntries || []).filter(row => row.workerId !== leave.employeeId || row.date !== snapshot.date);
    if (snapshot.attendance) db.attendance.push(snapshot.attendance);
    if (snapshot.workerAttendance) db.workerAttendances.push(snapshot.workerAttendance);
    if (snapshot.wage) { db.wageEntries.push(snapshot.wage); syncWageToCropExpense(snapshot.wage); }
    else if (wage) db.cropExpenses = (db.cropExpenses || []).filter(row => row.sourceRefId !== `wage_${wage.id}`);
  }
}
function createLeaveImpl(data: Omit<LeaveRecord, "id" | "appliedDate">): LeaveRecord {
  const days = validateLeave(data);
  const db = getDatabase();
  const leave: LeaveRecord = { ...data, id: `lv_${randomUUID()}`, attendanceSnapshots: undefined,
    employeeName: db.employees.find(row => row.id === data.employeeId)!.name,
    totalDays: days, appliedDate: new Date().toISOString().slice(0, 10), status: data.status || "APPROVED" };
  applyLeave(leave); db.leaves.unshift(leave); saveDatabase(db); return leave;
}
export function updateLeave(id: string, data: Partial<LeaveRecord>): LeaveRecord | undefined {
  return withTransaction(() => {
    assertRecordId(id, data); const db = getDatabase();
    const index = db.leaves.findIndex(row => row.id === id); if (index < 0) return undefined;
    const previous = db.leaves[index];
    const updated = { ...previous, ...data, attendanceSnapshots: undefined };
    updated.totalDays = validateLeave(updated);
    reverseLeave(previous); applyLeave(updated);
    db.leaves[index] = updated; saveDatabase(db); return updated;
  });
}
export function deleteLeave(id: string): boolean {
  return withTransaction(() => {
    const db = getDatabase(); const leave = db.leaves.find(row => row.id === id); if (!leave) return false;
    reverseLeave(leave); db.leaves = db.leaves.filter(row => row.id !== id); saveDatabase(db); return true;
  });
}

export function resetHrData() {
  return withTransaction(() => {
  const db = getDatabase();
  db.employeeRoles = [];
  db.employees = [];
  db.attendance = [];
  db.wages = [];
  db.leaves = [];
  saveDatabase(db);

  });
}

export function createEmployee(...args: Parameters<typeof createEmployeeImpl>) {
  return withTransaction(() => createEmployeeImpl(...args));
}

export function updateEmployee(...args: Parameters<typeof updateEmployeeImpl>) {
  return withTransaction(() => updateEmployeeImpl(...args));
}

export function markAttendance(...args: Parameters<typeof markAttendanceImpl>) {
  return withTransaction(() => markAttendanceImpl(...args));
}

export function bulkMarkAttendance(...args: Parameters<typeof bulkMarkAttendanceImpl>) {
  return withTransaction(() => bulkMarkAttendanceImpl(...args));
}

export function createLeave(...args: Parameters<typeof createLeaveImpl>) {
  return withTransaction(() => createLeaveImpl(...args));
}
