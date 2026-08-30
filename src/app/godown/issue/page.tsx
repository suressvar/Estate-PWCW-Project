"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Warehouse,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Sprout,
  Package,
  Layers,
  FlaskConical,
  Fuel,
  Tractor,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";
import type { GodownItem, PlotItem, PlotCropAssociation } from "@/types/estate";

export default function GodownIssuePage() {
  const router = useRouter();
  const [items, setItems] = useState<GodownItem[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [plotCrops, setPlotCrops] = useState<PlotCropAssociation[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState("");
  const [destinationMenu, setDestinationMenu] = useState("Fertilizer");
  const [issueQuantity, setIssueQuantity] = useState<number | "">("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedPlotCropId, setSelectedPlotCropId] = useState("");
  const [issuedTo, setIssuedTo] = useState("Field Supervisor");
  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    targetRoute?: string;
    targetMenu?: string;
  } | null>(null);

  // RBAC
  const [canEdit, setCanEdit] = useState(true);
  const [roleName, setRoleName] = useState("Admin");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [gdnRes, plotsRes, pcRes] = await Promise.all([
          fetch("/api/godown/items"),
          fetch("/api/plots"),
          fetch("/api/plot-crops"),
        ]);

        const gdnData = await gdnRes.json();
        const plotsData = await plotsRes.json();
        const pcData = await pcRes.json();

        const itemList = Array.isArray(gdnData.items) ? gdnData.items : [];
        setItems(itemList);
        setPlots(Array.isArray(plotsData) ? plotsData : []);
        setPlotCrops(Array.isArray(pcData) ? pcData : []);

        if (itemList.length > 0) {
          const firstInStock = itemList.find((i: GodownItem) => i.availableQuantity > 0) || itemList[0];
          setSelectedItemId(firstInStock.id);
          autoSelectMenu(firstInStock);
        }

        if (Array.isArray(plotsData) && plotsData.length > 0) {
          setSelectedPlotId(plotsData[0].id);
          const filtered = Array.isArray(pcData) ? pcData.filter((p: any) => p.plotId === plotsData[0].id) : [];
          if (filtered.length > 0) setSelectedPlotCropId(filtered[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const autoSelectMenu = (item: GodownItem) => {
    const cat = item.category.toLowerCase();
    const name = item.name.toLowerCase();
    if (cat.includes("fertilizer") || name.includes("urea") || name.includes("npk")) {
      setDestinationMenu("Fertilizer");
    } else if (cat.includes("diesel") || cat.includes("fuel") || name.includes("diesel")) {
      setDestinationMenu("Diesel");
    } else if (cat.includes("machinery") || name.includes("blade") || name.includes("spare")) {
      setDestinationMenu("Machinery");
    } else {
      setDestinationMenu("General Purchases / Plot Ops");
    }
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      autoSelectMenu(item);
      setIssueQuantity(item.availableQuantity > 0 ? Math.min(10, item.availableQuantity) : 0);
    }
  };

  useEffect(() => {
    if (!selectedPlotId) return;
    const filtered = plotCrops.filter((p) => p.plotId === selectedPlotId);
    if (filtered.length > 0) {
      setSelectedPlotCropId(filtered[0].id);
    } else {
      setSelectedPlotCropId("");
    }
  }, [selectedPlotId, plotCrops]);

  const activeItem = items.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    const qty = Number(issueQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid issue quantity.");
      return;
    }

    if (qty > activeItem.availableQuantity) {
      alert(`Requested quantity (${qty}) exceeds available Godown stock (${activeItem.availableQuantity} ${activeItem.unit}).`);
      return;
    }

    try {
      setSubmitting(true);
      const activePlot = plots.find((p) => p.id === selectedPlotId);
      const activeCrop = plotCrops.find((c) => c.id === selectedPlotCropId);

      const payload = {
        godownItemId: activeItem.id,
        destinationMenu,
        quantity: qty,
        date: issueDate,
        plotId: selectedPlotId,
        plotName: activePlot ? activePlot.name : "General Estate",
        cropActivityId: selectedPlotCropId,
        cropActivityName: activeCrop ? activeCrop.cropActivityName : "Plot Operations",
        issuedTo,
        notes: "",
      };

      const res = await fetch("/api/godown/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        const routeMap: Record<string, string> = {
          Fertilizer: "/fertilizer",
          Diesel: "/diesel",
          Machinery: "/machinery",
        };

        setFeedback({
          type: "success",
          message: `Issued ${qty} ${activeItem.unit} of "${activeItem.name}" directly to the ${destinationMenu} menu!`,
          targetRoute: routeMap[destinationMenu] || "/godown",
          targetMenu: destinationMenu,
        });

        // Update local items state
        setItems((prev) =>
          prev.map((it) => (it.id === activeItem.id ? { ...it, availableQuantity: it.availableQuantity - qty } : it))
        );
        setIssueQuantity("");
      } else {
        alert(data.error || "Failed to issue item.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/godown"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Issue Godown Items to Menus</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Dispatch
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Role:</span>
          <RoleBadge role={roleName} />
          <button
            onClick={() => {
              setCanEdit(!canEdit);
              setRoleName(canEdit ? "Field Staff" : "Admin");
            }}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded"
          >
            Toggle
          </button>
        </div>
      </div>

      {/* RBAC Notice */}
      {!canEdit && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Access Restricted: Switch to Admin role to submit stock dispatches to destination menus.</span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border shadow-xs animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-sm block">{feedback.message}</span>
              <span className="text-slate-600 text-[11px]">
                The stock balance was deducted from Godown and an operational log was instantly created in {feedback.targetMenu}.
              </span>
            </div>
          </div>
          {feedback.targetRoute && (
            <Link
              href={feedback.targetRoute}
              className="px-3.5 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg font-semibold flex items-center gap-1 shrink-0 ml-4 transition-colors shadow-2xs"
            >
              <span>Go to {feedback.targetMenu}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Main Issue Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Send className="w-4 h-4 text-emerald-700" />
            <span>Stock Dispatch Requisition</span>
          </div>
          <Link
            href="/godown"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            ← Back to Godown Inventory
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading stock records...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Step 1: Select Item */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                1. Select Item from Godown Stock *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id} disabled={it.availableQuantity <= 0}>
                    {it.name} — {it.category} ({it.availableQuantity} {it.unit} available in {it.location})
                    {it.availableQuantity <= 0 ? " [OUT OF STOCK]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Item Quick Details Box */}
            {activeItem && (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Category</span>
                  <span className="font-bold text-slate-800">{activeItem.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Available Balance</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    {activeItem.availableQuantity} {activeItem.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Storage Location</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    {activeItem.location}
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Destination Menu */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                2. Choose Destination Menu / Operational Module *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "Fertilizer",
                    name: "Fertilizer",
                    desc: "Adds log to /fertilizer",
                    icon: Sprout,
                  },
                  {
                    id: "Diesel",
                    name: "Diesel Fuel",
                    desc: "Adds log to /diesel",
                    icon: Fuel,
                  },
                  {
                    id: "Machinery",
                    name: "Machinery",
                    desc: "Adds log to /machinery",
                    icon: Tractor,
                  },
                ].map((menu) => {
                  const isSelected = destinationMenu === menu.id;
                  const Icon = menu.icon;
                  return (
                    <button
                      key={menu.id}
                      type="button"
                      onClick={() => setDestinationMenu(menu.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-emerald-800 text-white border-emerald-900 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-300" : "text-slate-600"}`} />
                        {isSelected && <span className="text-[10px] font-bold bg-emerald-700 px-1.5 py-0.5 rounded">Selected</span>}
                      </div>
                      <div className="mt-2">
                        <div className="font-bold text-xs">{menu.name}</div>
                        <div className={`text-[10px] ${isSelected ? "text-emerald-200" : "text-slate-500"}`}>
                          {menu.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Issue Quantity and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  3. Quantity to Issue ({activeItem?.unit || "units"}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.1"
                  max={activeItem?.availableQuantity || 9999}
                  value={issueQuantity}
                  onChange={(e) => setIssueQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={`Max: ${activeItem?.availableQuantity || 0}`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                />
                <span className="text-[10px] text-slate-500">
                  Stock remaining after issue:{" "}
                  <strong className="text-emerald-900">
                    {Math.max(0, (activeItem?.availableQuantity || 0) - (Number(issueQuantity) || 0))} {activeItem?.unit}
                  </strong>
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Issue Date *</label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Step 4: Plot & Crop Activity Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Target Land Plot</label>
                <select
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Crop / Activity Track</label>
                <select
                  value={selectedPlotCropId}
                  onChange={(e) => setSelectedPlotCropId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                >
                  {plotCrops
                    .filter((pc) => !selectedPlotId || pc.plotId === selectedPlotId)
                    .map((pc) => (
                      <option key={pc.id} value={pc.id}>
                        {pc.cropActivityName} ({pc.status})
                      </option>
                    ))}
                  <option value="">General Estate (Unassigned)</option>
                </select>
              </div>
            </div>

            {/* Step 5: Recipient */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Dispatched To / Recipient</label>
              <input
                type="text"
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
                placeholder="e.g. Field Staff, Tractor Driver"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                href="/godown"
                className="text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel & Return
              </Link>

              <button
                type="submit"
                disabled={submitting || !canEdit || (activeItem?.availableQuantity || 0) <= 0}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Issuing Stock..." : `Confirm Issue to ${destinationMenu}`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
