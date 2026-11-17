"use client";

import { PurchasePaymentStatus } from "./purchase-payment-status";

import type { PurchasesPageState } from "@/components/purchases/use-purchases-page";
import {
  FileText,
  Maximize2,
  Printer,
  Receipt,
  ShoppingBag,
  Tag,
  Trash2
} from "lucide-react";

type Props = Pick<PurchasesPageState,
  "filteredLogs" |
  "setShowCreateForm" |
  "viewMode" |
  "openSlipModal" |
  "categoryGroups" |
  "canEdit" |
  "handleDeleteVoucher" |
  "logs"
>;

export function PurchaseRegister({
  filteredLogs,
  setShowCreateForm,
  viewMode,
  openSlipModal,
  categoryGroups,
  canEdit,
  handleDeleteVoucher,
  logs,
}: Props) {
  return (
    filteredLogs.length === 0 ? (
      <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No purchase vouchers found</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Use the Purchase Voucher form to record your first transaction and generate an official Ranga Estate voucher.
        </p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-block px-4 py-2 bg-[#15803d] text-white rounded-lg text-xs font-bold hover:bg-[#166534] cursor-pointer"
        >
          Go to Purchase Voucher
        </button>
      </div>
    ) : viewMode === "cards" ? (
      /* ========================================================================= */
      /* VOUCHER CARDS GRID VIEW - EXPANDABLE TO FULL PAGE                         */
      /* ========================================================================= */
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group hover:border-emerald-300"
          >
            <div>
              {/* Card Header: Voucher No, Date, Status */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-[#15803d]">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      VOUCHER NO
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {log.voucherNo || `VCH-${log.id}`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.paymentStatus === "PAID" || !log.paymentStatus
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : log.paymentStatus === "PENDING"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                  >
                    {log.paymentStatus || "PAID"}
                  </span>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{log.date}</div>
                </div>
              </div>

              {/* Vendor & Amount */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                    {log.vendorName || "General Supplier"}
                  </h3>
                  <span className="font-mono font-black text-slate-900 text-base">
                    ₹{Number(log.cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {log.vendorBillNo && (
                  <div className="text-[11px] text-slate-500 font-mono">Bill/Inv: {log.vendorBillNo}</div>
                )}
              </div>

              {/* Category & Plot Box */}
              <div className="bg-slate-50/80 rounded-xl p-3 space-y-1 text-xs text-slate-600 mb-4 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-bold text-slate-800">{log.category || "General"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plot:</span>
                  <span className="font-bold text-emerald-800">{log.plotName || "General Estate"}</span>
                </div>
                {log.description && (
                  <div className="pt-1 text-[11px] text-slate-500 truncate">
                    {log.description}
                  </div>
                )}
              </div>
            </div>

            {/* Card Actions: Expand to Full Page & Print */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => openSlipModal(log)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Expand Voucher to Full Page View"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Expand Voucher</span>
              </button>

              <button
                onClick={() => openSlipModal(log)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Print Voucher Slip"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : viewMode === "grouped" ? (
      /* ========================================================================= */
      /* CATEGORY-WISE DISPLAYED VOUCHERS                                          */
      /* ========================================================================= */
      <div className="space-y-6">
        {categoryGroups.map((group) => {
          if (group.records.length === 0) return null;

          return (
            <div
              key={group.name}
              className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
            >
              {/* Category Header Banner */}
              <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#15803d] text-white flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>{group.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        {group.records.length} {group.records.length === 1 ? "Voucher" : "Vouchers"}
                      </span>
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-600">
                    Category Total:{" "}
                    <span className="font-extrabold text-sm text-[#15803d]">
                      ₹{group.totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table for this Category */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Voucher No</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Vendor / Supplier</th>
                      <th className="p-3.5">Plot Allocation</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5 text-right">Voucher Cost</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Print / Slip</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {group.records.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-emerald-950">
                          <button
                            onClick={() => openSlipModal(log)}
                            className="hover:underline text-left cursor-pointer flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-700" />
                            {log.voucherNo || `PUR-${log.id}`}
                          </button>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">{log.date}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{log.vendorName || "General Supplier"}</div>
                          {log.vendorBillNo && (
                            <div className="text-[11px] text-slate-500 font-mono">Bill: {log.vendorBillNo}</div>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">{log.plotName || "General Estate"}</td>
                        <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate">
                          {log.description}
                        </td>
                        <td className="p-3.5 font-mono font-black text-slate-900 text-sm text-right">
                          ₹{Number(log.cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-center">
                          <PurchasePaymentStatus status={log.paymentStatus} />
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => openSlipModal(log)}
                            title="View Official Voucher Slip"
                            className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="p-3.5 text-center">
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteVoucher(log.id)}
                              title="Void Voucher"
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      /* ========================================================================= */
      /* FLAT TABLE VIEW                                                           */
      /* ========================================================================= */
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Showing {filteredLogs.length} of {logs.length} purchase vouchers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Voucher No</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Category Head</th>
                <th className="p-3.5">Vendor / Supplier</th>
                <th className="p-3.5">Plot Allocation</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Voucher Cost</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Print / Slip</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-emerald-950">
                    <button
                      onClick={() => openSlipModal(log)}
                      className="hover:underline text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      {log.voucherNo || `PUR-${log.id}`}
                    </button>
                  </td>
                  <td className="p-3.5 text-slate-600 font-medium">{log.date}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                      {log.category || "General"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{log.vendorName || "General Supplier"}</div>
                    {log.vendorBillNo && (
                      <div className="text-[11px] text-slate-500 font-mono">Bill: {log.vendorBillNo}</div>
                    )}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">{log.plotName || "General Estate"}</td>
                  <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate">
                    {log.description}
                  </td>
                  <td className="p-3.5 font-mono font-black text-slate-900 text-sm text-right">
                    ₹{Number(log.cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-center">
                    <PurchasePaymentStatus status={log.paymentStatus} />
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => openSlipModal(log)}
                      title="View Official Voucher Slip"
                      className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer border border-slate-200 inline-flex items-center justify-center"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="p-3.5 text-center">
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteVoucher(log.id)}
                        title="Void Voucher"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  );
}
