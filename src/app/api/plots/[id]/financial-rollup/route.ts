import { NextResponse } from "next/server";
import { getPlotFinancialRollup } from "@/lib/crop-cycle-data";

export const dynamic = "force-dynamic";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rollup = getPlotFinancialRollup(id);
  if (!rollup) {
    return NextResponse.json({ error: "Plot not found" }, { status: 404 });
  }
  return NextResponse.json(rollup);
}
