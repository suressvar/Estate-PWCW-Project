import { NextResponse } from "next/server";
import { getGodownItems, getGodownStats, addGodownItem } from "@/lib/godown-data";

export async function GET() {
  try {
    const items = getGodownItems();
    const stats = getGodownStats();
    return NextResponse.json({ items, stats });
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

    const newItem = addGodownItem({
      name: body.name.trim(),
      category: body.category || "General Estate Supplies",
      sourceVoucherNo: body.sourceVoucherNo,
      vendorName: body.vendorName || "Direct Procurement",
      receivedDate: body.receivedDate || new Date().toISOString().split("T")[0],
      totalReceivedQuantity: Number(body.quantity) || Number(body.totalReceivedQuantity) || 1,
      availableQuantity: Number(body.availableQuantity) || Number(body.quantity) || 1,
      unit: body.unit || "units",
      ratePerUnit: Number(body.ratePerUnit) || 0,
      location: body.location || "Godown Main Storage Bay",
      minStockAlert: Number(body.minStockAlert) || 5,
      notes: body.notes || "",
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { clearAllGodownData } = await import("@/lib/godown-data");
    const { resetTransactionLogs } = await import("@/lib/transaction-logs");
    clearAllGodownData();
    resetTransactionLogs();
    return NextResponse.json({ success: true, message: "All Godown items, movements, and test logs cleared successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
