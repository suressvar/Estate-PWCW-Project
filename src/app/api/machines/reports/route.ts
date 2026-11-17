import { errorMessage as getErrorMessage } from "@/lib/errors";
import {
getMachineryReport,
getPlotMachineryConsumptionReport,
} from "@/lib/machinery-data";
import { NextRequest,NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "machines";

    if (type === "plots") {
      const plotReport = getPlotMachineryConsumptionReport();
      return NextResponse.json({ success: true, data: plotReport });
    }

    const machineReport = getMachineryReport();
    return NextResponse.json({ success: true, data: machineReport });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to generate machinery report" },
      { status: 500 }
    );
  }
}
