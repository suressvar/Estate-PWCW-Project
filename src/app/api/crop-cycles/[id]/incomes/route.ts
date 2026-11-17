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

    const result = addCropIncome({
      cropCycleId: id,
      source: body.source,
      quantitySold: Number(body.quantitySold),
      unit: body.unit,
      ratePerUnit: Number(body.ratePerUnit),
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
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
  } catch (err) {
    return NextResponse.json(
      { error: getErrorMessage(err) || "Failed to log income" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const incomeId = searchParams.get("incomeId");
  if (!incomeId) {
    return NextResponse.json({ error: "incomeId is required" }, { status: 400 });
  }

  const success = deleteCropIncome(incomeId);
  if (!success) {
    return NextResponse.json({ error: "Income entry not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
