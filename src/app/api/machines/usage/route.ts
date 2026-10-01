import { NextRequest, NextResponse } from "next/server";
import {
  getMachineUsageLogs,
  addMachineUsageLog,
  updateMachineUsageLog,
  deleteMachineUsageLog,
} from "@/lib/machinery-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get("machineId") || undefined;
    const plotId = searchParams.get("plotId") || undefined;
    const cropCycleId = searchParams.get("cropCycleId") || undefined;
    const dailyLogId = searchParams.get("dailyLogId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const logs = getMachineUsageLogs({
      machineId,
      plotId,
      cropCycleId,
      dailyLogId,
      startDate,
      endDate,
    });
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch usage logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const log = addMachineUsageLog(body);
    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log machine usage" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Log ID is required for update" },
        { status: 400 }
      );
    }
    const updated = updateMachineUsageLog(id, data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Usage log not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update usage log" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Log ID is required for deletion" },
        { status: 400 }
      );
    }
    const deleted = deleteMachineUsageLog(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Usage log not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Usage log deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete usage log" },
      { status: 500 }
    );
  }
}
