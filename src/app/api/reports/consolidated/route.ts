import {
generateConsolidatedReportCsv,
getConsolidatedReport,
} from "@/lib/consolidated-report-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextRequest,NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plotId = searchParams.get("plotId") || undefined;
    const cropCycleId = searchParams.get("cropCycleId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const format = searchParams.get("format") || "json";

    const filters = {
      plotId,
      cropCycleId,
      startDate,
      endDate,
    };

    if (format === "csv") {
      const csv = generateConsolidatedReportCsv(filters);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="estate-consolidated-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const report = getConsolidatedReport(filters);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to generate consolidated report" },
      { status: 500 }
    );
  }
}
