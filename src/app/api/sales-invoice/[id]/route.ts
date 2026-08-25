import { NextResponse } from "next/server";
import { getSalesByInvoiceGroup } from "@/lib/sales-data";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = getSalesByInvoiceGroup(id);
  return NextResponse.json(invoice);
}
