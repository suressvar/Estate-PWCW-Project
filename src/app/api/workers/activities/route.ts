import { NextResponse } from "next/server";
import {
  getWorkerActivityLogs,
  addWorkerActivityLog,
  deleteWorkerActivityLog,
} from "@/lib/worker-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workerId = searchParams.get("workerId") || undefined;
  const dailyLogId = searchParams.get("dailyLogId") || undefined;
  const plotId = searchParams.get("plotId") || undefined;
  const cropCycleId = searchParams.get("cropCycleId") || undefined;

  const logs = getWorkerActivityLogs({
    workerId,
    dailyLogId,
    plotId,
    cropCycleId,
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.workerId) {
      return NextResponse.json({ error: "workerId is required" }, { status: 400 });
    }
    if (!body.dailyLogId) {
      return NextResponse.json({ error: "dailyLogId is required" }, { status: 400 });
    }
    if (!body.plotId) {
      return NextResponse.json({ error: "plotId is required" }, { status: 400 });
    }
    if (!body.activityDescription || !body.activityDescription.trim()) {
      return NextResponse.json({ error: "activityDescription is required" }, { status: 400 });
    }

    const activity = addWorkerActivityLog({
      workerId: body.workerId,
      dailyLogId: body.dailyLogId,
      plotId: body.plotId,
      cropCycleId: body.cropCycleId,
      activityDescription: body.activityDescription,
      timeSpentHours: body.timeSpentHours !== undefined ? Number(body.timeSpentHours) : undefined,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to log worker activity" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const success = deleteWorkerActivityLog(id);
  if (!success) {
    return NextResponse.json({ error: "Activity log not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
