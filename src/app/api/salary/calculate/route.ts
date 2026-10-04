import { NextResponse } from "next/server";
import { calculateSalariesForMonth, getWages } from "@/lib/hr-data";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || new Date().getFullYear();
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const wages = getWages(year, month);
    return NextResponse.json(wages);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
