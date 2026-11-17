"use client";

import type { MasterDailySheetState } from "@/components/daily-log/master-sheet/use-master-daily-sheet";
import {
  Sprout
} from "lucide-react";

type Props = Pick<MasterDailySheetState,
  "salesTotalValue" |
  "salesCropName" |
  "setSalesCropName" |
  "crops" |
  "salesQtyKg" |
  "setSalesQtyKg" |
  "handleSalesQtyOrRate" |
  "salesRatePerKg" |
  "setSalesRatePerKg" |
  "setSalesTotalValue" |
  "buyerName" |
  "setBuyerName" |
  "paymentMode" |
  "setPaymentMode" |
  "salesNotes" |
  "setSalesNotes"
>;

export function SalesSection({
  salesTotalValue,
  salesCropName,
  setSalesCropName,
  crops,
  salesQtyKg,
  setSalesQtyKg,
  handleSalesQtyOrRate,
  salesRatePerKg,
  setSalesRatePerKg,
  setSalesTotalValue,
  buyerName,
  setBuyerName,
  paymentMode,
  setPaymentMode,
  salesNotes,
  setSalesNotes,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Sprout className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">5. Harvest & Produce Sales Yield</h4>
            <p className="text-[10px] text-slate-500">Harvest output or market sales (Pushes to Sales Register at /sales)</p>
          </div>
        </div>
        {Number(salesTotalValue) > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
            + ₹{Number(salesTotalValue).toLocaleString()}
          </span>
        )}
      </div>

      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Harvested Crop</label>
            <input
              id="master-sales-crop"
              type="text"
              list="crops-suggestions"
              placeholder="e.g. Coffee Arabica, Coconut"
              value={salesCropName}
              onChange={(e) => setSalesCropName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <datalist id="crops-suggestions">
              {crops.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Quantity (kg / units)</label>
            <input
              id="master-sales-qty"
              type="number"
              min="0"
              placeholder="0"
              value={salesQtyKg}
              onChange={(e) => {
                const q = e.target.value === "" ? "" : Number(e.target.value);
                setSalesQtyKg(q);
                handleSalesQtyOrRate(q, salesRatePerKg);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Rate (₹/kg)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={salesRatePerKg}
              onChange={(e) => {
                const r = e.target.value === "" ? "" : Number(e.target.value);
                setSalesRatePerKg(r);
                handleSalesQtyOrRate(salesQtyKg, r);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Total Inflow Value (₹)</label>
            <input
              id="master-sales-value"
              type="number"
              min="0"
              placeholder="₹ 0"
              value={salesTotalValue}
              onChange={(e) => setSalesTotalValue(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-black text-amber-900 bg-amber-50/50 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Buyer / Mandi Trader</label>
            <input
              type="text"
              placeholder="Buyer Name or Local Mandi"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="Cash">Cash</option>
              <option value="UPI / QR">UPI / QR</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit / On Account">Credit / On Account</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600">Harvest Batch / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Grade A cherry picking, Bag batch #4"
              value={salesNotes}
              onChange={(e) => setSalesNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
