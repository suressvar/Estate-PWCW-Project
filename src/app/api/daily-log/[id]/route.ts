import { DailyLogStatus,getDailyLogById,upsertDailyLog } from "@/lib/daily-log-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

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
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
