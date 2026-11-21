import { finiteNumber } from "@/lib/validation";
import { addProductionLog,getProductionLogs } from "@/lib/transaction-logs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getProductionLogs());
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const newLog = addProductionLog({
    plotCropId: body.plotCropId,
    plotName: body.plotName,
    cropActivityName: body.cropActivityName,
    quantityKg: finiteNumber(body.quantityKg, 'quantityKg'),
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });

  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid operational log." }, { status: 400 }); }
}
