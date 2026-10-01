import { NextResponse } from "next/server";
import { addWorkActivity, ActivityType } from "@/lib/daily-log-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    const result = addWorkActivity(id, {
      activityType: (body.activityType as ActivityType) || "OTHER",
      customActivity: body.customActivity,
      description: body.description?.trim() || "",
      assignedWorkerIds: Array.isArray(body.assignedWorkerIds) ? body.assignedWorkerIds : [],
      plannedFlag: body.plannedFlag !== undefined ? Boolean(body.plannedFlag) : true,
      completedFlag: body.completedFlag !== undefined ? Boolean(body.completedFlag) : false,
      carriedForwardFromId: body.carriedForwardFromId || null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add activity" },
      { status: 400 }
    );
  }
}
