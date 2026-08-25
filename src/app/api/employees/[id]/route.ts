import { NextResponse } from "next/server";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/hr-data";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const emp = getEmployeeById(id);
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  return NextResponse.json(emp);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = updateEmployee(id, body);
    if (!updated) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteEmployee(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Cannot delete employee with existing attendance or salary records" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}
