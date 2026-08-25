import { NextResponse } from "next/server";
import { getExpenseLedgerById } from "@/lib/accounting-data";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ledger = getExpenseLedgerById(id);
  if (!ledger) return NextResponse.json({ error: "Ledger account not found" }, { status: 404 });

  return NextResponse.json({
    id: ledger.id,
    ledger_name: ledger.ledgerName,
    ledger_group: ledger.groupName,
    group_type: ledger.groupType,
    description: ledger.description,
  });
}
