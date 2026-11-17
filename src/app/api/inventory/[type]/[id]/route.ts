import { errorMessage as getErrorMessage } from "@/lib/errors";
import { InventoryType,updateInventoryRecord } from "@/lib/inventory-data";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  try {
    const body = await req.json();
    const updated = updateInventoryRecord(type as InventoryType, id, body);
    if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
