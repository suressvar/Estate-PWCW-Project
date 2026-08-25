import { NextResponse } from "next/server";
import { getPlotCrops, createPlotCrop, createPlotCrops, updatePlotCropStatus, deletePlotCrop } from "@/lib/master-data";

export async function GET() {
  return NextResponse.json(getPlotCrops());
}

export async function POST(request: Request) {
  const body = await request.json();
  const startDate = body.startDate || new Date().toISOString().split("T")[0];

  if (Array.isArray(body.cropActivityIds) && body.cropActivityIds.length > 0) {
    const created = createPlotCrops(body.plotId, body.cropActivityIds, startDate);
    return NextResponse.json(created, { status: 201 });
  }

  if (body.cropActivityId) {
    const newAssoc = createPlotCrop(body.plotId, body.cropActivityId, startDate);
    return NextResponse.json(newAssoc, { status: 201 });
  }

  return NextResponse.json({ error: "Missing cropActivityId or cropActivityIds" }, { status: 400 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  updatePlotCropStatus(body.id, body.status);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    deletePlotCrop(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Missing ID" }, { status: 400 });
}
