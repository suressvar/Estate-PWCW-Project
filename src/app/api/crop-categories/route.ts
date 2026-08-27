import { NextResponse } from "next/server";
import {
  getCropCategories,
  createCropCategory,
  deleteCropCategory,
} from "@/lib/master-data";

export async function GET() {
  try {
    const categories = getCropCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch crop categories" },
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
    const newCategory = createCropCategory(body.category);
    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create crop category" },
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
    deleteCropCategory(category);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete crop category" },
      { status: 500 }
    );
  }
}
