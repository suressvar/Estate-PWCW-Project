import { errorMessage as getErrorMessage } from "@/lib/errors";
import { markWagePaid,updateWageRecord } from "@/lib/hr-data";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = markWagePaid(id, body);
    if (!updated) return NextResponse.json({ error: "Wage record not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = updateWageRecord(id, body);
    if (!updated) return NextResponse.json({ error: "Wage record not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
