"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import React, { useState } from "react";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchField?: keyof T;
  actions?: React.ReactNode;
}

export function DataTable<T extends object>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchField,
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtering
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    if (searchField) {
      return String(row[searchField]).toLowerCase().includes(searchTerm.toLowerCase());
    }
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (colKey: keyof T | ((row: T) => React.ReactNode), sortable?: boolean) => {
    if (!sortable || typeof colKey !== "string") return;
    if (sortColumn === colKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(colKey as keyof T);
      setSortDirection("asc");
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-3.5 sm:px-4 sm:py-3 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:border-[#174D3C] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {actions}
          <div className="text-[11px] font-medium text-slate-500 px-2 py-1 bg-slate-50 rounded-md border border-slate-200/60">
            Showing <span className="font-semibold text-slate-700">{sortedData.length}</span> of {data.length}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              {columns.map((col, idx) => {
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return (
                  <th
                    key={idx}
                    onClick={() => handleSort(col.accessorKey, col.sortable)}
                    className={`px-4 py-3 select-none ${alignClass} ${
                      col.sortable ? "cursor-pointer hover:bg-slate-100/70" : ""
                    } ${col.className || ""}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable &&
                        typeof col.accessorKey === "string" &&
                        sortColumn === col.accessorKey && (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#174D3C]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#174D3C]" />
                          )
                        )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedData.length > 0 ? (
              sortedData.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                  {columns.map((col, cIdx) => {
                    const alignClass =
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left";

                    return (
                      <td key={cIdx} className={`px-4 py-3 text-slate-700 font-medium ${alignClass}`}>
                        {typeof col.accessorKey === "function"
                          ? col.accessorKey(row)
                          : (row[col.accessorKey] as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-400">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-600">No records match search parameters.</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your search terms or filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
