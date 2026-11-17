import {
createPurchaseCategory,
deletePurchaseCategory,
getPurchaseCategories,
} from "@/lib/transaction-logs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = getPurchaseCategories();
    return NextResponse.json(categories);
  } catch  {
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
  } catch  {
    return NextResponse.json(
      { error: "Failed to create purchase category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required" },
        { status: 400 }
      );
    }
    const updated = deletePurchaseCategory(category);
    return NextResponse.json({ success: true, categories: updated });
  } catch  {
    return NextResponse.json(
      { error: "Failed to delete purchase category" },
      { status: 500 }
    );
  }
}
