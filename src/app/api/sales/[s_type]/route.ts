import { NextResponse } from "next/server";
import { getOtherSales, createMultiItemSale } from "@/lib/sales-data";

export const dynamic = "force-dynamic";

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

export async function DELETE(req: Request, { params }: { params: Promise<{ s_type: string }> }) {
  const { s_type } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    const { deleteSale, clearAllSales } = await import("@/lib/sales-data");
    if (id) {
      deleteSale(s_type, id);
      return NextResponse.json({ success: true, message: `Sale ${id} deleted.` });
    } else {
      clearAllSales();
      return NextResponse.json({ success: true, message: "All sales entries cleared successfully." });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
