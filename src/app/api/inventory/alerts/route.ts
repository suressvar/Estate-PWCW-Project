import { NextResponse } from "next/server";
import { getAllInventoryAlerts } from "@/lib/inventory-data";

export async function GET() {
  const alerts = getAllInventoryAlerts();
  return NextResponse.json(alerts);
}
