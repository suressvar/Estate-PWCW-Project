import { errorMessage as getErrorMessage } from "@/lib/errors";
import { createMultiItemSale,getOtherSales } from "@/lib/sales-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getOtherSales());
}

export async function POST(req: Request, { params }: { params: Promise<{ s_type: string }> }) {
  const { s_type } = await params;
  try {
    const body = await req.json();
    const result = createMultiItemSale(s_type, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ s_type: string }> }) {
  const { s_type } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    const { deleteSale } = await import("@/lib/sales-data");
    if (id) {
      deleteSale(s_type, id);
      return NextResponse.json({ success: true, message: `Sale ${id} deleted.` });
    } else {
      return NextResponse.json({ error: 'A sale ID is required. Use the backed-up reset in Settings to intentionally clear all estate records.' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
