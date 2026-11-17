import { errorMessage as getErrorMessage } from "@/lib/errors";
import { deleteMachine,getMachineById,updateMachine } from "@/lib/machinery-data";
import { NextRequest,NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const machine = getMachineById(id);
    if (!machine) {
      return NextResponse.json(
        { success: false, error: "Machine not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: machine });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to fetch machine" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = updateMachine(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Machine not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to update machine" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteMachine(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Machine not found or already deleted" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Machine deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to delete machine" },
      { status: 500 }
    );
  }
}
