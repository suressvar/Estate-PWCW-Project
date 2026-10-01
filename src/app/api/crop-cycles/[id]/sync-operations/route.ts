import { NextResponse } from "next/server";
import { syncOperationsToCropCycle, getCropCycleFinancials } from "@/lib/crop-cycle-data";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const syncReport = syncOperationsToCropCycle(id);
    const financials = getCropCycleFinancials(id);
    return NextResponse.json({
      success: true,
      ...syncReport,
      financials,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
