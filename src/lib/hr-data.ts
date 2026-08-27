import {
  getDatabase,
  saveDatabase,
  EmployeeStatus,
  WageType,
  AttendanceStatus,
  WageStatus,
  LeaveType,
  LeaveStatus,
  EmployeeRoleItem,
  EmployeeItem,
  AttendanceRecord,
  WageRecord,
  LeaveRecord,
} from "./db-storage";

export type {
  EmployeeStatus,
  WageType,
  AttendanceStatus,
  WageStatus,
  LeaveType,
  LeaveStatus,
  EmployeeRoleItem,
  EmployeeItem,
  AttendanceRecord,
  WageRecord,
  LeaveRecord,
};

// =================== ROLES ===================
export function getEmployeeRoles(): EmployeeRoleItem[] {
  return getDatabase().employeeRoles;
}

export function createEmployeeRole(
  roleNameOrData: string | Omit<EmployeeRoleItem, "id">,
  description?: string
): EmployeeRoleItem {
  const db = getDatabase();
  const newRole: EmployeeRoleItem =
    typeof roleNameOrData === "string"
      ? { id: `er_${Date.now()}`, roleName: roleNameOrData, description }
      : { ...roleNameOrData, id: `er_${Date.now()}` };
  db.employeeRoles.push(newRole);
  saveDatabase(db);
  return newRole;
}

export function updateEmployeeRole(id: string, data: Partial<EmployeeRoleItem>): EmployeeRoleItem | undefined {
  const db = getDatabase();
  db.employeeRoles = db.employeeRoles.map((r) => (r.id === id ? { ...r, ...data } : r));
  saveDatabase(db);
  return db.employeeRoles.find((r) => r.id === id);
}

export function deleteEmployeeRole(id: string): boolean {
  const db = getDatabase();
  const isUsed = db.employees.some((e) => e.roleId === id);
  if (isUsed) return false;
  db.employeeRoles = db.employeeRoles.filter((r) => r.id !== id);
  saveDatabase(db);
  return true;
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

export function createEmployee(data: Omit<EmployeeItem, "id" | "createdAt">): EmployeeItem {
  const db = getDatabase();
  const role = data.roleId ? db.employeeRoles.find((r) => r.id === data.roleId) : undefined;
  const newEmp: EmployeeItem = {
    ...data,
    id: `emp_${Date.now()}`,
    roleName: role ? role.roleName : "Staff",
    createdAt: new Date().toISOString().split("T")[0],
  };
  db.employees.unshift(newEmp);
  saveDatabase(db);
  return newEmp;
}

export function updateEmployee(id: string, data: Partial<EmployeeItem>): EmployeeItem | undefined {
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
  saveDatabase(db);
  return getEmployeeById(id);
}

export function deleteEmployee(id: string): boolean {
  const db = getDatabase();
  const hasAttendance = db.attendance.some((a) => a.employeeId === id);
  const hasWages = db.wages.some((w) => w.employeeId === id);
  if (hasAttendance || hasWages) return false;
  db.employees = db.employees.filter((e) => e.id !== id);
  saveDatabase(db);
  return true;
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

export function markAttendance(payload: { employeeId: string; attendanceDate: string; status: AttendanceStatus; notes?: string; checkInTime?: string; checkOutTime?: string }): AttendanceRecord {
  const db = getDatabase();
  const existingIdx = db.attendance.findIndex(
    (a) => a.employeeId === payload.employeeId && a.attendanceDate === payload.attendanceDate
  );

  const emp = db.employees.find((e) => e.id === payload.employeeId);

  if (existingIdx >= 0) {
    db.attendance[existingIdx] = {
      ...db.attendance[existingIdx],
      ...payload,
      employeeName: emp?.name || "Unknown",
    };
    saveDatabase(db);
    return db.attendance[existingIdx];
  } else {
    const record: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...payload,
      employeeName: emp?.name || "Unknown",
      createdAt: new Date().toISOString(),
    };
    db.attendance.push(record);
    saveDatabase(db);
    return record;
  }
}

export function bulkMarkAttendance(attendanceDate: string, status: AttendanceStatus) {
  const db = getDatabase();
  const activeEmps = db.employees.filter((e) => e.status === "ACTIVE");
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

  return activeEmps.map((emp) => {
    const records = db.attendance.filter(
      (a) => a.employeeId === emp.id && a.attendanceDate.startsWith(prefix)
    );

    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let leave = 0;
    let holiday = 0;

    records.forEach((r) => {
      if (r.status === "PRESENT") present += 1;
      else if (r.status === "ABSENT") absent += 1;
      else if (r.status === "HALF_DAY") halfDay += 1;
      else if (r.status === "LEAVE") leave += 1;
      else if (r.status === "HOLIDAY") holiday += 1;
    });

    const effectivePresentDays = present + halfDay * 0.5;
    const attendancePercent = workingDays > 0 ? Math.min(100, Math.round((effectivePresentDays / workingDays) * 100)) : 0;

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      roleName: emp.roleName,
      wageType: emp.wageType,
      wageRate: emp.wageRate,
      presentDays: present,
      halfDays: halfDay,
      absentDays: absent,
      leaveDays: leave,
      holidays: holiday,
      effectivePresentDays,
      workingDays,
      attendancePercent,
    };
  });
}

// =================== WAGES & SALARY ===================
export function getWages(year?: number, month?: number): WageRecord[] {
  const db = getDatabase();
  let list = db.wages;
  if (year) list = list.filter((w) => w.year === year);
  if (month) list = list.filter((w) => w.month === month);
  return list.map((w) => {
    const emp = db.employees.find((e) => e.id === w.employeeId);
    return {
      ...w,
      employeeName: emp?.name || w.employeeName || "Employee",
      roleName: emp?.roleName || w.roleName || "Staff",
    };
  });
}

export function calculateSalariesForMonth(year: number, month: number, workingDays: number = 26) {
  const db = getDatabase();
  const summary = getAttendanceSummary(year, month, workingDays);
  const calculatedList: WageRecord[] = [];

  summary.forEach((item) => {
    let gross = 0;
    if (item.wageType === "DAILY") {
      gross = item.effectivePresentDays * item.wageRate;
    } else if (item.wageType === "MONTHLY") {
      gross = workingDays > 0 ? (item.effectivePresentDays / workingDays) * item.wageRate : item.wageRate;
    } else {
      gross = item.effectivePresentDays * 8 * item.wageRate;
    }

    gross = Math.round(gross);
    const deductions = 0;
    const bonus = 0;
    const net = gross + bonus - deductions;

    const existingIdx = db.wages.findIndex(
      (w) => w.employeeId === item.employeeId && w.year === year && w.month === month
    );

    const wageObj: WageRecord = {
      id: existingIdx >= 0 ? db.wages[existingIdx].id : `w_${Date.now()}_${item.employeeId}`,
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
      deductions: existingIdx >= 0 ? db.wages[existingIdx].deductions : deductions,
      bonus: existingIdx >= 0 ? db.wages[existingIdx].bonus : bonus,
      netSalary: existingIdx >= 0 ? (gross + db.wages[existingIdx].bonus - db.wages[existingIdx].deductions) : net,
      status: existingIdx >= 0 ? db.wages[existingIdx].status : "PENDING",
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
}

export function updateWageRecord(id: string, data: Partial<WageRecord>) {
  const db = getDatabase();
  db.wages = db.wages.map((w) => {
    if (w.id === id) {
      const gross = data.grossSalary !== undefined ? data.grossSalary : w.grossSalary;
      const bonus = data.bonus !== undefined ? data.bonus : w.bonus;
      const deductions = data.deductions !== undefined ? data.deductions : w.deductions;
      const net = gross + bonus - deductions;
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
}

export function markWagePaid(id: string, paymentDetails: { paymentDate: string; paymentMode: string; paymentReference?: string; notes?: string }) {
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
}

// =================== LEAVES ===================
export function getLeaves(): LeaveRecord[] {
  const db = getDatabase();
  return db.leaves.map((l) => {
    const emp = db.employees.find((e) => e.id === l.employeeId);
    return { ...l, employeeName: emp?.name || "Employee" };
  });
}

export function createLeave(data: Omit<LeaveRecord, "id" | "appliedDate">): LeaveRecord {
  const db = getDatabase();
  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const emp = db.employees.find((e) => e.id === data.employeeId);

  const newLeave: LeaveRecord = {
    ...data,
    id: `lv_${Date.now()}`,
    employeeName: emp?.name || "Employee",
    totalDays: diffDays || data.totalDays || 1,
    appliedDate: new Date().toISOString().split("T")[0],
    status: data.status || "APPROVED",
  };

  db.leaves.unshift(newLeave);

  // If approved, mark corresponding attendance dates as LEAVE
  if (newLeave.status === "APPROVED") {
    let curr = new Date(data.fromDate);
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
  const db = getDatabase();
  db.leaves = db.leaves.map((l) => (l.id === id ? { ...l, ...data } : l));
  saveDatabase(db);
  return db.leaves.find((l) => l.id === id);
}

export function deleteLeave(id: string): boolean {
  const db = getDatabase();
  db.leaves = db.leaves.filter((l) => l.id !== id);
  saveDatabase(db);
  return true;
}

export function resetHrData() {
  const db = getDatabase();
  db.employeeRoles = [];
  db.employees = [];
  db.attendance = [];
  db.wages = [];
  db.leaves = [];
  saveDatabase(db);
}
