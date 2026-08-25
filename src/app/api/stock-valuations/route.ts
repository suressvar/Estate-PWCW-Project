import { NextResponse } from "next/server";
import { getStockValuations, createStockValuation } from "@/lib/inventory-data";

export async function GET() {
  const valuations = getStockValuations();
  return NextResponse.json(valuations);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = createStockValuation(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
