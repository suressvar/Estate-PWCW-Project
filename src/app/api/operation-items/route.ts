import { errorMessage as getErrorMessage } from "@/lib/errors";
import {
assignItemCode,
createOperationItem,
generateNextItemCode,
getOperationItems,
getOperationItemStats,
isItemCodeUnique,
OPERATION_ITEM_CATEGORIES,
} from "@/lib/operation-items-data";
import { ValidationError } from '@/lib/validation';
import { NextRequest,NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const nextCodeFor = searchParams.get("nextCodeFor");
    const checkUnique = searchParams.get("checkUnique");
    const excludeId = searchParams.get("excludeId") || undefined;

    if (nextCodeFor) {
      const nextCode = generateNextItemCode(nextCodeFor);
      return NextResponse.json({ success: true, nextCode });
    }

    if (checkUnique) {
      const isUnique = isItemCodeUnique(checkUnique, excludeId);
      return NextResponse.json({ success: true, isUnique });
    }

    const items = getOperationItems({ category, status, search });
    const stats = getOperationItemStats();

    return NextResponse.json({
      success: true,
      items,
      stats,
      categories: OPERATION_ITEM_CATEGORIES,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) || "Failed to fetch operation items" },
      { status: err instanceof ValidationError || err instanceof SyntaxError ? 400 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "generate_code") {
      const code = generateNextItemCode(body.category || "General Estate Supplies");
      return NextResponse.json({ success: true, itemCode: code });
    }

    if (body.action === "assign_code") {
      if (!body.id || !body.itemCode) {
        return NextResponse.json(
          { success: false, error: "Both id and itemCode are required." },
          { status: 400 }
        );
      }
      const result = assignItemCode(body.id, body.itemCode);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, item: result.item });
    }

    // Default: create new operation item
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Item name is required." },
        { status: 400 }
      );
    }

    const result = createOperationItem(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, item: result.item }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) || "Failed to process item request" },
      { status: err instanceof ValidationError || err instanceof SyntaxError ? 400 : 500 }
    );
  }
}
