import { finiteNumber } from "@/lib/validation";
import { addLaborLog,getLaborLogs } from "@/lib/transaction-logs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getLaborLogs());
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const newLog = addLaborLog({
    plotCropId: body.plotCropId,
    plotName: body.plotName,
    cropActivityName: body.cropActivityName,
    menCount: finiteNumber(body.menCount, 'menCount', 0, 0),
    womenCount: finiteNumber(body.womenCount, 'womenCount', 0, 0),
    menWageRate: finiteNumber(body.menWageRate, 'menWageRate', 0, 0),
    womenWageRate: finiteNumber(body.womenWageRate, 'womenWageRate', 0, 0),
    totalCost: finiteNumber(body.totalCost, 'totalCost'),
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });

  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid operational log." }, { status: 400 }); }
}
