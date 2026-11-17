import { errorMessage as getErrorMessage } from "@/lib/errors";
import { deleteStockValuation,updateStockValuation } from "@/lib/inventory-data";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = updateStockValuation(id, body);
    if (!updated) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteStockValuation(id);
  return NextResponse.json({ success: ok });
}
