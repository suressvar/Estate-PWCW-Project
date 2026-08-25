import { NextResponse } from "next/server";
import { getLeaves, createLeave } from "@/lib/hr-data";

export async function GET() {
  const leaves = getLeaves();
  return NextResponse.json(leaves);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newLeave = createLeave(body);
    return NextResponse.json(newLeave, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
