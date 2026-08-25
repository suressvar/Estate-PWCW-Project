import { NextResponse } from "next/server";
import { getSalesLogs, addSalesLog, deleteSalesLog } from "@/lib/transaction-logs";

export async function GET() {
  return NextResponse.json(getSalesLogs());
}

export async function POST(request: Request) {
  const body = await request.json();
  const quantityKg = Number(body.quantityKg) || (body.items ? body.items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0) : 0);
  const value = Number(body.value) || Number(body.totalAmount) || Number(body.subtotal) || 0;

  const newLog = addSalesLog({
    voucherNo: body.voucherNo,
    voucherType: body.voucherType || "Harvest Crop Sale",
    plotCropId: body.plotCropId,
    plotName: body.plotName || "General Estate",
    cropActivityName: body.cropActivityName || "N/A",
    quantityKg,
    value,
    buyerName: body.buyerName || "",
    buyerContact: body.buyerContact || "",
    buyerAddress: body.buyerAddress || "",
    items: body.items || [
      {
        id: `item_1`,
        description: `${body.cropActivityName || "Crop Produce"} Sale`,
        quantity: quantityKg,
        unit: "kg",
        rate: quantityKg > 0 ? Number((value / quantityKg).toFixed(2)) : value,
        amount: value,
      },
    ],
    subtotal: Number(body.subtotal) || value,
    taxPercent: Number(body.taxPercent) || 0,
    taxAmount: Number(body.taxAmount) || 0,
    discount: Number(body.discount) || 0,
    paymentMode: body.paymentMode || "Bank Transfer",
    paymentStatus: body.paymentStatus || "PAID",
    referenceNo: body.referenceNo || "",
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
  deleteSalesLog(id);
  return NextResponse.json({ success: true });
}
