import { NextResponse } from "next/server";
import { getGodownMovements } from "@/lib/godown-data";

export async function GET() {
  try {
    const movements = getGodownMovements();
    return NextResponse.json(movements);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
