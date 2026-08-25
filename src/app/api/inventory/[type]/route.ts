import { NextResponse } from "next/server";
import { getInventory, InventoryType } from "@/lib/inventory-data";

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const list = getInventory(type as InventoryType);
  return NextResponse.json(list);
}
