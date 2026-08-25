import { NextResponse } from "next/server";
import { getEmployees, createEmployee } from "@/lib/hr-data";

export async function GET() {
  const list = getEmployees();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = createEmployee(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
