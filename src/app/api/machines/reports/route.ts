import { NextRequest, NextResponse } from "next/server";
import {
  getMachineryReport,
  getPlotMachineryConsumptionReport,
} from "@/lib/machinery-data";

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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate machinery report" },
      { status: 500 }
    );
  }
}
