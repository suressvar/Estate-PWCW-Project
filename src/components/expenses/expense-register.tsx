"use client";

import type { ExpensesPageState } from "@/components/expenses/use-expenses-page";
import {
  Calendar,
  CheckCircle2,
  Edit2,
  LayoutGrid,
  List,
  Maximize2,
  Receipt,
  Search,
  Trash2
} from "lucide-react";

type Props = Pick<ExpensesPageState,
  "activeTab" |
  "searchQuery" |
  "setSearchQuery" |
  "categoryFilter" |
  "setCategoryFilter" |
  "plotFilter" |
  "setPlotFilter" |
  "plots" |
  "totalFilteredAmount" |
  "setExpenseViewMode" |
  "expenseViewMode" |
  "filteredExpenses" |
  "openExpenseVoucher" |
  "openEditExpenseModal" |
  "handleDeleteExpense"
>;

export function ExpenseRegister({
  activeTab,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  plotFilter,
  setPlotFilter,
  plots,
  totalFilteredAmount,
  setExpenseViewMode,
  expenseViewMode,
  filteredExpenses,
  openExpenseVoucher,
  openEditExpenseModal,
  handleDeleteExpense,
}: Props) {
  return (
    activeTab === "expenses" && (
      <div className="space-y-4">
        {/* Filters Bar */}
        <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search description, payee, receipt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="PETTY_CASH">Petty Cash</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="ADMIN">Admin</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={plotFilter}
              onChange={(e) => setPlotFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Plots</option>
              {plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="text-xs text-muted-foreground">
              Total Filtered:{" "}
              <span className="font-bold text-foreground font-mono">
                ₹{totalFilteredAmount.toLocaleString()}
              </span>
            </div>
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setExpenseViewMode("cards")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${expenseViewMode === "cards"
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
                onClick={() => setExpenseViewMode("table")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${expenseViewMode === "table"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cards or Table View for Expenses */}
        {expenseViewMode === "cards" ? (
          filteredExpenses.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-xl p-12 text-center text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No expenses found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group hover:border-emerald-500/50"
                >
                  <div>
                    {/* Top Row: Ref & Category */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {exp.receiptRef || `EXP-${exp.id.slice(-6).toUpperCase()}`}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${exp.category === "PETTY_CASH"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : exp.category === "MAINTENANCE"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                      >
                        {exp.category}
                      </span>
                    </div>

                    {/* Amount & Date */}
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div className="text-xl font-black font-mono text-foreground tracking-tight">
                        ₹{Number(exp.amount).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-muted-foreground/70" />
                        {exp.date}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
                      {exp.description}
                    </p>

                    {/* Details row: Plot, Crop, Paid By */}
                    <div className="mt-3 pt-2.5 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <div className="text-muted-foreground/70 text-[10px] uppercase font-semibold">Plot / Crop</div>
                        <div className="text-foreground font-medium truncate">
                          {exp.plotName || "General Overhead"}
                        </div>
                        {exp.cropName && (
                          <div className="text-emerald-600 dark:text-emerald-400 truncate text-[10px]">
                            {exp.cropName}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-muted-foreground/70 text-[10px] uppercase font-semibold">Paid By</div>
                        <div className="text-foreground font-medium truncate">
                          {exp.paidBy || "Estate Cash"}
                        </div>
                        {exp.cropCycleId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Synced to Crop
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">General Overhead</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openExpenseVoucher(exp)}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      title="Expand Voucher to Full Page"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand Voucher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditExpenseModal(exp)}
                      className="p-1.5 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit Expense"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 border border-border rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Expenses Table */
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Plot / Crop</th>
                    <th className="py-3 px-4">Paid By</th>
                    <th className="py-3 px-4">Receipt / Bill Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Crop Sync</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-muted-foreground">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No expenses found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                          {exp.date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${exp.category === "PETTY_CASH"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : exp.category === "MAINTENANCE"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              }`}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-foreground font-medium" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-foreground">{exp.plotName || "—"}</div>
                          {exp.cropName && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              {exp.cropName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {exp.paidBy || "Estate Cash"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-muted-foreground text-[11px]">
                          <button
                            onClick={() => openExpenseVoucher(exp)}
                            className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline cursor-pointer"
                            title="View Expense Voucher Slip"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>{exp.receiptRef || `EXP-${exp.id.slice(-6).toUpperCase()}`}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-foreground font-mono">
                          ₹{Number(exp.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {exp.cropCycleId ? (
                            <span
                              title={`Synced under MISC in Crop Ledger`}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Synced
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-[11px]">Overhead</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => openExpenseVoucher(exp)}
                            className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded transition-colors cursor-pointer"
                            title="Expand Voucher Slip"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditExpenseModal(exp)}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-muted-foreground hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
