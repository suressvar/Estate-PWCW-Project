import { NextResponse } from "next/server";
import { markAttendance } from "@/lib/hr-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = markAttendance(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
