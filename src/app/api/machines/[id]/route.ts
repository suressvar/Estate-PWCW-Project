import { NextRequest, NextResponse } from "next/server";
import { getMachineById, updateMachine, deleteMachine } from "@/lib/machinery-data";

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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch machine" },
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update machine" },
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete machine" },
      { status: 500 }
    );
  }
}
