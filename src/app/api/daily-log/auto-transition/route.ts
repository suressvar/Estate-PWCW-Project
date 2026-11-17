import { autoTransitionPastPlannedActivities } from "@/lib/daily-log-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let referenceDate: string | undefined;
    try {
      const body = await request.json();
      referenceDate = body.referenceDate;
    } catch {
      // Empty body is allowed, defaults to today
    }

    const report = autoTransitionPastPlannedActivities(referenceDate);
    return NextResponse.json({
      success: true,
      message: `Rolled over ${report.transitionedActivitiesCount} activities; carried forward ${report.carriedForwardCount} items.`,
      ...report,
    });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
