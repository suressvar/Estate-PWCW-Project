import { errorMessage as getErrorMessage } from "@/lib/errors";
import {
addExpense,
deleteExpense,
ExpenseCategory,
getExpenses,
getExpenseSummaryReport,
updateExpense,
} from "@/lib/expenses-data";
import { NextRequest,NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get("summary") === "true";

    if (summary) {
      const summaryData = getExpenseSummaryReport();
      return NextResponse.json({ success: true, data: summaryData });
    }

    const category = (searchParams.get("category") as ExpenseCategory) || undefined;
    const plotId = searchParams.get("plotId") || undefined;
    const cropCycleId = searchParams.get("cropCycleId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const expenses = getExpenses({
      category,
      plotId,
      cropCycleId,
      startDate,
      endDate,
    });
    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const expense = addExpense(body);
    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to create expense" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Expense ID is required for update" },
        { status: 400 }
      );
    }
    const updated = updateExpense(id, data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to update expense" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Expense ID is required for deletion" },
        { status: 400 }
      );
    }
    const deleted = deleteExpense(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
