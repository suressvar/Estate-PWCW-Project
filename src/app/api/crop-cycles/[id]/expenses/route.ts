import { positiveNumber } from "@/lib/validation";
import { getDatabase, withTransaction } from "@/lib/db-storage";
import { addCropExpense,deleteCropExpense,getCropCycleFinancials } from "@/lib/crop-cycle-data";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    return withTransaction(() => {
    const result = addCropExpense({
      cropCycleId: id,
      category: body.category,
      amount: positiveNumber(body.amount, "Expense amount"),
      date: body.date,
      description: body.description,
      linkedDailyLogId: body.linkedDailyLogId,
      sourceRefId: body.sourceRefId,
    });

    const financials = getCropCycleFinancials(id);

    return NextResponse.json(
      {
        ...result,
        financials,
      },
      { status: 201 }
    );
    });
  } catch (err) {
    return NextResponse.json(
      { error: getErrorMessage(err) || "Failed to log expense" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recordId = new URL(request.url).searchParams.get("expenseId");
    if (!recordId) return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
    return withTransaction(() => {
      const record = (getDatabase().cropExpenses || []).find(row => row.id === recordId && row.cropCycleId === id);
      if (!record || !deleteCropExpense(recordId)) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
