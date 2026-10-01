import { NextRequest, NextResponse } from "next/server";
import { getMachines, createMachine } from "@/lib/machinery-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const machines = getMachines({ activeOnly });
    return NextResponse.json({ success: true, data: machines });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch machines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const machine = createMachine(body);
    return NextResponse.json({ success: true, data: machine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create machine" },
      { status: 400 }
    );
  }
}
