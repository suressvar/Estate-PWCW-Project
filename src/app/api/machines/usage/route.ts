import { errorMessage as getErrorMessage } from "@/lib/errors";
import {
addMachineUsageLog,
deleteMachineUsageLog,
getMachineUsageLogs,
updateMachineUsageLog,
} from "@/lib/machinery-data";
import { NextRequest,NextResponse } from "next/server";

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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to fetch usage logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const log = addMachineUsageLog(body);
    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to log machine usage" },
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to update usage log" },
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to delete usage log" },
      { status: 500 }
    );
  }
}
