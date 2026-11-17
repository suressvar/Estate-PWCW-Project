import { errorMessage as getErrorMessage } from "@/lib/errors";
import { createEmployee,getEmployees } from "@/lib/hr-data";
import { NextResponse } from "next/server";

export async function GET() {
  const list = getEmployees();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = createEmployee(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
