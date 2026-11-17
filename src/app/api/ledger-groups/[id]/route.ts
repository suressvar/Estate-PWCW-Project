import { deleteLedgerGroup,updateLedgerGroup } from "@/lib/accounting-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = updateLedgerGroup(id, body);
    if (!updated) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
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
