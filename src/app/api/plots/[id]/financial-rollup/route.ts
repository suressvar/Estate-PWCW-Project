import { getPlotFinancialRollup } from "@/lib/crop-cycle-data";
import { NextResponse } from "next/server";

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
