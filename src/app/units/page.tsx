"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Ruler, CheckCircle2, AlertCircle } from "lucide-react";
import type { ExpenseUnit } from "@/lib/db-storage";

export default function UnitsManagementPage() {
  const [units, setUnits] = useState<ExpenseUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitName, setUnitName] = useState("");
  const [unitSymbol, setUnitSymbol] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/units");
      const data = await res.json();
      setUnits(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) {
      setMsg({ type: "error", text: "Unit Name is required" });
      return;
    }

    try {
      setSubmitting(true);
      setMsg(null);

      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitName: unitName.trim(),
          unitSymbol: (unitSymbol.trim() || unitName.trim()),
        }),
      });

      if (res.ok) {
        setUnitName("");
        setUnitSymbol("");
        setMsg({ type: "success", text: "New unit added successfully!" });
        fetchUnits();
        setTimeout(() => setMsg(null), 3000);
      } else {
        const data = await res.json();
        setMsg({ type: "error", text: data.error || "Failed to add unit" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to add unit" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUnit = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete unit "${name}"?`)) return;

    try {
      const res = await fetch(`/api/units?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ type: "success", text: `Unit "${name}" deleted successfully.` });
        fetchUnits();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Notification */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-700" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main 2-Column Layout matching Picture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Add New Unit Form */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header with Teal/Emerald Gradient matching screenshot */}
          <div className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-5 py-4 text-white">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-white/80 flex items-center justify-center text-xs font-black">
                +
              </span>
              <span>Add New Unit</span>
            </h2>
          </div>

          {/* Form Body */}
          <form onSubmit={handleAddUnit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Unit Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kilograms, Nos, Litres"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Symbol / Abbreviation
              </label>
              <input
                type="text"
                placeholder="e.g. KG, Nos, L"
                value={unitSymbol}
                onChange={(e) => setUnitSymbol(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-full text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span className="text-sm font-black">+</span>
                <span>{submitting ? "Adding Unit..." : "Add Unit"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: All Units 2-Column Grid matching screenshot */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <div className="w-5 h-5 rounded flex items-center justify-center text-teal-700">
                <Tag className="w-4 h-4" />
              </div>
              <span>All Units ({units.length})</span>
            </div>
          </div>

          {/* Card Body Grid */}
          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                Loading units...
              </div>
            ) : units.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                No units created yet. Add your first unit from the left panel.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Badge with Symbol */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-3 py-1.5 rounded-lg bg-[#ccfbf1] text-[#0f766e] font-black text-xs shrink-0 tracking-wide">
                        {unit.unitSymbol || unit.unitName}
                      </div>

                      {/* Middle: Name and Symbol subtitle */}
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {unit.unitName}
                        </div>
                        {unit.unitSymbol && unit.unitSymbol !== unit.unitName && (
                          <div className="text-[11px] text-slate-500 truncate">
                            {unit.unitSymbol}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Circular Red Delete Button */}
                    <button
                      onClick={() => handleDeleteUnit(unit.id, unit.unitName)}
                      className="w-7 h-7 rounded-full border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 flex items-center justify-center transition-colors shrink-0"
                      title="Delete Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
