"use client";

import type { ExpensesPageState } from "@/components/expenses/use-expenses-page";
import {
  TrendingUp,
  X
} from "lucide-react";

type Props = Pick<ExpensesPageState,
  "showTopUpModal" |
  "setShowTopUpModal" |
  "handleTopUpSubmit" |
  "topUpForm" |
  "setTopUpForm"
>;

export function PettyCashTopUpModal({
  showTopUpModal,
  setShowTopUpModal,
  handleTopUpSubmit,
  topUpForm,
  setTopUpForm,
}: Props) {
  return (
    showTopUpModal && (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Top Up Petty Cash Drawer
            </h2>
            <button
              onClick={() => setShowTopUpModal(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleTopUpSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-muted-foreground mb-1">Amount to Add (₹) *</label>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 5000"
                value={topUpForm.amount}
                onChange={(e) => setTopUpForm({ ...topUpForm, amount: e.target.value })}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500 font-mono text-base font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">Date *</label>
              <input
                type="date"
                value={topUpForm.date}
                onChange={(e) => setTopUpForm({ ...topUpForm, date: e.target.value })}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">Notes / Source</label>
              <textarea
                rows={2}
                placeholder="e.g. Cash withdrawal from SBI current account, ATM debit..."
                value={topUpForm.notes}
                onChange={(e) => setTopUpForm({ ...topUpForm, notes: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              ✅ Instant Cash Replenishment: This adds directly to the running opening balance of subsequent days.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
              >
                Confirm Top Up
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
}
