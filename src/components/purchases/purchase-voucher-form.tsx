"use client";

import type { PurchasesPageState } from "@/components/purchases/use-purchases-page";
import {
  Calendar,
  Check,
  Plus,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Store,
  Tag,
  X
} from "lucide-react";
import Link from "next/link";

type Props = Pick<PurchasesPageState,
  "canEdit" |
  "showCreateForm" |
  "handleSubmitVoucher" |
  "voucherNo" |
  "setVoucherNo" |
  "setShowCreateForm" |
  "setShowAddCategory" |
  "showAddCategory" |
  "category" |
  "setCategory" |
  "categories" |
  "newCategoryName" |
  "setNewCategoryName" |
  "handleCreateCategory" |
  "selectedPlotId" |
  "handlePlotChange" |
  "plots" |
  "selectedPlotCropId" |
  "setSelectedPlotCropId" |
  "associations" |
  "vendorName" |
  "setVendorName" |
  "parties" |
  "vendorContact" |
  "setVendorContact" |
  "vendorGstin" |
  "setVendorGstin" |
  "vendorBillNo" |
  "setVendorBillNo" |
  "date" |
  "setDate" |
  "paymentMode" |
  "setPaymentMode" |
  "paymentStatus" |
  "setPaymentStatus" |
  "items" |
  "addItemRow" |
  "handleItemChange" |
  "availableUnits" |
  "removeItemRow" |
  "subtotal" |
  "grandTotal"
>;

export function PurchaseVoucherForm({
  canEdit,
  showCreateForm,
  handleSubmitVoucher,
  voucherNo,
  setVoucherNo,
  setShowCreateForm,
  setShowAddCategory,
  showAddCategory,
  category,
  setCategory,
  categories,
  newCategoryName,
  setNewCategoryName,
  handleCreateCategory,
  selectedPlotId,
  handlePlotChange,
  plots,
  selectedPlotCropId,
  setSelectedPlotCropId,
  associations,
  vendorName,
  setVendorName,
  parties,
  vendorContact,
  setVendorContact,
  vendorGstin,
  setVendorGstin,
  vendorBillNo,
  setVendorBillNo,
  date,
  setDate,
  paymentMode,
  setPaymentMode,
  paymentStatus,
  setPaymentStatus,
  items,
  addItemRow,
  handleItemChange,
  availableUnits,
  removeItemRow,
  subtotal,
  grandTotal,
}: Props) {
  return (
    !canEdit ? (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Access Restricted: Field Staff role can only inspect purchase logs. Switch to Admin to record official Purchase Vouchers.
        </span>
      </div>
    ) : (
      showCreateForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-w-4xl w-full my-auto transition-all animate-in zoom-in-95 duration-200">
            <form
              onSubmit={handleSubmitVoucher}
              className="space-y-6"
            >
              {/* Signature Green Banner Header matching Photo */}
              <div className="bg-[#38764B] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-white/95">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 2H5c-1.1 0-2 .9-2 2v18l3-2 3 2 3-2 3 2 3-2 3 2V4c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V6h10v2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white leading-tight">
                      ESTATE VOUCHERS
                    </h2>
                    <div className="text-xs text-emerald-100/90 font-medium">
                      Voucher Type: PURCHASE
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 font-mono font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-200 text-[10px] uppercase">VOUCHER NO:</span>
                    <input
                      type="text"
                      required
                      value={voucherNo}
                      onChange={(e) => setVoucherNo(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-emerald-950 focus:outline-none"
                    />
                  </div>
                  <span className="bg-white/20 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg uppercase tracking-wider select-none shadow-2xs">
                    NEW ENTRY
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close Voucher Modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-7 pt-0 space-y-6">

                {/* Grid 1: Category, Vendor & Allocation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  {/* Category & Allocation */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-700" /> Category & Allocation
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700">Procurement Category</label>
                        <button
                          type="button"
                          onClick={() => setShowAddCategory(!showAddCategory)}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 hover:underline cursor-pointer"
                          title="Create a new procurement category"
                        >
                          <Plus className="w-3 h-3" />
                          {showAddCategory ? "Select Existing" : "Create Category"}
                        </button>
                      </div>

                      {!showAddCategory ? (
                        <select
                          value={category}
                          onChange={(e) => {
                            if (e.target.value === "__NEW__") {
                              setShowAddCategory(true);
                            } else {
                              setCategory(e.target.value);
                            }
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:ring-1 focus:ring-emerald-500"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__NEW__" className="font-semibold text-emerald-700">
                            + Create New Category...
                          </option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Enter category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleCreateCategory(newCategoryName);
                              }
                            }}
                            className="flex-1 p-2 bg-white border border-emerald-500 rounded-lg text-slate-900 font-medium text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateCategory(newCategoryName)}
                            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCategory(false);
                              setNewCategoryName("");
                            }}
                            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Allocated Land Plot</label>
                      <select
                        value={selectedPlotId}
                        onChange={(e) => handlePlotChange(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      >
                        <option value="">General Estate Operations</option>
                        {plots.map((plot) => (
                          <option key={plot.id} value={plot.id}>
                            {plot.name} ({plot.areaAcres} Acres)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Crop / Activity Associated</label>
                      <select
                        value={selectedPlotCropId}
                        onChange={(e) => setSelectedPlotCropId(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      >
                        <option value="">General / Not Tied to Single Crop</option>
                        {associations
                          .filter((a) => !selectedPlotId || a.plotId === selectedPlotId)
                          .map((pc) => (
                            <option key={pc.id} value={pc.id}>
                              {pc.cropActivityName} [{pc.status}]
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Vendor / Supplier Information */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-700" /> Vendor / Supplier Details
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700">Supplier / Dealer Name</label>
                        <Link
                          href="/purchases/retailers"
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline flex items-center gap-1"
                        >
                          <Store className="w-3 h-3" /> Manage Directory
                        </Link>
                      </div>
                      <input
                        type="text"
                        list="registered-vendors"
                        required
                        placeholder="Enter or select vendor / supplier name"
                        aria-label="Supplier name"
                        value={vendorName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVendorName(val);
                          const matched = parties.find((p) => p.name?.toLowerCase() === val.toLowerCase());
                          if (matched) {
                            if (matched.phone && !vendorContact) setVendorContact(matched.phone);
                            if (matched.gstin && !vendorGstin) setVendorGstin(matched.gstin);
                          }
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      />
                      <datalist id="registered-vendors">
                        {parties.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.type} {p.city ? `(${p.city})` : ""}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Vendor Bill / Inv #</label>
                        <input
                          type="text"
                          value={vendorBillNo}
                          onChange={(e) => setVendorBillNo(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Vendor Contact</label>
                        <input
                          type="text"
                          value={vendorContact}
                          onChange={(e) => setVendorContact(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Vendor GSTIN / Tax ID</label>
                      <input
                        type="text"
                        value={vendorGstin}
                        onChange={(e) => setVendorGstin(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Voucher Date & Settlement Details */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date & Settlement Mode
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Purchase Date</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Payment Mode</label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value as "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit")}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="UPI / QR">UPI / QR</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Credit">Credit / Account</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Payment Status</label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value as "PAID" | "PENDING" | "PARTIAL")}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-bold"
                        >
                          <option value="PAID">PAID</option>
                          <option value="PENDING">PENDING</option>
                          <option value="PARTIAL">PARTIAL</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid 2: Itemized Particulars Grid (Voucher Format) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Purchased Items & Material Particulars ({items.length})
                    </h3>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Add Line Item
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 bg-white">
                    <div className="bg-slate-100 p-3 grid grid-cols-12 gap-2 text-slate-700 font-bold uppercase text-xs">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-4">Material / Service</div>
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-2">Unit</div>
                      <div className="col-span-1">Rate (₹)</div>
                      <div className="col-span-2 text-right">Amount (₹)</div>
                    </div>

                    {items.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 grid grid-cols-12 gap-2 items-center text-xs hover:bg-slate-50/50">
                        <div className="col-span-1 text-center text-slate-400 font-mono font-bold">
                          {idx + 1}
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            aria-label="Purchase item"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            required
                            min="1"
                            aria-label="Purchase quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono font-semibold"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium"
                          >
                            {availableUnits.map((u) => (
                              <option key={u.id} value={u.unitSymbol}>
                                {u.unitName} ({u.unitSymbol})
                              </option>
                            ))}
                            {availableUnits.length === 0 && (
                              <option value="units">units</option>
                            )}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            aria-label="Purchase unit price"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-mono font-semibold"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5">
                          <input
                            type="number"
                            required
                            value={item.amount}
                            onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                            className="w-full p-2 bg-slate-100 border border-slate-300 rounded-md text-slate-900 font-mono font-bold text-right text-emerald-900"
                          />
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                              title="Delete Item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculations & Submit Footer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 items-end">
                  <div />

                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal Amount:</span>
                      <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Category Head:</span>
                      <span>{category}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-sans">
                      <span className="font-black text-slate-100 uppercase tracking-wide">
                        Net Voucher Cost:
                      </span>
                      <span className="font-black text-xl font-mono text-emerald-400">
                        ₹{grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#38764B] hover:bg-[#2D603D] text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Save Voucher
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )
    )
  );
}
