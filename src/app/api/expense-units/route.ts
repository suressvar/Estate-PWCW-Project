import { NextResponse } from "next/server";
import { getExpenseUnits } from "@/lib/vouchers-data";

export async function GET() {
  const units = getExpenseUnits();
  return NextResponse.json(units);
}
