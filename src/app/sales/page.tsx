"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ExpenseUnit, PartyItem } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { ExpenseLedgerItem } from "@/lib/accounting-data";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

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
  const [recordNo, setRecordNo] = useState("");
  const [dateOfSale, setDateOfSale] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [ledgerAccounts, setLedgerAccounts] = useState<ExpenseLedgerItem[]>([]);
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [selectedLedgerName, setSelectedLedgerName] = useState("");
  const [availableUnits, setAvailableUnits] = useState<ExpenseUnit[]>([]);

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
  const [parties, setParties] = useState<PartyItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load ledgers, existing sales, units, and categories
  useEffect(() => {
    async function loadData() {
      try {
        const [ledgersRes, salesRes, unitsRes, catsRes, partiesRes] = await Promise.all([
          fetch("/api/expense-ledgers"),
          fetch("/api/sales/other"),
          fetch("/api/units"),
          fetch("/api/sales-categories"),
          fetch("/api/parties"),
        ]);
        const ledgersData: ExpenseLedgerItem[] = await ledgersRes.json();
        await salesRes.json();
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

        if (partiesRes.ok) {
          const partiesData = await partiesRes.json();
          if (Array.isArray(partiesData)) {
            setParties(partiesData);
            if (typeof window !== "undefined") {
              const bParam = new URLSearchParams(window.location.search).get("buyer");
              if (bParam) {
                setBuyerName(bParam);
                const matched = partiesData.find(
                  (p: PartyItem) => p.name.trim().toLowerCase() === bParam.trim().toLowerCase()
                );
                if (matched) {
                  if (matched.city) setBuyerCity(matched.city);
                  if (matched.phone) setBuyerContact(matched.phone);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Error loading sales initial data:", e);
      }
    }
    loadData();
  }, []);

  const handleBuyerNameChange = (name: string) => {
    setBuyerName(name);
    const matched = parties.find(
      (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (matched) {
      if (matched.city) setBuyerCity(matched.city);
      if (matched.phone) setBuyerContact(matched.phone);
    }
  };

  // Update item field and recalculate row total
  const handleItemChange = (index: number, field: keyof SaleLineItem, value: string | number) => {
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
          quantity: Number(it.quantity),
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
    } catch (err) {
      setErrorMsg(getErrorMessage(err) || "An error occurred while saving the sale.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Record Produce Sale"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Sales Register", href: "/sales-register" },
          { label: "New Sales Entry" },
        ]}
        actions={
          <Link
            href="/sales-register"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg transition-colors shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-[#64748B]" />
            <span>View Sales Register</span>
          </Link>
        }
      />

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded-xl">
          {errorMsg}
        </div>
      )}

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: INVOICE DETAILS */}
          <ContentCard title="Invoice Particulars">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Record No */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">
                  Record Reference
                </label>
                <input
                  type="text"
                  value={recordNo}
                  placeholder="Auto-assigned if empty"
                  onChange={(e) => setRecordNo(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              {/* Date of Sale */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">
                  Date of Sale *
                </label>
                <input
                  type="date"
                  required
                  value={dateOfSale}
                  onChange={(e) => setDateOfSale(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#111827]">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="text-[11px] font-semibold text-[#174D3C] hover:underline"
                  >
                    + New
                  </button>
                </div>
                <select
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
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
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">
                  Ledger Account *
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
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                >
                  <option value="">Select Ledger</option>
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
          </ContentCard>

          {/* SECTION 2: BUYER INFORMATION */}
          <ContentCard
            title="Buyer Particulars"
            badge={parties.length > 0 ? `${parties.length} Retailers` : undefined}
          >
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">
                  Buyer Full Name / Establishment
                </label>
                <input
                  type="text"
                  list="buyers-suggestions"
                  placeholder="Name of buyer or retail establishment"
                  aria-label="Buyer name"
                  value={buyerName}
                  onChange={(e) => handleBuyerNameChange(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
                <datalist id="buyers-suggestions">
                  {parties.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.city ? `(${p.city})` : ""} [{p.type}]
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">
                    Buyer City / Town
                  </label>
                  <input
                    type="text"
                    placeholder="City / Market location"
                    value={buyerCity}
                    onChange={(e) => setBuyerCity(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">
                    Buyer Phone / Contact
                  </label>
                  <input
                    type="text"
                    placeholder="Mobile / Phone number"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </ContentCard>

          {/* SECTION 3: REVENUE ITEM DETAILS */}
          <ContentCard title="Produce Line Items">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-3 relative group"
                >
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="absolute top-2.5 right-2.5 text-[#94A3B8] hover:text-red-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Top Row: Item, Quantity, Units */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="text-xs font-semibold text-[#111827]">
                        Produce Item *
                      </label>
                      <input
                        type="text"
                        required
                        aria-label="Sale item"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-xs font-semibold text-[#111827]">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.0"
                        aria-label="Sale quantity"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-xs font-semibold text-[#111827]">
                        Units *
                      </label>
                      <select
                        required
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
                      >
                        {availableUnits.map((u) => (
                          <option key={u.id} value={u.unitSymbol}>
                            {u.unitName} ({u.unitSymbol})
                          </option>
                        ))}
                        {availableUnits.length === 0 && <option value="KG">KG</option>}
                      </select>
                    </div>
                  </div>

                  {/* Bottom Row: Per Unit Rs, Total Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#111827]">
                        Rate Per Unit (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B] font-semibold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="0.00"
                          aria-label="Sale unit price"
                          value={item.pricePerUnit}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "pricePerUnit",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="w-full pl-6 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827] focus:ring-1 focus:ring-[#174D3C]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#111827]">
                        Line Total
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B] font-semibold text-xs">
                          ₹
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={item.totalAmount.toFixed(2)}
                          className="w-full pl-6 pr-3 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs font-mono font-semibold text-[#174D3C] cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#C5DEC8] text-[#174D3C] hover:bg-[#EAF3EE] rounded-lg text-xs font-semibold transition-colors w-fit shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Item</span>
                </button>

                <div className="px-4 py-2 bg-[#EAF3EE] border border-[#C5DEC8] rounded-lg flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#174D3C] uppercase tracking-wider">
                    Grand Total:
                  </span>
                  <span className="text-base font-bold text-[#174D3C] font-mono">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </ContentCard>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {submitting ? "Recording Sales Transaction..." : "Record Sales Transaction"}
            </span>
          </button>
        </form>
      </div>

      {/* MODAL: ADD NEW SALES CATEGORY */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 border border-[#E2E8F0] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Create Sales Category</h3>
              <button
                type="button"
                onClick={() => {
                  setCategoryModalOpen(false);
                  setNewCategoryName("");
                }}
                className="p-1 rounded-md text-[#64748B] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Honey, Coconut Oil, Fodder Grass"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryModalOpen(false);
                    setNewCategoryName("");
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {creatingCategory ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
