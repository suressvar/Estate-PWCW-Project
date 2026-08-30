import { NextResponse } from "next/server";
import { getExpenseUnits, createExpenseUnit, deleteExpenseUnit } from "@/lib/vouchers-data";

export async function GET() {
  const units = getExpenseUnits();
  return NextResponse.json(units);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.unitName || !body.unitSymbol) {
      return NextResponse.json({ error: "unitName and unitSymbol are required" }, { status: 400 });
    }
    const newUnit = createExpenseUnit({
      unitName: body.unitName.trim(),
      unitSymbol: body.unitSymbol.trim(),
    });
    return NextResponse.json(newUnit, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Unit id is required" }, { status: 400 });
    }
    deleteExpenseUnit(id);
    return NextResponse.json({ success: true, message: `Unit ${id} deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
