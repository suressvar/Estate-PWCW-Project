import { errorMessage as getErrorMessage } from "@/lib/errors";
import { createEmployeeRole,deleteEmployeeRole,getEmployeeRoles } from "@/lib/hr-data";
import { NextResponse } from "next/server";

export async function GET() {
  const roles = getEmployeeRoles();
  return NextResponse.json(roles);
}

export async function POST(req: Request) {
  try {
    const { roleName, description } = await req.json();
    if (!roleName) return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    const created = createEmployeeRole(roleName, description);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const ok = deleteEmployeeRole(id);
  if (!ok) return NextResponse.json({ error: "Cannot delete role assigned to employees" }, { status: 400 });
  return NextResponse.json({ success: true });
}
