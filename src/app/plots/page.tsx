"use client";

import { PlotsCropsNav } from "@/components/plots-crops-nav";
import { writeRequest as writePlot } from "@/lib/http-client";
import type { CropItem, PlotCropAssociation, PlotItem } from "@/types/estate";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import {
  Check,
  CheckCircle,
  Edit2,
    Plus,
  Search,
  ShieldAlert,
  Sprout,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export default function PlotsPage() {
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const canEdit = true;

  // Plot Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [areaAcres, setAreaAcres] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);

  // Quick Multi-Crop Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignPlotId, setAssignPlotId] = useState<string>("");
  const [selectedCropIds, setSelectedCropIds] = useState<string[]>([]);
  const [assignStartDate, setAssignStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [cropSearch, setCropSearch] = useState("");

  const fetchData = async () => {
    setLoadError("");
    try {
      const [plotsRes, assocRes, cropsRes] = await Promise.all([
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
        fetch("/api/crops"),
      ]);
      if (![plotsRes, assocRes, cropsRes].every((response) => response.ok))
        throw new Error("Unable to load plot records. Please retry.");
      const [plotsData, assocData, cropsData] = await Promise.all([
        plotsRes.json(),
        assocRes.json(),
        cropsRes.json(),
      ]);
      if (![plotsData, assocData, cropsData].every(Array.isArray))
        throw new Error("Unable to load plot records. Please retry.");
      setPlots(plotsData);
      setAssociations(assocData);
      setCrops(cropsData);
    } catch {
      setLoadError("Unable to load plot records. Please retry.");
    }
  };

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchData();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setLocation("");
    setAreaAcres("");
    setStatus("ACTIVE");
    setSaveError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (plot: PlotItem) => {
    setEditingId(plot.id);
    setName(plot.name);
    setLocation(plot.location || "");
    setAreaAcres(plot.areaAcres ? plot.areaAcres.toString() : "");
    setStatus(plot.status);
    setSaveError("");
    setIsFormOpen(true);
  };

  const handleOpenAssign = (plotId: string) => {
    setAssignPlotId(plotId);
    const activeCropIds = associations
      .filter((a) => a.plotId === plotId && a.status === "ACTIVE")
      .map((a) => a.cropActivityId);
    setSelectedCropIds(activeCropIds);
    setCropSearch("");
    setAssignStartDate(new Date().toISOString().split("T")[0]);
    setIsAssignModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    setSaveError("");
    try {
      if (editingId) {
        await writePlot("/api/plots", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name,
            location,
            areaAcres: Number(areaAcres),
            status,
          }),
        });
      } else {
        await writePlot("/api/plots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            location,
            areaAcres: Number(areaAcres),
            status,
          }),
        });
      }
      setIsFormOpen(false);
      await fetchData();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save changes. Please try again."
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving.current) return;
    if (selectedCropIds.length === 0) {
      alert("Please select at least one crop/activity to assign.");
      return;
    }
    saving.current = true;
    setIsSaving(true);
    setSaveError("");
    try {
      await writePlot("/api/plot-crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId: assignPlotId,
          cropActivityIds: selectedCropIds,
          cropActivityId: selectedCropIds[0],
          startDate: assignStartDate,
        }),
      });
      setIsAssignModalOpen(false);
      await fetchData();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to assign crops. Please try again."
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this plot?")) {
      if (saving.current) return;
      saving.current = true;
      setIsSaving(true);
      setSaveError("");
      try {
        await writePlot(`/api/plots?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        await fetchData();
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Unable to delete plot. Please try again."
        );
      } finally {
        saving.current = false;
        setIsSaving(false);
      }
    }
  };

  const targetAssignPlot = plots.find((p) => p.id === assignPlotId);

  return (
    <PageContainer>
      {/* Unified Module Nav Tabs */}
      <PlotsCropsNav
        stats={{
          plotsCount: plots.length,
          cropsCount: crops.length,
          associationsCount: associations.length,
        }}
      />

      {loadError && (
        <div role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
          {loadError}{" "}
          <button
            type="button"
            onClick={() => void fetchData()}
            className="underline font-semibold"
          >
            Retry loading
          </button>
        </div>
      )}
      {saveError && !isFormOpen && !isAssignModalOpen && (
        <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
          {saveError}
        </p>
      )}

      {/* Standardized Header */}
      <PageHeader
        title="Plot Master Data Management"
        breadcrumbs={[
          { label: "Plots & Crops", href: "/plot-crops" },
          { label: "Plots Master" },
        ]}
        actions={
          canEdit && (
            <button
              id="add-plot-btn"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Plot</span>
            </button>
          )
        }
      />

      {/* Permissions Banner if Field Staff */}
      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Read-Only View Enabled for <strong>Field Staff</strong> role. Edit controls are restricted.
            </span>
          </div>
        </div>
      )}

      {/* Plot Data Table Card */}
      <ContentCard
        title={`Registered Land Plots (${plots.length})`}
      >
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Plot Identifier</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Area (Acres)</th>
                <th className="px-4 py-3">Active Crops / Activities</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered Date</th>
                {canEdit && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plots.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-5 py-10 text-center text-slate-400">
                    No plots registered yet. Click &ldquo;Create New Plot&rdquo; to begin.
                  </td>
                </tr>
              ) : (
                plots.map((plot) => {
                  const plotActiveCrops = associations.filter(
                    (a) => a.plotId === plot.id && a.status === "ACTIVE"
                  );

                  return (
                    <tr key={plot.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{plot.name}</td>
                      <td className="px-4 py-3.5 text-slate-600">{plot.location || "—"}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {plot.areaAcres} Acres
                      </td>
                      <td className="px-4 py-3.5">
                        {plotActiveCrops.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {plotActiveCrops.map((pc) => (
                              <span
                                key={pc.id}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#EAF3EE] text-[#16805D] px-2 py-0.5 rounded"
                              >
                                <Sprout className="w-3 h-3 text-[#16805D]" />
                                {pc.cropActivityName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No crops active</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {plot.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16805D] bg-[#EAF3EE] px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3 text-[#16805D]" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{plot.createdAt}</td>
                      {canEdit && (
                        <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenAssign(plot.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#16805D] bg-[#EAF3EE] hover:bg-[#d8ece0] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Assign Crops to Plot"
                          >
                            <Sprout className="w-3 h-3 text-[#16805D]" />
                            <span>Assign Crops</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(plot)}
                            className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit Plot"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(plot.id)}
                            className="p-1 text-slate-400 hover:text-[#DC3545] hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Plot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Modal / Create/Edit Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <fieldset disabled={isSaving} className="contents">
              {saveError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded border border-rose-200">{saveError}</p>}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId ? "Edit Plot Master Record" : "Create New Plot Master Record"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Plot Identifier / Name</label>
                  <input
                    id="plot-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Plot E - East Orchard"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Location / Sector</label>
                  <input
                    id="plot-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. North East Block"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Area (Acres)</label>
                  <input
                    id="plot-area-input"
                    type="number"
                    step="0.1"
                    required
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    placeholder="e.g. 10.5"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-plot-btn"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      )}

      {/* Multi-Crop Quick Assign Modal Overlay */}
      {isAssignModalOpen && targetAssignPlot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 my-8 animate-in zoom-in-95 duration-150"
          >
            <fieldset disabled={isSaving} className="contents">
              {saveError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded border border-rose-200">{saveError}</p>}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Assign Crops to {targetAssignPlot.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Search Crops / Activities</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search crops..."
                      value={cropSearch}
                      onChange={(e) => setCropSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Select Crops ({selectedCropIds.length} chosen)
                  </label>
                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    {crops
                      .filter((c) => c.name.toLowerCase().includes(cropSearch.toLowerCase()))
                      .map((crop) => {
                        const isSelected = selectedCropIds.includes(crop.id);
                        return (
                          <div
                            key={crop.id}
                            onClick={() => {
                              setSelectedCropIds((prev) =>
                                prev.includes(crop.id)
                                  ? prev.filter((id) => id !== crop.id)
                                  : [...prev, crop.id]
                              );
                            }}
                            className={`p-2 rounded-md border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? "bg-[#EAF3EE] border-[#16805D]/40 text-[#174D3C] font-semibold"
                                : "bg-white border-slate-200/80 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                                  isSelected
                                    ? "bg-[#174D3C] border-[#174D3C] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span>{crop.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {crop.type}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || selectedCropIds.length === 0}
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Save Assigned Crops
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      )}
    </PageContainer>
  );
}
