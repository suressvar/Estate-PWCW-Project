import { NextResponse } from "next/server";
import { getWorkerById, updateWorker, deleteWorker } from "@/lib/worker-data";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const worker = getWorkerById(id);
  if (!worker) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }
  return NextResponse.json(worker);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = updateWorker(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = deleteWorker(id);
  if (!success) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
