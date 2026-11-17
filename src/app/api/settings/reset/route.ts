import { resetAllData } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    resetAllData();
    return NextResponse.json({ success: true, message: "All application data has been permanently deleted and reset." });
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
