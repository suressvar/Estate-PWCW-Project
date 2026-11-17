import { getInventory,InventoryType } from "@/lib/inventory-data";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const list = getInventory(type as InventoryType);
  return NextResponse.json(list);
}
