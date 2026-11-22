import { getAttendanceSummary } from "@/lib/hr-data";
import { NextResponse } from "next/server";
import { salaryPeriodQuery } from "@/lib/salary-period";
import { errorMessage } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const { year, month, workingDays } = salaryPeriodQuery(req);
    return NextResponse.json(getAttendanceSummary(year, month, workingDays));
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
