"use client";

import type { ExpensesPageState } from "@/components/expenses/use-expenses-page";
import type { ExpenseCategory } from "@/types/storage";
import {
  Receipt,
  X
} from "lucide-react";

type Props = Pick<ExpensesPageState,
  "showExpenseModal" |
  "editingExpense" |
  "setShowExpenseModal" |
  "handleExpenseSubmit" |
  "expenseForm" |
  "setExpenseForm" |
  "plots" |
  "cropCycles"
>;

export function ExpenseModal({
  showExpenseModal,
  editingExpense,
  setShowExpenseModal,
  handleExpenseSubmit,
  expenseForm,
  setExpenseForm,
  plots,
  cropCycles,
}: Props) {
  return (
    showExpenseModal && (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              {editingExpense ? "Edit Expense Entry" : "Record Farm Expense"}
            </h2>
            <button
              onClick={() => setShowExpenseModal(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleExpenseSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="GENERAL">General Expense</option>
                  <option value="PETTY_CASH">Petty Cash (Cash on hand)</option>
                  <option value="MAINTENANCE">Maintenance / Repairs</option>
                  <option value="ADMIN">Administrative & Office</option>
                  <option value="OTHER">Other Expense</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Date *</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 750"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Paid By / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. Field Supervisor, Cashier"
                  value={expenseForm.paidBy}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">Description / Particulars *</label>
              <textarea
                rows={2}
                placeholder="e.g. Purchased PVC irrigation connectors, emergency diesel purchase, tea refreshments for workers..."
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Plot Link</label>
                <select
                  value={expenseForm.plotId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, plotId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">General Estate / None</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Crop Cycle (Auto P&L Sync)</label>
                <select
                  value={expenseForm.cropCycleId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, cropCycleId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">None (General Overhead)</option>
                  {cropCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.plotName} - {c.cropName} ({c.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">Receipt / Voucher Ref No.</label>
              <input
                type="text"
                placeholder="e.g. REC-2026-088, UPI-992102"
                value={expenseForm.receiptRef}
                onChange={(e) => setExpenseForm({ ...expenseForm, receiptRef: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            {expenseForm.category === "PETTY_CASH" && (
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                ℹ️ <strong>Petty Cash Integration:</strong> This transaction will automatically deduct from the petty cash drawer on <strong>{expenseForm.date}</strong> and recompute closing balances.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
              >
                {editingExpense ? "Save Changes" : "Record Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
}
