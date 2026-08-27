import { NextResponse } from "next/server";
import { resetAllData } from "@/lib/db-storage";

export async function POST() {
  try {
    resetAllData();
    return NextResponse.json({ success: true, message: "All application data has been permanently deleted and reset." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
