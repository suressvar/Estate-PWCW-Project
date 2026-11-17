import { errorMessage as getErrorMessage } from "@/lib/errors";
import { createStockValuation,getStockValuations } from "@/lib/inventory-data";
import { NextResponse } from "next/server";

export async function GET() {
  const valuations = getStockValuations();
  return NextResponse.json(valuations);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = createStockValuation(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
