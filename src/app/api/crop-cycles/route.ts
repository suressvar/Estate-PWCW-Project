import { NextResponse } from "next/server";
import {
  getCropCycles,
  createCropCycle,
  getAllPlotsFinancialRollup,
  CropCycleStatus,
} from "@/lib/crop-cycle-data";

export const dynamic = "force-dynamic";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plotId = searchParams.get("plotId") || undefined;
  const status = (searchParams.get("status") as CropCycleStatus) || undefined;
  const includeRollup = searchParams.get("includeRollup") === "true";

  const cycles = getCropCycles({ plotId, status });

  if (includeRollup) {
    const estateRollup = getAllPlotsFinancialRollup();
    return NextResponse.json({
      cycles,
      estateRollup,
    });
  }

  return NextResponse.json(cycles);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.plotId) {
      return NextResponse.json({ error: "plotId is required" }, { status: 400 });
    }
    if (!body.cropName || !body.cropName.trim()) {
      return NextResponse.json({ error: "cropName is required" }, { status: 400 });
    }
    if (!body.sowingDate) {
      return NextResponse.json({ error: "sowingDate is required" }, { status: 400 });
    }
    if (!body.expectedHarvestDate) {
      return NextResponse.json({ error: "expectedHarvestDate is required" }, { status: 400 });
    }

    const newCycle = createCropCycle({
      plotId: body.plotId,
      cropName: body.cropName,
      cropType: body.cropType,
      sowingDate: body.sowingDate,
      expectedHarvestDate: body.expectedHarvestDate,
      actualHarvestDate: body.actualHarvestDate,
      status: body.status,
      notes: body.notes,
    });

    return NextResponse.json(newCycle, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create crop cycle" }, { status: 400 });
  }
}
