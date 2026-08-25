import { NextResponse } from "next/server";
import { updateLedgerGroup, deleteLedgerGroup } from "@/lib/accounting-data";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = updateLedgerGroup(id, body);
    if (!updated) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteLedgerGroup(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Cannot delete group with existing attached accounts" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}
