import { NextResponse } from "next/server";
import { updateInventoryRecord, InventoryType } from "@/lib/inventory-data";

export async function POST(req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  try {
    const body = await req.json();
    const updated = updateInventoryRecord(type as InventoryType, id, body);
    if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
