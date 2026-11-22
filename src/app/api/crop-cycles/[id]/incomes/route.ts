import { positiveNumber } from "@/lib/validation";
import { getDatabase, withTransaction } from "@/lib/db-storage";
import { addCropIncome,deleteCropIncome,getCropCycleFinancials } from "@/lib/crop-cycle-data";
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
    const result = addCropIncome({
      cropCycleId: id,
      source: body.source,
      quantitySold: positiveNumber(body.quantitySold, "quantitySold"),
      unit: body.unit,
      ratePerUnit: positiveNumber(body.ratePerUnit, "ratePerUnit"),
      amount: body.amount !== undefined ? positiveNumber(body.amount, "amount") : undefined,
      date: body.date,
      buyerName: body.buyerName,
      invoiceNo: body.invoiceNo,
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
      { error: getErrorMessage(err) || "Failed to log income" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recordId = new URL(request.url).searchParams.get("incomeId");
    if (!recordId) return NextResponse.json({ error: "incomeId is required" }, { status: 400 });
    return withTransaction(() => {
      const record = (getDatabase().cropIncomes || []).find(row => row.id === recordId && row.cropCycleId === id);
      if (!record || !deleteCropIncome(recordId)) return NextResponse.json({ error: "Income not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
