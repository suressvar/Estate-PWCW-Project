"use client";

import { PURCHASE_CATEGORIES } from "@/components/daily-log/master-sheet/options";
import type { MasterDailySheetState } from "@/components/daily-log/master-sheet/use-master-daily-sheet";
import {
  ShoppingCart
} from "lucide-react";

type Props = Pick<MasterDailySheetState,
  "purchaseCost" |
  "purchaseCategory" |
  "setPurchaseCategory" |
  "purchaseDescription" |
  "setPurchaseDescription" |
  "setPurchaseCost" |
  "purchaseVendor" |
  "setPurchaseVendor" |
  "purchasePaymentMode" |
  "setPurchasePaymentMode"
>;

export function PurchaseSection({
  purchaseCost,
  purchaseCategory,
  setPurchaseCategory,
  purchaseDescription,
  setPurchaseDescription,
  setPurchaseCost,
  purchaseVendor,
  setPurchaseVendor,
  purchasePaymentMode,
  setPurchasePaymentMode,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">6. Daily Field Purchases & Petty Expenses</h4>
            <p className="text-[10px] text-slate-500">Consumables, repairs, hardware (Pushes to Purchases at /purchases)</p>
          </div>
        </div>
        {Number(purchaseCost) > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900">
            - ₹{Number(purchaseCost).toLocaleString()}
          </span>
        )}
      </div>

      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Expense Category</label>
            <select
              value={purchaseCategory}
              onChange={(e) => setPurchaseCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {PURCHASE_CATEGORIES.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Item Description / Particulars</label>
            <input
              id="master-purchase-desc"
              type="text"
              placeholder="e.g. PVC Joiners, Pruning shears, Hose clip"
              value={purchaseDescription}
              onChange={(e) => setPurchaseDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Cost (₹)</label>
            <input
              id="master-purchase-cost"
              type="number"
              min="0"
              placeholder="₹ 0"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-rose-800 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Vendor / Shop Name</label>
            <input
              type="text"
              placeholder="Local Hardware / Dealer"
              value={purchaseVendor}
              onChange={(e) => setPurchaseVendor(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Payment Mode</label>
            <select
              value={purchasePaymentMode}
              onChange={(e) => setPurchasePaymentMode(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              <option value="Cash">Cash (Petty Cash)</option>
              <option value="UPI / QR">UPI / QR</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit">Credit / Due</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
