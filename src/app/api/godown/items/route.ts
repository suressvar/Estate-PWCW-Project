import { errorMessage as getErrorMessage } from "@/lib/errors";
import { addGodownItem,getGodownItems,getGodownStats } from "@/lib/godown-data";
import { finiteNumber,positiveNumber,ValidationError } from '@/lib/validation';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const items = getGodownItems();
    const stats = getGodownStats();
    return NextResponse.json({ items, stats });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const newItem = addGodownItem({
      name: body.name.trim(),
      category: body.category || "General Estate Supplies",
      sourceVoucherNo: body.sourceVoucherNo,
      vendorName: body.vendorName || "Direct Procurement",
      receivedDate: body.receivedDate || new Date().toISOString().split("T")[0],
      totalReceivedQuantity: positiveNumber(body.quantity ?? body.totalReceivedQuantity, 'Received quantity'),
      availableQuantity: finiteNumber(body.availableQuantity ?? body.quantity ?? body.totalReceivedQuantity, 'Available quantity'),
      unit: body.unit || "units",
      ratePerUnit: finiteNumber(body.ratePerUnit, 'Rate per unit', 0, 0),
      location: body.location || "Godown Main Storage Bay",
      minStockAlert: finiteNumber(body.minStockAlert, 'Stock alert', 0, 5),
      notes: body.notes || "",
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: err instanceof ValidationError || err instanceof SyntaxError ? 400 : 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Bulk stock deletion is disabled to preserve financial history. Use the backed-up reset in Settings when intentionally resetting the entire estate.' }, { status: 409 });
}
