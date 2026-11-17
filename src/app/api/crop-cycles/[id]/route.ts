import {
deleteCropCycle,
getCropCycleById,
getCropCycleFinancials,
updateCropCycle,
} from "@/lib/crop-cycle-data";
import { getDatabase } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cycle = getCropCycleById(id);
  if (!cycle) {
    return NextResponse.json({ error: "Crop cycle not found" }, { status: 404 });
  }

  const financials = getCropCycleFinancials(id);
  const db = getDatabase();
  const expenses = (db.cropExpenses || []).filter((e) => e.cropCycleId === id);
  const incomes = (db.cropIncomes || []).filter((i) => i.cropCycleId === id);

  return NextResponse.json({
    cycle,
    financials,
    expenses,
    incomes,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = updateCropCycle(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Crop cycle not found" }, { status: 404 });
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
  const success = deleteCropCycle(id);
  if (!success) {
    return NextResponse.json({ error: "Crop cycle not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
