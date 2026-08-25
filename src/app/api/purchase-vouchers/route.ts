import { NextResponse } from "next/server";
import { getGeneralPurchaseLogs, addGeneralPurchaseLog, deleteGeneralPurchaseLog } from "@/lib/transaction-logs";

export async function GET() {
  return NextResponse.json(getGeneralPurchaseLogs());
}

export async function POST(request: Request) {
  const body = await request.json();
  const cost = Number(body.cost) || Number(body.totalAmount) || Number(body.subtotal) || 0;

  const newLog = addGeneralPurchaseLog({
    voucherNo: body.voucherNo,
    category: body.category || "General Estate Supplies",
    plotCropId: body.plotCropId || undefined,
    plotName: body.plotName || "General Estate",
    cropActivityName: body.cropActivityName || "N/A",
    vendorName: body.vendorName || "General Supplier",
    vendorBillNo: body.vendorBillNo || "",
    vendorContact: body.vendorContact || "",
    vendorGstin: body.vendorGstin || "",
    description: body.description || `${body.category || "Estate Supplies"} Purchase`,
    items: body.items || [
      {
        id: `item_1`,
        description: body.description || "General Purchase Item",
        quantity: 1,
        unit: "units",
        rate: cost,
        amount: cost,
      },
    ],
    subtotal: Number(body.subtotal) || cost,
    taxPercent: Number(body.taxPercent) || 0,
    taxAmount: Number(body.taxAmount) || 0,
    discount: Number(body.discount) || 0,
    cost,
    paymentMode: body.paymentMode || "Bank Transfer",
    paymentStatus: body.paymentStatus || "PAID",
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }
  deleteGeneralPurchaseLog(id);
  return NextResponse.json({ success: true });
}
