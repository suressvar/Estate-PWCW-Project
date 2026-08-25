import { NextResponse } from "next/server";
import { getLedgerGroups, createLedgerGroup } from "@/lib/accounting-data";

export async function GET() {
  const groups = getLedgerGroups();
  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newGroup = createLedgerGroup(body);
    return NextResponse.json(newGroup, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
