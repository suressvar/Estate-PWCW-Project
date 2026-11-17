import { getDashboardPendingWork } from "@/lib/daily-log-data";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  const summary = getDashboardPendingWork(date);
  return NextResponse.json(summary);
}
