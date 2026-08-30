import { NextResponse } from "next/server";
import { getSalesByInvoiceGroup } from "@/lib/sales-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: any }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const invoice = getSalesByInvoiceGroup(id);
  return NextResponse.json(invoice);
}
