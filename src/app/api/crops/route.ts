import { NextResponse } from "next/server";
import { getCrops, createCrop, updateCrop, deleteCrop } from "@/lib/master-data";

export async function GET() {
  return NextResponse.json(getCrops());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newCrop = createCrop({
    name: body.name,
    type: body.type || "CROP",
  });
  return NextResponse.json(newCrop, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const updated = updateCrop(body.id, {
    name: body.name,
    type: body.type,
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    deleteCrop(id);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Missing ID" }, { status: 400 });
}
