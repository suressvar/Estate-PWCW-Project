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

    const result = addCropExpense({
      cropCycleId: id,
      category: body.category,
      amount: Number(body.amount),
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
  } catch (err) {
    return NextResponse.json(
      { error: getErrorMessage(err) || "Failed to log expense" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const expenseId = searchParams.get("expenseId");
  if (!expenseId) {
    return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
  }

  const success = deleteCropExpense(expenseId);
  if (!success) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
