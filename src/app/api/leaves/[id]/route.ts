import { NextResponse } from "next/server";
import { updateLeave, deleteLeave } from "@/lib/hr-data";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = updateLeave(id, body);
    if (!updated) return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteLeave(id);
  return NextResponse.json({ success: ok });
}
