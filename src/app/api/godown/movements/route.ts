import { errorMessage as getErrorMessage } from "@/lib/errors";
import { getGodownMovements } from "@/lib/godown-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const movements = getGodownMovements();
    return NextResponse.json(movements);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
