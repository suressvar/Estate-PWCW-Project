export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "RESIGNED";
export type WageType = "DAILY" | "MONTHLY" | "HOURLY";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "HOLIDAY";
export type WageStatus = "PENDING" | "PAID";
export type LeaveType = "CASUAL" | "SICK" | "EMERGENCY" | "UNPAID";
export type LeaveStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface EmployeeRoleItem {
  id: string;
  roleName: string;
  description?: string;
}

export interface EmployeeItem {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  roleId?: string;
  roleName?: string;
  joinDate?: string;
  wageType: WageType;
  wageRate: number;
  status: EmployeeStatus;
  notes?: string;
  photoPath?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  aadhaarNo?: string;
  bankAccountNo?: string;
  bankName?: string;
  ifscCode?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  attendanceDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface WageRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  roleName?: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  wageRate: number;
  wageType: WageType;
  grossSalary: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  paymentDate?: string;
  paymentMode?: string;
  paymentReference?: string;
  status: WageStatus;
  notes?: string;
  calculatedAt: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  appliedDate: string;
  notes?: string;
}

// Seed Roles
let mockEmployeeRoles: EmployeeRoleItem[] = [
  { id: "er-1", roleName: "Farm Worker", description: "Field and shed maintenance, feed preparation" },
  { id: "er-2", roleName: "Supervisor", description: "Operations supervision and daily attendance logging" },
  { id: "er-3", roleName: "Driver & Equipment Operator", description: "Tractor, tiller and transport driver" },
  { id: "er-4", roleName: "Veterinary Assistant", description: "Livestock health inspection and medication administration" },
  { id: "er-5", roleName: "Security Guard", description: "Estate gate security and perimeter monitoring" },
  { id: "er-6", roleName: "Admin & Accounts Staff", description: "Voucher recording and procurement tracking" },
  { id: "er-7", roleName: "Estate Manager", description: "Overall farm administration and crop management" },
];

// Seed Employees
let mockEmployees: EmployeeItem[] = [
  { id: "emp-1", name: "Murugan K.", phone: "+91 98421 22334", address: "North Colony, Ranga Estate Quarters", roleId: "er-1", roleName: "Farm Worker", joinDate: "2024-03-01", wageType: "DAILY", wageRate: 550, status: "ACTIVE", notes: "Experienced in tractor operations and crop management", emergencyContact: "Selvi M. (Wife)", emergencyPhone: "+91 98421 22335", aadhaarNo: "XXXX-XXXX-4819", bankAccountNo: "330910123847", bankName: "State Bank of India", ifscCode: "SBIN0001234", createdAt: "2024-03-01" },
  { id: "emp-2", name: "Selvi Murugan", phone: "+91 98421 22335", address: "North Colony, Ranga Estate Quarters", roleId: "er-1", roleName: "Farm Worker", joinDate: "2024-03-01", wageType: "DAILY", wageRate: 450, status: "ACTIVE", notes: "Milking, shed cleaning, kid care", emergencyContact: "Murugan K. (Husband)", emergencyPhone: "+91 98421 22334", aadhaarNo: "XXXX-XXXX-9122", bankAccountNo: "330910123848", bankName: "State Bank of India", ifscCode: "SBIN0001234", createdAt: "2024-03-01" },
  { id: "emp-3", name: "Ramasamy V.", phone: "+91 97890 33445", address: "South Gate Quarters", roleId: "er-3", roleName: "Driver & Equipment Operator", joinDate: "2024-05-15", wageType: "DAILY", wageRate: 650, status: "ACTIVE", notes: "Tractor, JCB and Chaff Cutter specialist", emergencyContact: "Kavitha R.", emergencyPhone: "+91 97890 33446", aadhaarNo: "XXXX-XXXX-5512", bankAccountNo: "910283746192", bankName: "Canara Bank", ifscCode: "CNRB0002345", createdAt: "2024-05-15" },
  { id: "emp-4", name: "Kuppusamy M.", phone: "+91 94432 88776", address: "East Enclave", roleId: "er-2", roleName: "Supervisor", joinDate: "2023-11-01", wageType: "MONTHLY", wageRate: 22000, status: "ACTIVE", notes: "Shed supervisor & logistics coordinator", emergencyContact: "Meena K.", emergencyPhone: "+91 94432 88777", aadhaarNo: "XXXX-XXXX-7731", bankAccountNo: "449018237461", bankName: "Indian Overseas Bank", ifscCode: "IOBA0003456", createdAt: "2023-11-01" },
  { id: "emp-5", name: "Ganesan P.", phone: "+91 93601 55667", address: "Main Gate Cottage", roleId: "er-5", roleName: "Security Guard", joinDate: "2025-01-10", wageType: "MONTHLY", wageRate: 15000, status: "ACTIVE", notes: "Night shift security supervisor", emergencyContact: "Latha G.", emergencyPhone: "+91 93601 55668", aadhaarNo: "XXXX-XXXX-8821", bankAccountNo: "550192837465", bankName: "HDFC Bank", ifscCode: "HDFC0004567", createdAt: "2025-01-10" },
];

// Seed Attendance Records for current month
let mockAttendance: AttendanceRecord[] = [
  { id: "att-1", employeeId: "emp-1", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "08:00", checkOutTime: "17:00", createdAt: "2026-08-01" },
  { id: "att-2", employeeId: "emp-1", attendanceDate: "2026-08-02", status: "PRESENT", checkInTime: "08:00", checkOutTime: "17:00", createdAt: "2026-08-02" },
  { id: "att-3", employeeId: "emp-1", attendanceDate: "2026-08-03", status: "HALF_DAY", checkInTime: "08:00", checkOutTime: "12:30", notes: "Personal work", createdAt: "2026-08-03" },
  { id: "att-4", employeeId: "emp-2", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "08:15", checkOutTime: "17:00", createdAt: "2026-08-01" },
  { id: "att-5", employeeId: "emp-2", attendanceDate: "2026-08-02", status: "PRESENT", checkInTime: "08:10", checkOutTime: "17:00", createdAt: "2026-08-02" },
  { id: "att-6", employeeId: "emp-3", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "08:00", checkOutTime: "17:00", createdAt: "2026-08-01" },
  { id: "att-7", employeeId: "emp-4", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "07:30", checkOutTime: "18:00", createdAt: "2026-08-01" },
  { id: "att-8", employeeId: "emp-5", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "18:00", checkOutTime: "06:00", createdAt: "2026-08-01" },
];

// Seed Wages
let mockWages: WageRecord[] = [
  { id: "w-1", employeeId: "emp-1", employeeName: "Murugan K.", roleName: "Farm Worker", month: 7, year: 2026, workingDays: 26, presentDays: 25.5, absentDays: 0.5, wageRate: 550, wageType: "DAILY", grossSalary: 14025, deductions: 500, bonus: 1000, netSalary: 14525, status: "PAID", paymentDate: "2026-08-05", paymentMode: "Bank Transfer", paymentReference: "IMPS-20260805-01", notes: "July salary settled", calculatedAt: "2026-08-01" },
  { id: "w-2", employeeId: "emp-2", employeeName: "Selvi Murugan", roleName: "Farm Worker", month: 7, year: 2026, workingDays: 26, presentDays: 26, absentDays: 0, wageRate: 450, wageType: "DAILY", grossSalary: 11700, deductions: 0, bonus: 500, netSalary: 12200, status: "PAID", paymentDate: "2026-08-05", paymentMode: "Bank Transfer", paymentReference: "IMPS-20260805-02", notes: "100% attendance bonus", calculatedAt: "2026-08-01" },
  { id: "w-3", employeeId: "emp-4", employeeName: "Kuppusamy M.", roleName: "Supervisor", month: 7, year: 2026, workingDays: 26, presentDays: 26, absentDays: 0, wageRate: 22000, wageType: "MONTHLY", grossSalary: 22000, deductions: 1000, bonus: 1500, netSalary: 22500, status: "PAID", paymentDate: "2026-08-05", paymentMode: "Bank Transfer", paymentReference: "NEFT-IOB-8891", notes: "Supervisory stipend included", calculatedAt: "2026-08-01" },
];

// Seed Leaves
let mockLeaves: LeaveRecord[] = [
  { id: "lv-1", employeeId: "emp-1", employeeName: "Murugan K.", leaveType: "CASUAL", fromDate: "2026-08-10", toDate: "2026-08-11", totalDays: 2, reason: "Family temple festival function", status: "APPROVED", approvedBy: "Estate Manager", appliedDate: "2026-08-05", notes: "Advance notice given" },
  { id: "lv-2", employeeId: "emp-3", employeeName: "Ramasamy V.", leaveType: "SICK", fromDate: "2026-08-15", toDate: "2026-08-15", totalDays: 1, reason: "Viral fever recovery", status: "APPROVED", approvedBy: "Supervisor", appliedDate: "2026-08-14", notes: "Doctor cert provided" },
];

// =================== ROLES ===================
export function getEmployeeRoles(): EmployeeRoleItem[] {
  return mockEmployeeRoles;
}

export function createEmployeeRole(roleName: string, description?: string): EmployeeRoleItem {
  const newRole: EmployeeRoleItem = {
    id: `er_${Date.now()}`,
    roleName,
    description,
  };
  mockEmployeeRoles.push(newRole);
  return newRole;
}

export function deleteEmployeeRole(id: string): boolean {
  const isUsed = mockEmployees.some((e) => e.roleId === id);
  if (isUsed) return false;
  mockEmployeeRoles = mockEmployeeRoles.filter((r) => r.id !== id);
  return true;
}

// =================== EMPLOYEES ===================
export function getEmployees(): EmployeeItem[] {
  return mockEmployees.map((e) => {
    const role = mockEmployeeRoles.find((r) => r.id === e.roleId);
    return {
      ...e,
      roleName: role ? role.roleName : e.roleName || "Staff",
    };
  });
}

export function getEmployeeById(id: string): EmployeeItem | undefined {
  const emp = mockEmployees.find((e) => e.id === id);
  if (!emp) return undefined;
  const role = mockEmployeeRoles.find((r) => r.id === emp.roleId);
  return {
    ...emp,
    roleName: role ? role.roleName : emp.roleName || "Staff",
  };
}

export function createEmployee(data: Omit<EmployeeItem, "id" | "createdAt">): EmployeeItem {
  const role = data.roleId ? mockEmployeeRoles.find((r) => r.id === data.roleId) : undefined;
  const newEmp: EmployeeItem = {
    ...data,
    id: `emp_${Date.now()}`,
    roleName: role ? role.roleName : "Staff",
    createdAt: new Date().toISOString().split("T")[0],
  };
  mockEmployees.unshift(newEmp);
  return newEmp;
}

export function updateEmployee(id: string, data: Partial<EmployeeItem>): EmployeeItem | undefined {
  const role = data.roleId ? mockEmployeeRoles.find((r) => r.id === data.roleId) : undefined;
  mockEmployees = mockEmployees.map((e) =>
    e.id === id
      ? {
          ...e,
          ...data,
          roleName: role ? role.roleName : data.roleName || e.roleName,
        }
      : e
  );
  return getEmployeeById(id);
}

export function deleteEmployee(id: string): boolean {
  // Check if employee has attendance or wages
  const hasAttendance = mockAttendance.some((a) => a.employeeId === id);
  const hasWages = mockWages.some((w) => w.employeeId === id);
  if (hasAttendance || hasWages) return false;
  mockEmployees = mockEmployees.filter((e) => e.id !== id);
  return true;
}

// =================== ATTENDANCE ===================
export function getAttendanceForMonth(year: number, month: number): AttendanceRecord[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return mockAttendance
    .filter((a) => a.attendanceDate.startsWith(prefix))
    .map((a) => {
      const emp = mockEmployees.find((e) => e.id === a.employeeId);
      return { ...a, employeeName: emp?.name || "Unknown" };
    });
}

export function markAttendance(payload: { employeeId: string; attendanceDate: string; status: AttendanceStatus; notes?: string; checkInTime?: string; checkOutTime?: string }) {
  const existingIdx = mockAttendance.findIndex(
    (a) => a.employeeId === payload.employeeId && a.attendanceDate === payload.attendanceDate
  );

  const emp = mockEmployees.find((e) => e.id === payload.employeeId);

  if (existingIdx >= 0) {
    mockAttendance[existingIdx] = {
      ...mockAttendance[existingIdx],
      ...payload,
      employeeName: emp?.name || "Unknown",
    };
    return mockAttendance[existingIdx];
  } else {
    const record: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...payload,
      employeeName: emp?.name || "Unknown",
      createdAt: new Date().toISOString(),
    };
    mockAttendance.push(record);
    return record;
  }
}

export function bulkMarkAttendance(attendanceDate: string, status: AttendanceStatus) {
  const activeEmps = mockEmployees.filter((e) => e.status === "ACTIVE");
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
  const activeEmps = getEmployees();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;

  return activeEmps.map((emp) => {
    const records = mockAttendance.filter(
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
  let list = mockWages;
  if (year) list = list.filter((w) => w.year === year);
  if (month) list = list.filter((w) => w.month === month);
  return list.map((w) => {
    const emp = mockEmployees.find((e) => e.id === w.employeeId);
    return {
      ...w,
      employeeName: emp?.name || w.employeeName || "Employee",
      roleName: emp?.roleName || w.roleName || "Staff",
    };
  });
}

export function calculateSalariesForMonth(year: number, month: number, workingDays: number = 26) {
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

    const existingIdx = mockWages.findIndex(
      (w) => w.employeeId === item.employeeId && w.year === year && w.month === month
    );

    const wageObj: WageRecord = {
      id: existingIdx >= 0 ? mockWages[existingIdx].id : `w_${Date.now()}_${item.employeeId}`,
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
      deductions: existingIdx >= 0 ? mockWages[existingIdx].deductions : deductions,
      bonus: existingIdx >= 0 ? mockWages[existingIdx].bonus : bonus,
      netSalary: existingIdx >= 0 ? (gross + mockWages[existingIdx].bonus - mockWages[existingIdx].deductions) : net,
      status: existingIdx >= 0 ? mockWages[existingIdx].status : "PENDING",
      calculatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      mockWages[existingIdx] = wageObj;
    } else {
      mockWages.push(wageObj);
    }
    calculatedList.push(wageObj);
  });

  return calculatedList;
}

export function updateWageRecord(id: string, data: Partial<WageRecord>) {
  mockWages = mockWages.map((w) => {
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
  return mockWages.find((w) => w.id === id);
}

export function markWagePaid(id: string, paymentDetails: { paymentDate: string; paymentMode: string; paymentReference?: string; notes?: string }) {
  mockWages = mockWages.map((w) =>
    w.id === id
      ? {
          ...w,
          ...paymentDetails,
          status: "PAID",
        }
      : w
  );
  return mockWages.find((w) => w.id === id);
}

// =================== LEAVES ===================
export function getLeaves(): LeaveRecord[] {
  return mockLeaves.map((l) => {
    const emp = mockEmployees.find((e) => e.id === l.employeeId);
    return { ...l, employeeName: emp?.name || "Employee" };
  });
}

export function createLeave(data: Omit<LeaveRecord, "id" | "appliedDate">) {
  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const emp = mockEmployees.find((e) => e.id === data.employeeId);

  const newLeave: LeaveRecord = {
    ...data,
    id: `lv_${Date.now()}`,
    employeeName: emp?.name || "Employee",
    totalDays: diffDays || data.totalDays || 1,
    appliedDate: new Date().toISOString().split("T")[0],
    status: data.status || "APPROVED",
  };

  mockLeaves.unshift(newLeave);

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

  return newLeave;
}

export function updateLeave(id: string, data: Partial<LeaveRecord>) {
  mockLeaves = mockLeaves.map((l) => (l.id === id ? { ...l, ...data } : l));
  return mockLeaves.find((l) => l.id === id);
}

export function deleteLeave(id: string): boolean {
  mockLeaves = mockLeaves.filter((l) => l.id !== id);
  return true;
}

export function resetHrData() {
  mockEmployeeRoles = [];
  mockEmployees = [];
  mockAttendance = [];
  mockWages = [];
  mockLeaves = [];
}
