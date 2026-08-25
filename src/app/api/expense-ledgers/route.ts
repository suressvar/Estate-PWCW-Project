import { NextResponse } from "next/server";
import { getExpenseLedgers, createExpenseLedger } from "@/lib/accounting-data";

export async function GET() {
  const ledgers = getExpenseLedgers();
  return NextResponse.json(ledgers);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newLedger = createExpenseLedger(body);
    return NextResponse.json(newLedger, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
