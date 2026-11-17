import { getSalesByInvoiceGroup } from "@/lib/sales-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const invoice = getSalesByInvoiceGroup(id);
  if (invoice.otherItems.length === 0) return NextResponse.json({ error: 'Sales invoice not found.' }, { status: 404 });
  return NextResponse.json(invoice);
}
