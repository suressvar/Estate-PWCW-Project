import { NextResponse } from "next/server";
import { getMachineryLogs, addMachineryLog } from "@/lib/transaction-logs";

export async function GET() {
  return NextResponse.json(getMachineryLogs());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newLog = addMachineryLog({
    plotCropId: body.plotCropId,
    plotName: body.plotName,
    cropActivityName: body.cropActivityName,
    machineName: body.machineName,
    startTime: body.startTime,
    endTime: body.endTime,
    runningHours: Number(body.runningHours),
    dieselConsumedLiters: Number(body.dieselConsumedLiters),
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });
}
