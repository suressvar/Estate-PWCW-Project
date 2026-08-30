import { NextResponse } from "next/server";
import {
  getPurchaseCategories,
  createPurchaseCategory,
} from "@/lib/transaction-logs";

export async function GET() {
  try {
    const categories = getPurchaseCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch purchase categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.category || typeof body.category !== "string" || !body.category.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    const newCategory = createPurchaseCategory(body.category);
    const updatedCategories = getPurchaseCategories();
    return NextResponse.json({ category: newCategory, categories: updatedCategories }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create purchase category" },
      { status: 500 }
    );
  }
}
