import { errorMessage as getErrorMessage } from "@/lib/errors";
import { calculateSalariesForMonth,getWages } from "@/lib/hr-data";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || new Date().getFullYear();
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const wages = getWages(year, month);
    return NextResponse.json(wages);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { year, month, workingDays } = await req.json();
    if (!year || !month) {
      return NextResponse.json({ error: "Year and month required" }, { status: 400 });
    }
    const computed = calculateSalariesForMonth(Number(year), Number(month), Number(workingDays) || 26);
    return NextResponse.json(computed);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
