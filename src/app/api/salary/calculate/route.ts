import { errorMessage as getErrorMessage } from "@/lib/errors";
import { calculateSalariesForMonth,getWages } from "@/lib/hr-data";
import { NextResponse } from "next/server";
import { salaryPeriod, salaryPeriodQuery } from "@/lib/salary-period";

export async function GET(req: Request) {
  try {
    const { year, month } = salaryPeriodQuery(req);
    const wages = getWages(year, month);
    return NextResponse.json(wages);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { year, month, workingDays } = salaryPeriod(await req.json(), false);
    const computed = calculateSalariesForMonth(year, month, workingDays);
    return NextResponse.json(computed);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
