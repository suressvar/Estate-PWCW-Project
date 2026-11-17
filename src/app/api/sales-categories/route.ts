import { errorMessage as getErrorMessage } from "@/lib/errors";
import {
addSalesCategory,
deleteSalesCategory,
getSalesCategories,
} from "@/lib/sales-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = getSalesCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.category || typeof body.category !== "string") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    const updated = addSalesCategory(body.category);
    return NextResponse.json({ success: true, categories: updated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    if (!category) {
      return NextResponse.json({ error: "Category parameter is required" }, { status: 400 });
    }
    const updated = deleteSalesCategory(category);
    return NextResponse.json({ success: true, categories: updated });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
