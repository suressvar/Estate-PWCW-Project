import { withTransaction } from "@/lib/db-storage";
import { WagePaidStatus } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import {
getWageRegister,
recordWagePayment,
syncWageToCropExpense,
} from "@/lib/worker-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const workerId = searchParams.get("workerId") || undefined;
  const paidStatus = (searchParams.get("paidStatus") as WagePaidStatus) || undefined;

  const register = getWageRegister({
    startDate,
    endDate,
    workerId,
    paidStatus,
  });

  return NextResponse.json(register);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.wageId) {
      return NextResponse.json({ error: "wageId is required" }, { status: 400 });
    }

    return withTransaction(() => {
    const updated = recordWagePayment(body.wageId, {
      paidAmount: body.paidAmount,
      paidDate: body.paidDate,
      paymentNotes: body.paymentNotes,
    });

    if (!updated) {
      return NextResponse.json({ error: "Wage entry not found" }, { status: 404 });
    }

    // Sync to crop expense if linked
    syncWageToCropExpense(updated);

    return NextResponse.json(updated);
    });
  } catch (err) {
    return NextResponse.json(
      { error: getErrorMessage(err) || "Failed to record wage payment" },
      { status: 400 }
    );
  }
}
