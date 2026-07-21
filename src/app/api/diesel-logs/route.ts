import { NextResponse } from "next/server";
import { getDieselLogs, addDieselLog } from "@/lib/transaction-logs";

export async function GET() {
  return NextResponse.json(getDieselLogs());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newLog = addDieselLog({
    transactionType: body.transactionType || "CONSUMPTION",
    quantityLiters: Number(body.quantityLiters),
    cost: Number(body.cost),
    date: body.date || new Date().toISOString().split("T")[0],
    loggedBy: body.loggedBy || "Estate Admin",
    notes: body.notes || "",
  });
  return NextResponse.json(newLog, { status: 201 });
}
