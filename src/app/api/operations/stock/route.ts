import { NextResponse } from "next/server";
import {
  getModuleStockSummary,
  addGodownItem,
} from "@/lib/godown-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get("module") || "Fertilizer";
    const data = getModuleStockSummary(moduleName);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const qty = Number(body.quantity) || 1;
    const rate = Number(body.ratePerUnit) || 0;

    const newItem = addGodownItem({
      name: body.name.trim(),
      category: body.category || "General Estate Supplies",
      sourceVoucherNo: body.sourceVoucherNo,
      vendorName: body.vendorName || "Direct Supplier Procurement",
      receivedDate: body.receivedDate || new Date().toISOString().split("T")[0],
      totalReceivedQuantity: qty,
      availableQuantity: qty,
      unit: body.unit || "units",
      ratePerUnit: rate,
      location: body.location || "Godown Central Bay",
      minStockAlert: Number(body.minStockAlert) || 5,
      notes: body.notes || `Inwarded from ${body.module || "Plot Operations"} module`,
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
