import { NextResponse } from "next/server";
import { resetMasterData } from "@/lib/master-data";
import { resetTransactionLogs } from "@/lib/transaction-logs";
import { resetHrData } from "@/lib/hr-data";
import { resetVouchersData } from "@/lib/vouchers-data";
import { resetSalesData } from "@/lib/sales-data";
import { resetInventoryData } from "@/lib/inventory-data";

export async function POST() {
  try {
    resetMasterData();
    resetTransactionLogs();
    resetHrData();
    resetVouchersData();
    resetSalesData();
    resetInventoryData();
    return NextResponse.json({ success: true, message: "All application data has been successfully reset." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
