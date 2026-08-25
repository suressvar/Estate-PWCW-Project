import { NextResponse } from "next/server";
import { getAttendanceForMonth, getEmployees } from "@/lib/hr-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));

  const employees = getEmployees();
  const records = getAttendanceForMonth(year, month);

  return NextResponse.json({
    year,
    month,
    employees,
    records,
  });
}
