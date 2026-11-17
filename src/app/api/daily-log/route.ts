import {
autoTransitionPastPlannedActivities,
DailyLogStatus,
getDailyLogByPlotAndDate,
getDailyLogs,
upsertDailyLog,
} from "@/lib/daily-log-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plotId = searchParams.get("plotId") || undefined;
  const date = searchParams.get("date") || undefined;
  const status = (searchParams.get("status") as DailyLogStatus) || undefined;
  const skipAuto = searchParams.get("skipAuto") === "true";

  if (!skipAuto) {
    autoTransitionPastPlannedActivities();
  }

  if (plotId && date) {
    const single = getDailyLogByPlotAndDate(plotId, date);
    return NextResponse.json(single || null);
  }

  const logs = getDailyLogs({ plotId, date, status, skipAutoTransition: true });
  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.plotId) {
      return NextResponse.json({ error: "plotId is required" }, { status: 400 });
    }
    if (!body.date) {
      return NextResponse.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 });
    }

    const log = upsertDailyLog({
      plotId: body.plotId,
      date: body.date,
      createdBy: body.createdBy,
      notes: body.notes,
      status: body.status,
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) || "Failed to upsert daily log" }, { status: 400 });
  }
}
