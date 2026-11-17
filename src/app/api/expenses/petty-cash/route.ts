import { errorMessage as getErrorMessage } from "@/lib/errors";
import {
getPettyCashLedger,
getPettyCashStatus,
recalculatePettyCashLedger,
topUpPettyCash,
} from "@/lib/expenses-data";
import { NextRequest,NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusOnly = searchParams.get("statusOnly") === "true";

    if (statusOnly) {
      const status = getPettyCashStatus();
      return NextResponse.json({ success: true, data: status });
    }

    const ledger = getPettyCashLedger();
    const status = getPettyCashStatus();
    return NextResponse.json({ success: true, data: { status, ledger } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to fetch petty cash data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "recalculate") {
      recalculatePettyCashLedger();
      const status = getPettyCashStatus();
      const ledger = getPettyCashLedger();
      return NextResponse.json({
        success: true,
        message: "Petty cash ledger recalculated successfully",
        data: { status, ledger },
      });
    }

    // Default action is top-up
    const topUp = topUpPettyCash(body);
    const status = getPettyCashStatus();
    return NextResponse.json(
      {
        success: true,
        message: `Petty cash topped up with ₹${body.amount}`,
        data: { topUp, status },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to process petty cash transaction" },
      { status: 400 }
    );
  }
}
