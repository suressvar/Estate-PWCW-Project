import { NextResponse } from "next/server";
import { getAttendanceSummary } from "@/lib/hr-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
  const workingDays = parseInt(searchParams.get("workingDays") || "26");

  const summary = getAttendanceSummary(year, month, workingDays);
  return NextResponse.json(summary);
}
