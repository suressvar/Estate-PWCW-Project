import { errorMessage as getErrorMessage } from "@/lib/errors";
import { markAttendance } from "@/lib/hr-data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = markAttendance(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
