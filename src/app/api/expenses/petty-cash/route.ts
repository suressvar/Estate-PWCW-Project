import { NextRequest, NextResponse } from "next/server";
import {
  getPettyCashLedger,
  getPettyCashStatus,
  topUpPettyCash,
  recalculatePettyCashLedger,
} from "@/lib/expenses-data";

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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch petty cash data" },
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process petty cash transaction" },
      { status: 400 }
    );
  }
}
