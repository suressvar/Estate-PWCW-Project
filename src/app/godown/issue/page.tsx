"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Fuel,
  MapPin,
  Send,
  ShieldAlert,
  Sprout,
  Tractor,
} from "lucide-react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { RoleBadge } from "@/components/ui/role-badge";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import type { GodownItem, PlotCropAssociation, PlotItem } from "@/types/estate";

export default function GodownIssuePage() {
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
  const [issuedTo] = useState("Field Supervisor");
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
          const filtered = Array.isArray(pcData) ? pcData.filter((p: PlotCropAssociation) => p.plotId === plotsData[0].id) : [];
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

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      autoSelectMenu(item);
      setIssueQuantity(item.availableQuantity > 0 ? Math.min(10, item.availableQuantity) : 0);
    }
  };

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        if (!selectedPlotId) return;
        const filtered = plotCrops.filter((p) => p.plotId === selectedPlotId);
        if (filtered.length > 0) {
          setSelectedPlotCropId(filtered[0].id);
        } else {
          setSelectedPlotCropId("");
        }
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
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
    } catch (err) {
      alert(getErrorMessage(err) || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Stock Dispatch Requisition"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Godown Inventory", href: "/godown" },
          { label: "Issue to Menus" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
              <span className="text-xs text-[#64748B] font-medium">Role:</span>
              <RoleBadge role={roleName} />
              <button
                onClick={() => {
                  setCanEdit(!canEdit);
                  setRoleName(canEdit ? "Field Staff" : "Admin");
                }}
                className="text-[11px] font-semibold text-[#64748B] hover:text-[#111827] bg-[#F1F5F9] hover:bg-[#E2E8F0] px-2 py-0.5 rounded"
              >
                Toggle
              </button>
            </div>
            <Link
              href="/godown"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#111827] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Back to Godown</span>
            </Link>
          </div>
        }
      />

      {/* RBAC Notice */}
      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Access Restricted: Switch to Admin role to submit stock dispatches to destination menus.</span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border shadow-2xs ${
            feedback.type === "success"
              ? "bg-[#EAF3EE] border-[#C5DEC8] text-[#174D3C]"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#174D3C] shrink-0" />
            <div>
              <span className="font-semibold text-xs block text-[#111827]">{feedback.message}</span>
              <span className="text-[#64748B] text-[11px]">
                The stock balance was deducted from Godown and an operational log was recorded in {feedback.targetMenu}.
              </span>
            </div>
          </div>
          {feedback.targetRoute && (
            <Link
              href={feedback.targetRoute}
              className="px-2.5 py-1 bg-[#174D3C] text-white hover:bg-[#103C30] rounded-md font-medium text-[11px] flex items-center gap-1 shrink-0 ml-4 transition-colors"
            >
              <span>Go to {feedback.targetMenu}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      <div className="max-w-3xl">
        <ContentCard
          title="Stock Dispatch Requisition"
          badge="Live Transfer"
        >
          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748B]">Loading stock records...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Select Item */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">
                  1. Select Item from Godown Stock *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
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
                <div className="p-3 bg-[#EAF3EE] rounded-lg border border-[#C5DEC8] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-medium">Category</span>
                    <span className="font-semibold text-[#111827]">{activeItem.category}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-medium">Available Balance</span>
                    <span className="font-semibold text-[#174D3C] text-xs font-mono">
                      {activeItem.availableQuantity} {activeItem.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-medium">Location</span>
                    <span className="font-medium text-[#475569] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#174D3C]" />
                      {activeItem.location}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 2: Destination Menu */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827]">
                  2. Destination Menu / Operational Module *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                        className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#174D3C] text-white border-[#174D3C] shadow-2xs"
                            : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[#64748B]"}`} />
                          {isSelected && <span className="text-[10px] font-medium bg-[#103C30] px-1.5 py-0.2 rounded">Selected</span>}
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-xs">{menu.name}</div>
                          <div className={`text-[10px] ${isSelected ? "text-emerald-100" : "text-[#64748B]"}`}>
                            {menu.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Issue Quantity and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">
                    3. Quantity ({activeItem?.unit || "units"}) *
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
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                  />
                  <span className="text-[10px] text-[#64748B]">
                    Remaining:{" "}
                    <strong className="text-[#174D3C]">
                      {Math.max(0, (activeItem?.availableQuantity || 0) - (Number(issueQuantity) || 0))} {activeItem?.unit}
                    </strong>
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111827]">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                  />
                </div>
              </div>

              {/* Step 4: Target Land Plot */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">Destination Plot *</label>
                <select
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                <Link
                  href="/godown"
                  className="text-xs font-medium text-[#64748B] hover:text-[#111827]"
                >
                  Cancel & Return
                </Link>

                <button
                  type="submit"
                  disabled={submitting || !canEdit || (activeItem?.availableQuantity || 0) <= 0}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#174D3C] hover:bg-[#103C30] rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Issuing Stock..." : `Confirm Issue to ${destinationMenu}`}</span>
                </button>
              </div>
            </form>
          )}
        </ContentCard>
      </div>
    </PageContainer>
  );
}
