import { NextResponse } from "next/server";
import { getSalesAnalytics } from "@/lib/sales-data";

export async function GET() {
  const analytics = getSalesAnalytics();
  return NextResponse.json(analytics);
}
