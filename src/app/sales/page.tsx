"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Trash2,
  BookOpen,
  IndianRupee,
  Layers,
  CheckCircle2,
  X,
} from "lucide-react";
import { ExpenseLedgerItem } from "@/lib/accounting-data";

interface SaleLineItem {
  id: string;
  itemName: string;
  quantity: number | "";
  unit: string;
  pricePerUnit: number | "";
  totalAmount: number;
}

export default function SalesEntryPage() {
  const router = useRouter();

  // Invoice Details
  const [recordNo, setRecordNo] = useState("1");
  const [dateOfSale, setDateOfSale] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [ledgerAccounts, setLedgerAccounts] = useState<ExpenseLedgerItem[]>([]);
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [selectedLedgerName, setSelectedLedgerName] = useState("");
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  // Sales Category
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Vegetables & Greens");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Revenue Items
  const [items, setItems] = useState<SaleLineItem[]>([
    {
      id: "1",
      itemName: "",
      quantity: "",
      unit: "KG",
      pricePerUnit: "",
      totalAmount: 0,
    },
  ]);

  // Buyer Information
  const [buyerName, setBuyerName] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [buyerContact, setBuyerContact] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load ledgers, existing sales, units, and categories
  useEffect(() => {
    async function loadData() {
      try {
        const [ledgersRes, salesRes, unitsRes, catsRes] = await Promise.all([
          fetch("/api/expense-ledgers"),
          fetch("/api/sales/other"),
          fetch("/api/units"),
          fetch("/api/sales-categories"),
        ]);
        const ledgersData: ExpenseLedgerItem[] = await ledgersRes.json();
        const salesData = await salesRes.json();
        const unitsData = await unitsRes.json();
        const catsData = await catsRes.json().catch(() => ({ categories: [] }));

        if (Array.isArray(catsData.categories) && catsData.categories.length > 0) {
          setCategories(catsData.categories);
          setSelectedCategory(catsData.categories[0]);
        }

        if (Array.isArray(unitsData) && unitsData.length > 0) {
          setAvailableUnits(unitsData);
          setItems((prev) =>
            prev.map((it) => ({
              ...it,
              unit: it.unit && it.unit !== "Units" ? it.unit : unitsData[0].unitSymbol,
            }))
          );
        }

        if (Array.isArray(ledgersData)) {
          setLedgerAccounts(ledgersData);
          if (ledgersData.length > 0) {
            const salesLedger = ledgersData.find(
              (l) => l.ledgerName.toLowerCase().includes("sale") || l.groupType === "INCOME"
            );
            if (salesLedger) {
              setSelectedLedgerId(salesLedger.id);
              setSelectedLedgerName(salesLedger.ledgerName);
            } else {
              setSelectedLedgerId(ledgersData[0].id);
              setSelectedLedgerName(ledgersData[0].ledgerName);
            }
          }
        }

        if (Array.isArray(salesData)) {
          setRecordNo(String(salesData.length + 1));
        }
      } catch (e) {
        console.error("Error loading sales initial data:", e);
      }
    }
    loadData();
  }, []);

  // Update item field and recalculate row total
  const handleItemChange = (index: number, field: keyof SaleLineItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    const qty = field === "quantity" ? Number(value) || 0 : Number(item.quantity) || 0;
    const price = field === "pricePerUnit" ? Number(value) || 0 : Number(item.pricePerUnit) || 0;
    item.totalAmount = Math.round(qty * price * 100) / 100;

    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        itemName: "",
        quantity: "",
        unit: availableUnits[0]?.unitSymbol || "KG",
        pricePerUnit: "",
        totalAmount: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      setCreatingCategory(true);
      const res = await fetch("/api/sales-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
        setSelectedCategory(newCategoryName.trim());
        setNewCategoryName("");
        setCategoryModalOpen(false);
      }
    } catch (err) {
      console.error("Error creating category:", err);
    } finally {
      setCreatingCategory(false);
    }
  };

  const grandTotal = items.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const validItems = items.filter((i) => i.itemName.trim() !== "");
    if (validItems.length === 0) {
      setErrorMsg("Please add at least one item with a valid name.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        recordNo,
        dateOfSale,
        category: selectedCategory,
        ledgerId: selectedLedgerId,
        particularName: selectedLedgerName || "General Sales",
        buyerName: buyerName.trim() || "Walk-in Customer",
        buyerCity: buyerCity.trim(),
        buyerContact: buyerContact.trim(),
        items: validItems.map((it) => ({
          itemName: it.itemName.trim(),
          quantity: Number(it.quantity) || 1,
          unit: it.unit.trim() || "Units",
          pricePerUnit: Number(it.pricePerUnit) || 0,
          totalAmount: it.totalAmount,
          category: selectedCategory,
        })),
      };

      const res = await fetch("/api/sales/other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.invoiceGroupId) {
        router.push(`/sales-invoice/${data.invoiceGroupId}`);
      } else {
        setErrorMsg(data.error || "Failed to record sales transaction.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving the sale.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header Links */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Ranga Estate</span>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-bold text-slate-900">Sales Entry</span>
        </div>

        <Link
          href="/sales-register"
          className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span>View Sales Register</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: INVOICE DETAILS */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-[#15803d] uppercase tracking-wider">
              INVOICE DETAILS
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Record No */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  RECORD NO
                </label>
                <input
                  type="text"
                  value={recordNo}
                  onChange={(e) => setRecordNo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
                />
              </div>

              {/* Date of Sale */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  DATE OF SALE <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dateOfSale}
                    onChange={(e) => setDateOfSale(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    CATEGORY <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <option value="General Estate Sales">General Estate Sales</option>
                  )}
                </select>
              </div>

              {/* Ledger Accounts */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  LEDGER ACCOUNTS <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLedgerId}
                  onChange={(e) => {
                    setSelectedLedgerId(e.target.value);
                    const found = ledgerAccounts.find((l) => l.id === e.target.value);
                    if (found) {
                      setSelectedLedgerName(found.ledgerName);
                    } else {
                      setSelectedLedgerName(e.target.value || "General Sales");
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
                >
                  <option value="">Select Ledger Account</option>
                  {ledgerAccounts.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.ledgerName}
                    </option>
                  ))}
                  {ledgerAccounts.length === 0 && (
                    <option value="general_sales">General Sales</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* SECTION 2: REVENUE ITEM DETAILS */}
          <div className="space-y-5">
            <h2 className="text-sm font-extrabold text-[#15803d] uppercase tracking-wider">
              REVENUE ITEM DETAILS
            </h2>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Top Row: Item, Quantity, Units */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        ITEM <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        QUANTITY <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.0"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Units <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
                      >
                        {availableUnits.map((u) => (
                          <option key={u.id} value={u.unitSymbol}>
                            {u.unitName} ({u.unitSymbol})
                          </option>
                        ))}
                        {availableUnits.length === 0 && (
                          <option value="KG">KG</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Bottom Row: Per Unit Rs, Total Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Per Unit Rs <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="0.00"
                          value={item.pricePerUnit}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "pricePerUnit",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        TOTAL AMOUNT
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={item.totalAmount.toFixed(2)}
                          className="w-full pl-7 pr-3 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row of Section 2: + Add Another Item & GRAND TOTAL Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#15803d] text-[#15803d] hover:bg-[#15803d]/5 rounded-full text-xs font-bold transition-colors w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Item</span>
              </button>

              <div className="px-5 py-2.5 bg-[#E6F7ED] border border-emerald-200 rounded-full flex items-center justify-between sm:justify-end gap-3 w-fit self-end sm:self-auto">
                <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                  GRAND TOTAL:
                </span>
                <span className="text-lg font-black text-[#15803d]">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* SECTION 3: BUYER INFORMATION */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-[#15803d] uppercase tracking-wider">
              BUYER INFORMATION
            </h2>

            {/* Buyer Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">
                BUYER FULL NAME
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
              />
            </div>

            {/* Buyer City & Buyer Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  BUYER CITY
                </label>
                <input
                  type="text"
                  value={buyerCity}
                  onChange={(e) => setBuyerCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  BUYER CONTACT DETAILS
                </label>
                <input
                  type="text"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-[#15803d] hover:bg-[#166534] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {submitting ? "Recording Sales Transaction..." : "Record Sales Transaction"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW SALES CATEGORY */}
      {/* ========================================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  +
                </span>
                <span>Create Sales Category</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCategoryModalOpen(false);
                  setNewCategoryName("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Honey, Coconut Oil, Fodder Grass"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryModalOpen(false);
                    setNewCategoryName("");
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="px-4 py-2 text-xs font-bold bg-[#15803d] hover:bg-[#166534] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingCategory ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
