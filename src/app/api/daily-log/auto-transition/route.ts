import { NextResponse } from "next/server";
import { autoTransitionPastPlannedActivities } from "@/lib/daily-log-data";

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
