import { errorMessage as getErrorMessage } from "@/lib/errors";
import { bulkMarkAttendance } from "@/lib/hr-data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { attendanceDate, status } = await req.json();
    if (!attendanceDate || !status) {
      return NextResponse.json({ error: "Date and status required" }, { status: 400 });
    }
    const result = bulkMarkAttendance(attendanceDate, status);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
