import { NextResponse } from "next/server";
import { getGroupTypes, createGroupType, deleteGroupType } from "@/lib/accounting-data";

export async function GET() {
  try {
    const types = getGroupTypes();
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch group types" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.groupType || typeof body.groupType !== "string" || !body.groupType.trim()) {
      return NextResponse.json({ error: "Group type name is required" }, { status: 400 });
    }
    const newType = createGroupType(body.groupType);
    return NextResponse.json({ groupType: newType }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create group type" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeName = searchParams.get("type");
    if (!typeName) {
      return NextResponse.json({ error: "Type parameter is required" }, { status: 400 });
    }
    const deleted = deleteGroupType(typeName);
    if (!deleted) {
      return NextResponse.json(
        { error: "Cannot delete this group type because it is actively used by existing ledger groups." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete group type" }, { status: 500 });
  }
}
