import { errorMessage as getErrorMessage } from "@/lib/errors";
import {
deleteOperationItem,
getOperationItemById,
updateOperationItem,
} from "@/lib/operation-items-data";
import { NextRequest,NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = getOperationItemById(id);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, item });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) || "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const result = updateOperationItem(id, body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, item: result.item });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) || "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteOperationItem(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Item not found or already deleted" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) || "Failed to delete item" },
      { status: 500 }
    );
  }
}
