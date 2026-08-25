import { NextResponse } from "next/server";
import { getVouchersSummary } from "@/lib/vouchers-data";

export async function GET() {
  const summary = getVouchersSummary();
  return NextResponse.json(summary);
}
