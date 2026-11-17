import { deleteWorkActivity,updateActivityStatus } from "@/lib/daily-log-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  const { activityId } = await params;
  try {
    const body = await request.json();
    const { status, reasonIfNotDone } = body;

    if (!status || !["DONE", "NOT_DONE", "PENDING"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be one of DONE, NOT_DONE, or PENDING" },
        { status: 400 }
      );
    }

    if (status === "NOT_DONE" && (!reasonIfNotDone || !reasonIfNotDone.trim())) {
      return NextResponse.json(
        { error: "A reason is mandatory when marking an activity as Not Done." },
        { status: 400 }
      );
    }

    const result = updateActivityStatus(activityId, status, reasonIfNotDone);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: getErrorMessage(err) || "Failed to update activity status" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  const { activityId } = await params;
  try {
    const result = deleteWorkActivity(activityId);
    if (!result.success) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
