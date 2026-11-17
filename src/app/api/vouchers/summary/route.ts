import { getVouchersSummary } from "@/lib/vouchers-data";
import { NextResponse } from "next/server";

export async function GET() {
  const summary = getVouchersSummary();
  return NextResponse.json(summary);
}
