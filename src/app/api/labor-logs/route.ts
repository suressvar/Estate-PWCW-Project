import { NextResponse } from "next/server";
import { getLaborLogs, addLaborLog } from "@/lib/transaction-logs";

export async function GET() {
  return NextResponse.json(getLaborLogs());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newLog = addLaborLog({
    plotCropId: body.plotCropId,
    plotName: body.plotName,
    cropActivityName: body.cropActivityName,
    menCount: Number(body.menCount),
    womenCount: Number(body.womenCount),
    menWageRate: Number(body.menWageRate),
    womenWageRate: Number(body.womenWageRate),
    totalCost: Number(body.totalCost),
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });
}
