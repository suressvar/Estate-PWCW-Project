import { withTransaction } from "@/lib/db-storage";
import { getCropCycleFinancials,syncOperationsToCropCycle } from "@/lib/crop-cycle-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    return withTransaction(() => {
    const syncReport = syncOperationsToCropCycle(id);
    const financials = getCropCycleFinancials(id);
    return NextResponse.json({
      success: true,
      ...syncReport,
      financials,
    });
    });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
