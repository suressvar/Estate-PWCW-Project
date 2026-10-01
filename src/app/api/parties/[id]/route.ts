import { NextResponse } from "next/server";
import { updateParty, deleteParty, getPartyById } from "@/lib/parties-data";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const party = getPartyById(id);
  if (!party) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }
  return NextResponse.json(party);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = updateParty(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update party" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = deleteParty(id);
  if (!deleted) {
    return NextResponse.json({ error: "Party not found or could not be deleted" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
