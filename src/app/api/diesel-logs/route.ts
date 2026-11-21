import { finiteNumber } from "@/lib/validation";
import { addDieselLog,getDieselLogs } from "@/lib/transaction-logs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getDieselLogs());
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const newLog = addDieselLog({
    plotCropId: body.plotCropId,
    plotName: body.plotName,
    cropActivityName: body.cropActivityName,
    machineName: body.machineName,
    transactionType: body.transactionType || "CONSUMPTION",
    quantityLiters: finiteNumber(body.quantityLiters, 'quantityLiters'),
    cost: finiteNumber(body.cost, 'cost'),
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });

  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid operational log." }, { status: 400 }); }
}
