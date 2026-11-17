import { getSalesAnalytics } from "@/lib/sales-data";
import { NextResponse } from "next/server";

export async function GET() {
  const analytics = getSalesAnalytics();
  return NextResponse.json(analytics);
}
