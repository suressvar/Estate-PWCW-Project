import { NextResponse } from "next/server";
import { getWorkers, createWorker } from "@/lib/worker-data";

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
      dailyWageRate: Number(body.dailyWageRate),
      active: body.active !== undefined ? body.active : true,
    });
    return NextResponse.json(worker, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create worker" },
      { status: 400 }
    );
  }
}
