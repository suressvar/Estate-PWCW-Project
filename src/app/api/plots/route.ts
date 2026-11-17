import { createPlot,deletePlot,getPlots,updatePlot } from "@/lib/master-data";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getPlots());
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const newPlot = createPlot({
    name: body.name,
    location: body.location || "",
    areaAcres: body.areaAcres,
    status: body.status || "ACTIVE",
  });
  return NextResponse.json(newPlot, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid plot request.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
  const body = await request.json();
  const updated = updatePlot(body.id, {
    name: body.name,
    location: body.location,
    areaAcres: body.areaAcres,
    status: body.status,
  });
  return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid plot request.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    try { deletePlot(id); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete plot.' }, { status: 409 }); }
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Missing ID" }, { status: 400 });
}
