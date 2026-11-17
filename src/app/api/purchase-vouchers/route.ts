import { withTransaction } from "@/lib/db-storage";
import { finiteNumber, positiveNumber, requiredText, dateKey } from "@/lib/validation";
import { inwardPurchasedItems } from "@/lib/godown-data";
import { addGeneralPurchaseLog,deleteGeneralPurchaseLog,getGeneralPurchaseLogs } from "@/lib/transaction-logs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getGeneralPurchaseLogs());
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const cost = Number(body.cost) || Number(body.totalAmount) || Number(body.subtotal) || 0;

  requiredText(body.vendorName, "Supplier name");
  if (body.date) dateKey(body.date);
  if (!Array.isArray(body.items) || body.items.length === 0) throw new Error("Purchase items are required.");
  for (const item of body.items) {
    requiredText(item.description, "Item description"); positiveNumber(item.quantity, "Quantity"); finiteNumber(item.rate, "Rate");
  }
  const newLog = withTransaction(() => {
  const created = addGeneralPurchaseLog({
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

  inwardPurchasedItems(created.items || [], { voucherId: created.id, voucherNo: created.voucherNo, category: created.category, vendorName: created.vendorName, date: created.date });
  return created;
  });

  return NextResponse.json(newLog, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save voucher." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }
  try { deleteGeneralPurchaseLog(id); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete voucher." }, { status: 400 }); }
  return NextResponse.json({ success: true });
}
