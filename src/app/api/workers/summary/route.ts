import { getMonthlyWorkerSummary } from "@/lib/worker-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const format = searchParams.get("format");

  const summary = getMonthlyWorkerSummary(year, month);

  if (format === "csv") {
    const filename = `worker-monthly-summary-${year}-${String(month).padStart(2, "0")}.csv`;
    return new NextResponse(summary.csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(summary);
}
