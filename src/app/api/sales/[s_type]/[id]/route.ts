import { NextResponse } from "next/server";
import { getSaleById, updateSaleItem, deleteSaleItem, SaleType } from "@/lib/sales-data";

export async function GET(req: Request, { params }: { params: Promise<{ s_type: string; id: string }> }) {
  const { s_type, id } = await params;
  const item = getSaleById(s_type as SaleType, id);
  if (!item) return NextResponse.json({ error: "Sale record not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ s_type: string; id: string }> }) {
  const { s_type, id } = await params;
  try {
    const body = await req.json();
    const updated = updateSaleItem(s_type as SaleType, id, body);
    if (!updated) return NextResponse.json({ error: "Sale record not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ s_type: string; id: string }> }) {
  const { s_type, id } = await params;
  const ok = deleteSaleItem(s_type as SaleType, id);
  return NextResponse.json({ success: ok });
}
