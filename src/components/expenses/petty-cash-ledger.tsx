"use client";

import type { ExpensesPageState } from "@/components/expenses/use-expenses-page";
import {
  Calendar,
  LayoutGrid,
  List,
  Maximize2,
  RefreshCw,
  Wallet
} from "lucide-react";

type Props = Pick<ExpensesPageState,
  "activeTab" |
  "setPettyViewMode" |
  "pettyViewMode" |
  "fetchData" |
  "pettyLedger" |
  "openPettyCashVoucher"
>;

export function PettyCashLedger({
  activeTab,
  setPettyViewMode,
  pettyViewMode,
  fetchData,
  pettyLedger,
  openPettyCashVoucher,
}: Props) {
  return (
    activeTab === "petty_ledger" && (
      <div className="space-y-4">
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              Chronological Petty Cash Day Book & Running Balance
            </h3>
            <p className="text-xs text-muted-foreground">
              Live cash flow tracking across recorded daily operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setPettyViewMode("cards")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${pettyViewMode === "cards"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                title="Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setPettyViewMode("table")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${pettyViewMode === "table"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <button
              onClick={async () => {
                await fetch("/api/expenses/petty-cash", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "recalculate" }),
                });
                fetchData();
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 border border-border px-2.5 py-1 rounded-lg bg-card hover:bg-muted cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Recompute Forward Balance
            </button>
          </div>
        </div>

        {pettyViewMode === "cards" ? (
          pettyLedger.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-xl p-12 text-center text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No petty cash transactions recorded yet. Click &quot;Add Cash&quot; to start.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pettyLedger.map((row) => (
                <div
                  key={row.id}
                  className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group hover:border-emerald-500/50"
                >
                  <div>
                    {/* Top Row: Voucher No & Date */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {`PCV-${row.date.replace(/-/g, "")}`}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground/70" />
                        {row.date}
                      </span>
                    </div>

                    {/* Closing Balance Highlight */}
                    <div className="bg-muted/40 rounded-lg p-2.5 mb-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Closing Balance</span>
                      <span className="text-lg font-black font-mono text-foreground">
                        ₹{row.closingBalance.toLocaleString()}
                      </span>
                    </div>

                    {/* Cash Flow Grid: Opening, In, Out */}
                    <div className="grid grid-cols-3 gap-2 py-1 text-center border-t border-b border-border/40 text-[11px]">
                      <div>
                        <div className="text-[10px] text-muted-foreground">Opening</div>
                        <div className="font-mono font-medium text-foreground">₹{row.openingBalance.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Cash In</div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {row.amountIn > 0 ? `+₹${row.amountIn.toLocaleString()}` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Cash Out</div>
                        <div className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {row.amountOut > 0 ? `-₹${row.amountOut.toLocaleString()}` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Notes / Narrative */}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2" title={row.notes || ""}>
                      {row.notes || "Daily petty cash operational register entry."}
                    </p>
                  </div>

                  {/* Bottom Action Button: Expand Voucher */}
                  <div className="pt-2 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => openPettyCashVoucher(row)}
                      className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      title="Expand Voucher to Full Page"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand Voucher</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Table View */
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Opening Balance</th>
                    <th className="py-3 px-4 text-right text-emerald-600">Amount In (Top-ups)</th>
                    <th className="py-3 px-4 text-right text-rose-600">Amount Out (Disbursed)</th>
                    <th className="py-3 px-4 text-right font-bold text-foreground">Closing Balance</th>
                    <th className="py-3 px-4">Day Notes</th>
                    <th className="py-3 px-4 text-right">Voucher Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pettyLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No petty cash transactions recorded yet. Click &quot;Add Cash&quot; to start.
                      </td>
                    </tr>
                  ) : (
                    pettyLedger.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                          {row.date}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-muted-foreground">
                          ₹{row.openingBalance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.amountIn > 0 ? `+₹${row.amountIn.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {row.amountOut > 0 ? `-₹${row.amountOut.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-foreground">
                          ₹{row.closingBalance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-sm truncate text-[11px]" title={row.notes || ""}>
                          {row.notes || "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openPettyCashVoucher(row)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
                            title="Expand Voucher to Full Page"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Expand Voucher</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  );
}
