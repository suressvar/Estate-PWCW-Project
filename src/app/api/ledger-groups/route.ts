import { createLedgerGroup,getLedgerGroups } from "@/lib/accounting-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function GET() {
  const groups = getLedgerGroups();
  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newGroup = createLedgerGroup(body);
    return NextResponse.json(newGroup, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
