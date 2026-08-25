import { NextResponse } from "next/server";
import { generatePnLStatement } from "@/lib/pnl-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get("fromDate") || "2026-04-01";
  const toDate = searchParams.get("toDate") || "2027-03-31";

  const report = generatePnLStatement(fromDate, toDate);
  return NextResponse.json(report);
}
