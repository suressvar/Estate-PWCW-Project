import { createExpenseLedger,getExpenseLedgers } from "@/lib/accounting-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function GET() {
  const ledgers = getExpenseLedgers();
  return NextResponse.json(ledgers);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newLedger = createExpenseLedger(body);
    return NextResponse.json(newLedger, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
