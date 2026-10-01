import { NextResponse } from "next/server";
import { getDailyLogById, upsertDailyLog, DailyLogStatus } from "@/lib/daily-log-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const log = getDailyLogById(id);
  if (!log) {
    return NextResponse.json({ error: "Daily log not found" }, { status: 404 });
  }
  return NextResponse.json(log);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const log = getDailyLogById(id);
  if (!log) {
    return NextResponse.json({ error: "Daily log not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = upsertDailyLog({
      date: log.date,
      plotId: log.plotId,
      createdBy: body.createdBy,
      notes: body.notes,
      status: body.status as DailyLogStatus,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
