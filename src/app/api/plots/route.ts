import { NextResponse } from "next/server";
import { getPlots, createPlot, updatePlot, deletePlot } from "@/lib/master-data";

export async function GET() {
  return NextResponse.json(getPlots());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newPlot = createPlot({
    name: body.name,
    location: body.location || "",
    areaAcres: Number(body.areaAcres) || 0,
    status: body.status || "ACTIVE",
  });
  return NextResponse.json(newPlot, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const updated = updatePlot(body.id, {
    name: body.name,
    location: body.location,
    areaAcres: Number(body.areaAcres),
    status: body.status,
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    deletePlot(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Missing ID" }, { status: 400 });
}
