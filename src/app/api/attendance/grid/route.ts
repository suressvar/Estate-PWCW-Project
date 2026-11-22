import { getAttendanceForMonth,getEmployees } from "@/lib/hr-data";
import { NextResponse } from "next/server";
import { salaryPeriodQuery } from "@/lib/salary-period";
import { errorMessage } from "@/lib/errors";

export async function GET(req: Request) {
  try {
  const { year, month } = salaryPeriodQuery(req);
  const employees = getEmployees();
  const records = getAttendanceForMonth(year, month);

  return NextResponse.json({
    year,
    month,
    employees,
    records,
  });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
