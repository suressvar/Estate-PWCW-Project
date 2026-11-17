import { errorMessage as getErrorMessage } from "@/lib/errors";
import { createLeave,getLeaves } from "@/lib/hr-data";
import { NextResponse } from "next/server";

export async function GET() {
  const leaves = getLeaves();
  return NextResponse.json(leaves);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newLeave = createLeave(body);
    return NextResponse.json(newLeave, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
