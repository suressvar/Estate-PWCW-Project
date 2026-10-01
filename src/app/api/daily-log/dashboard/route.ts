import { NextResponse } from "next/server";
import { getDashboardPendingWork } from "@/lib/daily-log-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  const summary = getDashboardPendingWork(date);
  return NextResponse.json(summary);
}
