import { NextResponse } from "next/server";
import {
  getDailyAttendanceSheet,
  upsertWorkerAttendanceAndWage,
} from "@/lib/worker-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const sheet = getDailyAttendanceSheet(date);
  return NextResponse.json(sheet);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.workerId) {
      return NextResponse.json({ error: "workerId is required" }, { status: 400 });
    }
    if (!body.date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }
    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const result = upsertWorkerAttendanceAndWage({
      workerId: body.workerId,
      date: body.date,
      status: body.status,
      checkInTime: body.checkInTime,
      checkOutTime: body.checkOutTime,
      hoursWorked: body.hoursWorked !== undefined ? Number(body.hoursWorked) : undefined,
      notes: body.notes,
      cropCycleId: body.cropCycleId,
      manualWageOverride: body.manualWageOverride !== undefined ? Number(body.manualWageOverride) : undefined,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update attendance" },
      { status: 400 }
    );
  }
}
