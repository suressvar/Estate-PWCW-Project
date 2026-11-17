import { getAllInventoryAlerts } from "@/lib/inventory-data";
import { NextResponse } from "next/server";

export async function GET() {
  const alerts = getAllInventoryAlerts();
  return NextResponse.json(alerts);
}
