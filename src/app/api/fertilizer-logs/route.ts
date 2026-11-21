import { finiteNumber } from "@/lib/validation";
import { addFertilizerLog,getFertilizerLogs } from "@/lib/transaction-logs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getFertilizerLogs());
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const newLog = addFertilizerLog({
    plotCropId: body.plotCropId,
    plotName: body.plotName,
    cropActivityName: body.cropActivityName,
    transactionType: body.transactionType || "CONSUMPTION",
    fertilizerName: body.fertilizerName,
    quantityKg: finiteNumber(body.quantityKg, 'quantityKg'),
    cost: finiteNumber(body.cost, 'cost'),
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });

  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid operational log." }, { status: 400 }); }
}
