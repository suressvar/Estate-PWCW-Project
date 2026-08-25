import { NextResponse } from "next/server";
import { calculateSalariesForMonth } from "@/lib/hr-data";

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
