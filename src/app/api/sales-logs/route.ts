import { NextResponse } from "next/server";
import { getSalesLogs, addSalesLog } from "@/lib/transaction-logs";

export async function GET() {
  return NextResponse.json(getSalesLogs());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newLog = addSalesLog({
    plotCropId: body.plotCropId,
    plotName: body.plotName,
    cropActivityName: body.cropActivityName,
    quantityKg: Number(body.quantityKg),
    value: Number(body.value),
    buyerName: body.buyerName || "",
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });
}
