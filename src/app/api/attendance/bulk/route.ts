import { NextResponse } from "next/server";
import { bulkMarkAttendance } from "@/lib/hr-data";

export async function POST(req: Request) {
  try {
    const { attendanceDate, status } = await req.json();
    if (!attendanceDate || !status) {
      return NextResponse.json({ error: "Date and status required" }, { status: 400 });
    }
    const result = bulkMarkAttendance(attendanceDate, status);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
