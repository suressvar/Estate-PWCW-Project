import { errorMessage as getErrorMessage } from "@/lib/errors";
import { deleteWorker,getWorkerById,updateWorker } from "@/lib/worker-data";
import { NextResponse } from "next/server";

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
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = deleteWorker(id);
  if (!success) {
    if (getWorkerById(id)) return NextResponse.json({ error: 'Paid wage history must be retained. Deactivate this worker instead.' }, { status: 409 });
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
