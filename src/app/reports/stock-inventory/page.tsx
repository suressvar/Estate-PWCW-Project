"use client";

import React, { useEffect, useState } from "react";
import { csvDocument, csvDataUri } from "@/lib/csv";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { InventoryType, StockInventoryItem } from "@/lib/inventory-data";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCard } from "@/components/ui/content-card";
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  FileSpreadsheet,
  Layers,
  Pill,
  Printer,
  ShieldAlert,
  Syringe,
  X,
} from "lucide-react";

export default function StockInventoryReportPage() {
  const [activeTab, setActiveTab] = useState<InventoryType>("feed");
  const [feedItems, setFeedItems] = useState<StockInventoryItem[]>([]);
  const [medItems, setMedItems] = useState<StockInventoryItem[]>([]);
  const [vacItems, setVacItems] = useState<StockInventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockInventoryItem[]>([]);
  const [, setLoading] = useState(true);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<StockInventoryItem | null>(null);
  const [usedQty, setUsedQty] = useState<number | "">(0);
  const [wastageQty, setWastageQty] = useState<number | "">(0);
  const [alertLevel, setAlertLevel] = useState<number | "">(0);
  const [costPerUnit, setCostPerUnit] = useState<number | "">(0);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [feedRes, medRes, vacRes, alertsRes] = await Promise.all([
        fetch("/api/inventory/feed"),
        fetch("/api/inventory/medicine"),
        fetch("/api/inventory/vaccine"),
        fetch("/api/inventory/alerts"),
      ]);

      const fData = await feedRes.json();
      const mData = await medRes.json();
      const vData = await vacRes.json();
      const aData = await alertsRes.json();

      setFeedItems(fData);
      setMedItems(mData);
      setVacItems(vData);
      setAlerts(aData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchInventory();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, []);

  const openEditModal = (item: StockInventoryItem) => {
    setEditingItem(item);
    setUsedQty(item.usedQty);
    setWastageQty(item.wastageQty);
    setAlertLevel(item.alertLevel);
    setCostPerUnit(item.costPerUnit);
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(
        `/api/inventory/${editingItem.itemType}/${editingItem.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usedQty: Number(usedQty),
            wastageQty: Number(wastageQty),
            alertLevel: Number(alertLevel),
            costPerUnit: Number(costPerUnit),
          }),
        }
      );

      if (res.ok) {
        setMsg({
          type: "success",
          text: `Stock balance updated for "${editingItem.name}"!`,
        });
        setEditingItem(null);
        fetchInventory();
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  };

  const currentList =
    activeTab === "feed"
      ? feedItems
      : activeTab === "medicine"
      ? medItems
      : vacItems;

  const totalOpeningValue = currentList.reduce(
    (acc, i) => acc + i.openingStock * i.costPerUnit,
    0
  );
  const totalPurchasedValue = currentList.reduce(
    (acc, i) => acc + i.purchasedQty * i.costPerUnit,
    0
  );
  const totalClosingValue = currentList.reduce(
    (acc, i) => acc + i.totalCost,
    0
  );

  const exportCSV = () => {
    if (currentList.length === 0) return;
    const headers = [
      "ItemName",
      "OpeningStock",
      "PurchasedQty",
      "UsedQty",
      "WastageQty",
      "ClosingStock",
      "Unit",
      "CostPerUnit",
      "TotalValue",
      "AlertLevel",
      "Status",
    ];
    const rows = currentList.map((i) => [
      i.name,
      i.openingStock,
      i.purchasedQty,
      i.usedQty,
      i.wastageQty,
      i.closingStock,
      i.unit || "",
      i.costPerUnit,
      i.totalCost,
      i.alertLevel,
      i.status,
    ]);

    const encodedUri = csvDataUri(csvDocument(headers, rows));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_stock_inventory_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title="Stock Inventory & Valuation Report"
        breadcrumbs={[
          { label: "Financial Reports", href: "/reports" },
          { label: "Stock Inventory" },
        ]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#174D3C]" /> Export Active Tab CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Stock Audit
            </button>
          </div>
        }
      />

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-[#EAF3EE] text-[#174D3C] border-[#174D3C]/20"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#174D3C]" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          )}
          {msg.text}
        </div>
      )}

      {/* Critical Stock Alert Banner */}
      {alerts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 print:hidden">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>CRITICAL INVENTORY ALERT: {alerts.length} ITEMS BELOW REORDER THRESHOLD</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="p-3 bg-white rounded-lg border border-rose-200 flex items-center justify-between shadow-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{a.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    ({a.itemType})
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-700 font-mono block">
                    {a.closingStock} {a.unit}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Min: {a.alertLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Opening Stock Valuation"
          value={`₹${totalOpeningValue.toLocaleString()}`}
          icon={<Layers className="w-5 h-5 text-slate-500" />}
        />
        <StatCard
          title="Purchased Addition Value"
          value={`₹${totalPurchasedValue.toLocaleString()}`}
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Current Closing Valuation"
          value={`₹${totalClosingValue.toLocaleString()}`}
          icon={<Layers className="w-5 h-5 text-[#174D3C]" />}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 print:hidden">
        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "feed"
              ? "border-[#174D3C] text-[#174D3C]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" /> Feed & Silage ({feedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("medicine")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "medicine"
              ? "border-[#174D3C] text-[#174D3C]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Pill className="w-4 h-4" /> Medicines & Tonics ({medItems.length})
        </button>
        <button
          onClick={() => setActiveTab("vaccine")}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "vaccine"
              ? "border-[#174D3C] text-[#174D3C]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Syringe className="w-4 h-4" /> Vaccines & Biologics ({vacItems.length})
        </button>
      </div>

      {/* Inventory Table */}
      <ContentCard
        title={`${
          activeTab === "feed"
            ? "Feed & Silage Stock Ledger"
            : activeTab === "medicine"
            ? "Medicines & Veterinary Tonics"
            : "Vaccines & Biologicals"
        }`}
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4 text-center">Opening</th>
                <th className="py-3 px-4 text-center">Purchased</th>
                <th className="py-3 px-4 text-center">Used</th>
                <th className="py-3 px-4 text-center">Wastage</th>
                <th className="py-3 px-4 text-center font-bold text-slate-900">Closing Stock</th>
                <th className="py-3 px-4 text-right">Unit Rate (₹)</th>
                <th className="py-3 px-4 text-right">Total Value (₹)</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No items found in this inventory category.
                  </td>
                </tr>
              ) : (
                currentList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-mono">{item.openingStock}</td>
                    <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold font-mono">
                      +{item.purchasedQty}
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-700 font-semibold font-mono">
                      -{item.usedQty}
                    </td>
                    <td className="py-3.5 px-4 text-center text-rose-600 font-mono">
                      -{item.wastageQty}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono text-sm">
                      {item.closingStock} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 font-mono">
                      ₹{item.costPerUnit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#174D3C] font-mono">
                      ₹{Number(item.totalCost).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{item.supplier || "—"}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                          item.status === "ADEQUATE"
                            ? "bg-[#EAF3EE] text-[#174D3C]"
                            : item.status === "LOW_STOCK"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-900 text-white"
                        }`}
                      >
                        {item.status === "ADEQUATE"
                          ? "Adequate"
                          : item.status === "LOW_STOCK"
                          ? "Low Stock"
                          : "Out of Stock"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right print:hidden">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-[#174D3C] hover:bg-[#EAF3EE] rounded-lg transition-colors"
                        title="Adjust Inventory Balance"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Adjust Inventory Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Adjust Stock Consumption
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{editingItem.name}</h3>
                <div className="text-xs text-slate-500">Unit: {editingItem.unit}</div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInventory} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Used / Consumed Qty
                  </label>
                  <input
                    type="number"
                    required
                    value={usedQty}
                    onChange={(e) => setUsedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-[#174D3C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Wastage / Spoilage Qty
                  </label>
                  <input
                    type="number"
                    required
                    value={wastageQty}
                    onChange={(e) => setWastageQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-[#174D3C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    required
                    value={alertLevel}
                    onChange={(e) => setAlertLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-[#174D3C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Unit Valuation Rate (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-[#174D3C]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-1 font-mono text-[11px] text-slate-600">
                <div>
                  Formula: Opening ({editingItem.openingStock}) + Purchased ({editingItem.purchasedQty}) - Used ({usedQty}) - Wastage ({wastageQty})
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  New Closing Stock:{" "}
                  {editingItem.openingStock +
                    editingItem.purchasedQty -
                    Number(usedQty) -
                    Number(wastageQty)}{" "}
                  {editingItem.unit}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
