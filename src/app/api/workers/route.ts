import { errorMessage as getErrorMessage } from "@/lib/errors";
import { createWorker,getWorkers } from "@/lib/worker-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("activeOnly") === "true";

  const workers = getWorkers({ activeOnly });
  return NextResponse.json(workers);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const worker = createWorker({
      name: body.name,
      phone: body.phone,
      role: body.role,
      dailyWageRate: body.dailyWageRate,
      active: body.active !== undefined ? body.active : true,
    });
    return NextResponse.json(worker, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: getErrorMessage(err) || "Failed to create worker" },
      { status: 400 }
    );
  }
}
