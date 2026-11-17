import { employeeDailyRate } from "./payroll";
import { getWorkers, upsertWorkerAttendanceAndWage } from "./worker-data";
import { referenceExists } from "./validation";
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
WorkerAttendanceStatus,
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

  db.employees = db.employees.filter((e) => e.id !== id);
  db.attendance = db.attendance.filter((a) => a.employeeId !== id);
  db.wages = db.wages.filter((w) => w.employeeId !== id);
  db.leaves = db.leaves.filter((l) => l.employeeId !== id);

  if (db.workers) {
    db.workers = db.workers.filter((w) => w.id !== id);
  }
  if (db.workerAttendances) {
    db.workerAttendances = db.workerAttendances.filter((wa) => wa.workerId !== id);
  }
  if (db.wageEntries) {
    db.wageEntries = db.wageEntries.filter((we) => we.workerId !== id);
  }
  if (db.workerActivityLogs) {
    db.workerActivityLogs = db.workerActivityLogs.filter((al) => al.workerId !== id);
  }

  saveDatabase(db);
  return true;

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
          status: wa.status as AttendanceStatus,
          hoursWorked: Number(wa.hoursWorked) || (wa.status === "PRESENT" ? 8 : wa.status === "HALF_DAY" ? 4 : 0),
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
        totalHoursWorked += rec.hoursWorked || 8;
      } else if (rec.status === "ABSENT") {
        absent += 1;
      } else if (rec.status === "HALF_DAY") {
        halfDay += 1;
        totalHoursWorked += rec.hoursWorked || 4;
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
      gross = Math.round(item.effectivePresentDays * item.wageRate);
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
      // HOURLY / OTHER
      if (item.totalHoursWorked > 0) {
        gross = Math.round(item.totalHoursWorked * item.wageRate);
      } else {
        gross = Math.round(item.effectivePresentDays * 8 * item.wageRate);
      }
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
        ...data,
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
          ...paymentDetails,
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

function createLeaveImpl(data: Omit<LeaveRecord, "id" | "appliedDate">): LeaveRecord {
  dateRange(data.fromDate, data.toDate);
  const db = getDatabase();
  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const emp = db.employees.find((e) => e.id === data.employeeId);

  const newLeave: LeaveRecord = {
    ...data,
    id: `lv_${randomUUID()}`,
    employeeName: emp?.name || "Employee",
    totalDays: diffDays || data.totalDays || 1,
    appliedDate: new Date().toISOString().split("T")[0],
    status: data.status || "APPROVED",
  };

  db.leaves.unshift(newLeave);

  // If approved, mark corresponding attendance dates as LEAVE
  if (newLeave.status === "APPROVED") {
    const curr = new Date(data.fromDate);
    const end = new Date(data.toDate);
    while (curr <= end) {
      const dateStr = curr.toISOString().split("T")[0];
      markAttendance({
        employeeId: data.employeeId,
        attendanceDate: dateStr,
        status: "LEAVE",
        notes: `Leave: ${data.leaveType} (${data.reason || ""})`,
      });
      curr.setDate(curr.getDate() + 1);
    }
  }

  saveDatabase(db);
  return newLeave;
}

export function updateLeave(id: string, data: Partial<LeaveRecord>): LeaveRecord | undefined {
  return withTransaction(() => {
  assertRecordId(id, data);
  const db = getDatabase();
  db.leaves = db.leaves.map((l) => (l.id === id ? { ...l, ...data } : l));
  saveDatabase(db);
  return db.leaves.find((l) => l.id === id);

  });
}

export function deleteLeave(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  db.leaves = db.leaves.filter((l) => l.id !== id);
  saveDatabase(db);
  return true;

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
