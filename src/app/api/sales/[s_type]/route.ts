import { NextResponse } from "next/server";
import { getOtherSales, createMultiItemSale } from "@/lib/sales-data";

export async function GET(req: Request, { params }: { params: Promise<{ s_type: string }> }) {
  return NextResponse.json(getOtherSales());
}

export async function POST(req: Request, { params }: { params: Promise<{ s_type: string }> }) {
  const { s_type } = await params;
  try {
    const body = await req.json();
    const result = createMultiItemSale(s_type, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
