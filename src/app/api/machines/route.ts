import { errorMessage as getErrorMessage } from "@/lib/errors";
import { createMachine,getMachines } from "@/lib/machinery-data";
import { NextRequest,NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const machines = getMachines({ activeOnly });
    return NextResponse.json({ success: true, data: machines });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to fetch machines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const machine = createMachine(body);
    return NextResponse.json({ success: true, data: machine }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to create machine" },
      { status: 400 }
    );
  }
}
