"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Pill,
  Syringe,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Edit2,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { StockInventoryItem, InventoryType } from "@/lib/inventory-data";

export default function StockInventoryReportPage() {
  const [activeTab, setActiveTab] = useState<InventoryType>("feed");
  const [feedItems, setFeedItems] = useState<StockInventoryItem[]>([]);
  const [medItems, setMedItems] = useState<StockInventoryItem[]>([]);
  const [vacItems, setVacItems] = useState<StockInventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchInventory();
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
      const res = await fetch(`/api/inventory/${editingItem.itemType}/${editingItem.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usedQty: Number(usedQty),
          wastageQty: Number(wastageQty),
          alertLevel: Number(alertLevel),
          costPerUnit: Number(costPerUnit),
        }),
      });

      if (res.ok) {
        setMsg({ type: "success", text: `Stock balance updated for "${editingItem.name}"!` });
        setEditingItem(null);
        fetchInventory();
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const currentList = activeTab === "feed" ? feedItems : activeTab === "medicine" ? medItems : vacItems;

  const totalOpeningValue = currentList.reduce((acc, i) => acc + i.openingStock * i.costPerUnit, 0);
  const totalPurchasedValue = currentList.reduce((acc, i) => acc + i.purchasedQty * i.costPerUnit, 0);
  const totalClosingValue = currentList.reduce((acc, i) => acc + i.totalCost, 0);

  const exportCSV = () => {
    if (currentList.length === 0) return;
    const headers = ["ItemName", "OpeningStock", "PurchasedQty", "UsedQty", "WastageQty", "ClosingStock", "Unit", "CostPerUnit", "TotalValue", "AlertLevel", "Status"];
    const rows = currentList.map((i) => [
      i.name,
      String(i.openingStock),
      String(i.purchasedQty),
      String(i.usedQty),
      String(i.wastageQty),
      String(i.closingStock),
      i.unit || "",
      String(i.costPerUnit),
      String(i.totalCost),
      String(i.alertLevel),
      i.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_stock_inventory_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs">
              <Layers className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Stock Inventory & Valuation Report</h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Real-time feed, medicine, and vaccine stocks with automated depletion and threshold alert monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Export Active Tab CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" /> Print Stock Audit
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Critical Stock Alert Banner */}
      {alerts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 print:hidden">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>CRITICAL INVENTORY ALERT: {alerts.length} ITEMS BELOW REORDER THRESHOLD</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {alerts.map((a) => (
              <div key={a.id} className="p-2 bg-white rounded-lg border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{a.name}</span>
                  <span className="text-[10px] text-slate-500 block uppercase">({a.itemType})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-700">{a.closingStock} {a.unit}</span>
                  <span className="text-[10px] text-slate-400 block">Min: {a.alertLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-3 print:hidden">
        <button
          onClick={() => setActiveTab("feed")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "feed" ? "border-emerald-800 text-emerald-900 bg-slate-50 rounded-t-lg" : "border-transparent text-slate-600 hover:text-slate-900"}`}
        >
          <Layers className="w-4 h-4" /> Feed & Silage ({feedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("medicine")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "medicine" ? "border-emerald-800 text-emerald-900 bg-slate-50 rounded-t-lg" : "border-transparent text-slate-600 hover:text-slate-900"}`}
        >
          <Pill className="w-4 h-4" /> Medicines & Tonics ({medItems.length})
        </button>
        <button
          onClick={() => setActiveTab("vaccine")}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "vaccine" ? "border-emerald-800 text-emerald-900 bg-slate-50 rounded-t-lg" : "border-transparent text-slate-600 hover:text-slate-900"}`}
        >
          <Syringe className="w-4 h-4" /> Vaccines & Biologics ({vacItems.length})
        </button>
      </div>

      {/* Stock Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Opening Stock Valuation</span>
          <div className="text-lg font-bold text-slate-800 mt-0.5">₹{totalOpeningValue.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Purchased Addition Value</span>
          <div className="text-lg font-bold text-slate-800 mt-0.5">₹{totalPurchasedValue.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Closing Valuation</span>
          <div className="text-lg font-extrabold text-emerald-900 mt-0.5">₹{totalClosingValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Item Name</th>
                <th className="p-3.5 text-center">Opening</th>
                <th className="p-3.5 text-center">Purchased</th>
                <th className="p-3.5 text-center">Used</th>
                <th className="p-3.5 text-center">Wastage</th>
                <th className="p-3.5 text-center font-bold text-slate-900">Closing Stock</th>
                <th className="p-3.5">Unit Rate (₹)</th>
                <th className="p-3.5">Total Value (₹)</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                  <td className="p-3.5 text-center text-slate-600 font-mono">{item.openingStock}</td>
                  <td className="p-3.5 text-center text-emerald-800 font-bold font-mono">+{item.purchasedQty}</td>
                  <td className="p-3.5 text-center text-amber-700 font-semibold font-mono">-{item.usedQty}</td>
                  <td className="p-3.5 text-center text-rose-700 font-mono">-{item.wastageQty}</td>
                  <td className="p-3.5 text-center font-extrabold text-slate-900 font-mono text-sm">
                    {item.closingStock} {item.unit}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700">₹{item.costPerUnit}</td>
                  <td className="p-3.5 font-bold text-emerald-900">₹{Number(item.totalCost).toLocaleString()}</td>
                  <td className="p-3.5 text-slate-500 max-w-xs truncate">{item.supplier || "-"}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        item.status === "ADEQUATE"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : item.status === "LOW_STOCK"
                          ? "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
                          : "bg-slate-900 text-white border-slate-900"
                      }`}
                    >
                      {item.status === "ADEQUATE" ? "Adequate" : item.status === "LOW_STOCK" ? "Low Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="p-3.5 text-right print:hidden">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Adjust Inventory Balance"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Adjust Stock Consumption</span>
                <h3 className="font-bold text-slate-900 text-sm">{editingItem.name}</h3>
                <div className="text-xs text-slate-500">Unit: {editingItem.unit}</div>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveInventory} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Used / Consumed Qty</label>
                  <input
                    type="number"
                    required
                    value={usedQty}
                    onChange={(e) => setUsedQty(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Wastage / Spoilage Qty</label>
                  <input
                    type="number"
                    required
                    value={wastageQty}
                    onChange={(e) => setWastageQty(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Reorder Alert Level</label>
                  <input
                    type="number"
                    required
                    value={alertLevel}
                    onChange={(e) => setAlertLevel(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Unit Valuation Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono text-[11px] text-slate-600">
                <div>Formula: Opening ({editingItem.openingStock}) + Purchased ({editingItem.purchasedQty}) - Used ({usedQty}) - Wastage ({wastageQty})</div>
                <div className="font-bold text-slate-900 text-xs">
                  New Closing Stock: {editingItem.openingStock + editingItem.purchasedQty - Number(usedQty) - Number(wastageQty)} {editingItem.unit}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
