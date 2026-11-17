import { addFertilizerLog,getFertilizerLogs } from "@/lib/transaction-logs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getFertilizerLogs());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newLog = addFertilizerLog({
    plotCropId: body.plotCropId,
    plotName: body.plotName,
    cropActivityName: body.cropActivityName,
    transactionType: body.transactionType || "CONSUMPTION",
    fertilizerName: body.fertilizerName,
    quantityKg: Number(body.quantityKg),
    cost: Number(body.cost),
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });
}
