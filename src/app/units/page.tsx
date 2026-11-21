"use client";
import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import type { ExpenseUnit } from "@/lib/db-storage";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

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
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchUnits();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
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
          unitSymbol: unitSymbol.trim() || unitName.trim(),
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
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) || "Failed to add unit" });
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
    <PageContainer>
      <PageHeader
        title="Units of Measurement"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Units of Measurement" },
        ]}
      />

      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-[#EAF3EE] text-[#174D3C] border border-[#C5DEC8]"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#174D3C]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-700" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Add New Unit */}
        <div className="lg:col-span-4">
          <ContentCard title="Add Unit" badge="New">
            <form onSubmit={handleAddUnit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">
                  Unit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kilograms, Nos, Litres"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#111827]">
                  Symbol / Abbreviation
                </label>
                <input
                  type="text"
                  placeholder="e.g. KG, Nos, L"
                  value={unitSymbol}
                  onChange={(e) => setUnitSymbol(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#111827] focus:ring-1 focus:ring-[#174D3C] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>+</span>
                <span>{submitting ? "Adding Unit..." : "Add Unit"}</span>
              </button>
            </form>
          </ContentCard>
        </div>

        {/* RIGHT COLUMN: Units Grid */}
        <div className="lg:col-span-8">
          <ContentCard title="All Units" badge={`${units.length} defined`}>
            {loading ? (
              <div className="p-8 text-center text-xs text-[#64748B]">Loading units...</div>
            ) : units.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No units created yet. Add your first unit from the left panel.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#C5DEC8] hover:bg-[#F8FAFC] transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="px-2.5 py-1 rounded-md bg-[#EAF3EE] text-[#174D3C] font-bold text-xs shrink-0 font-mono">
                        {unit.unitSymbol || unit.unitName}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-[#111827] truncate">
                          {unit.unitName}
                        </div>
                        {unit.unitSymbol && unit.unitSymbol !== unit.unitName && (
                          <div className="text-[11px] text-[#64748B] truncate">
                            {unit.unitSymbol}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteUnit(unit.id, unit.unitName)}
                      className="p-1 rounded-md text-[#94A3B8] hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                      title="Delete Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ContentCard>
        </div>
      </div>
    </PageContainer>
  );
}
