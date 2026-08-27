"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PlotCropAssociation, PlotItem, CropItem } from "@/lib/master-data";
import { RoleBadge } from "@/components/ui/role-badge";
import { PlotsCropsNav } from "@/components/plots-crops-nav";
import {
  Link2,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  Search,
  Layers,
  LayoutGrid,
  List,
  MapPin,
  Sprout,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

export default function PlotCropsPage() {
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [roleName, setRoleName] = useState<string>("Admin");

  // View state
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedCropIds, setSelectedCropIds] = useState<string[]>([]);
  const [cropSearchTerm, setCropSearchTerm] = useState("");
  const [cropTypeFilter, setCropTypeFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    const [assocRes, plotsRes, cropsRes] = await Promise.all([
      fetch("/api/plot-crops"),
      fetch("/api/plots"),
      fetch("/api/crops"),
    ]);

    const [assocData, plotsData, cropsData] = await Promise.all([
      assocRes.json(),
      plotsRes.json(),
      cropsRes.json(),
    ]);

    setAssociations(assocData);
    setPlots(plotsData);
    setCrops(cropsData);

    if (plotsData.length > 0 && !selectedPlotId) setSelectedPlotId(plotsData[0].id);
    if (cropsData.length > 0 && selectedCropIds.length === 0) setSelectedCropIds([cropsData[0].id]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleRole = () => {
    if (canEdit) {
      setCanEdit(false);
      setRoleName("Field Staff");
    } else {
      setCanEdit(true);
      setRoleName("Admin");
    }
  };

  const handleOpenCreate = (targetPlotId?: string) => {
    const plotIdToSet = targetPlotId || (plots.length > 0 ? plots[0].id : "");
    setSelectedPlotId(plotIdToSet);
    
    // Default to first crop if available
    if (crops.length > 0) {
      setSelectedCropIds([crops[0].id]);
    } else {
      setSelectedCropIds([]);
    }
    setCropSearchTerm("");
    setCropTypeFilter("ALL");
    setStartDate(new Date().toISOString().split("T")[0]);
    setIsFormOpen(true);
  };

  // Find currently active crop IDs for the selected plot
  const currentlyActiveCropIdsForPlot = useMemo(() => {
    return associations
      .filter((a) => a.plotId === selectedPlotId && a.status === "ACTIVE")
      .map((a) => a.cropActivityId);
  }, [associations, selectedPlotId]);

  const toggleCropSelection = (cropId: string) => {
    setSelectedCropIds((prev) =>
      prev.includes(cropId) ? prev.filter((id) => id !== cropId) : [...prev, cropId]
    );
  };

  const handleSelectAllCrops = () => {
    const filteredIds = filteredCropsInModal.map((c) => c.id);
    setSelectedCropIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAllCrops = () => {
    const filteredIds = new Set(filteredCropsInModal.map((c) => c.id));
    setSelectedCropIds((prev) => prev.filter((id) => !filteredIds.has(id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCropIds.length === 0) {
      alert("Please select at least one crop or activity to assign.");
      return;
    }

    await fetch("/api/plot-crops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plotId: selectedPlotId,
        cropActivityIds: selectedCropIds,
        cropActivityId: selectedCropIds[0], // Backwards-compatible
        startDate,
      }),
    });
    setIsFormOpen(false);
    fetchData();
  };

  const handleStatusToggle = async (id: string, currentStatus: "ACTIVE" | "COMPLETED") => {
    const nextStatus = currentStatus === "ACTIVE" ? "COMPLETED" : "ACTIVE";
    await fetch("/api/plot-crops", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this plot-crop tracking association?")) {
      await fetch(`/api/plot-crops?id=${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  // Filtered Associations for main view
  const filteredAssociations = useMemo(() => {
    return associations.filter((assoc) => {
      const matchesSearch =
        assoc.plotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assoc.cropActivityName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || assoc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [associations, searchTerm, statusFilter]);

  // Available categories from loaded crops
  const availableCategories = useMemo(() => {
    return Array.from(new Set(crops.map((c) => c.type).filter(Boolean)));
  }, [crops]);

  // Modal crop search & filter
  const filteredCropsInModal = useMemo(() => {
    return crops.filter((crop) => {
      const matchesSearch = crop.name
        .toLowerCase()
        .includes(cropSearchTerm.toLowerCase());
      const matchesType =
        cropTypeFilter === "ALL" || crop.type.toUpperCase() === cropTypeFilter.toUpperCase();
      return matchesSearch && matchesType;
    });
  }, [crops, cropSearchTerm, cropTypeFilter]);

  // Selected plot object for info display
  const currentSelectedPlot = plots.find((p) => p.id === selectedPlotId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Unified Module Nav Tabs */}
      <PlotsCropsNav
        stats={{
          plotsCount: plots.length,
          cropsCount: crops.length,
          associationsCount: associations.length,
        }}
      />

      {/* Header & RBAC Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-lg border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Plot-Crop Active Tracking Associations</h1>
          </div>
        </div>

        {/* Dynamic Role Simulation Toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-md border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Simulated Role:</span>
            <RoleBadge role={roleName} />
          </div>
          <button
            onClick={handleToggleRole}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            Toggle RBAC
          </button>
        </div>
      </div>

      {/* Permissions Banner if Field Staff */}
      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Read-Only View Enabled for <strong>Field Staff</strong> role. Edit controls are restricted.</span>
          </div>
        </div>
      )}

      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search plot or crop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
            {(["ALL", "ACTIVE", "COMPLETED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-colors ${
                  statusFilter === st
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "All Status" : st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grouped Cards by Plot"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Detailed Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {canEdit && (
            <button
              id="add-plot-crop-btn"
              onClick={() => handleOpenCreate()}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Assign Crop(s) to Plot
            </button>
          )}
        </div>
      </div>

      {/* Main View: Grouped Plot Cards or Table */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((plot) => {
            const plotAssocs = associations.filter((a) => a.plotId === plot.id);
            const activeAssocs = plotAssocs.filter((a) => a.status === "ACTIVE");
            const completedAssocs = plotAssocs.filter((a) => a.status === "COMPLETED");

            return (
              <div
                key={plot.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                        <h3 className="font-bold text-sm text-slate-900">{plot.name}</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {plot.location || "General Area"} • {plot.areaAcres} Acres
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        plot.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {plot.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Assigned Crops & Activities ({plotAssocs.length})</span>
                    <span className="text-emerald-700">{activeAssocs.length} Active</span>
                  </div>

                  {plotAssocs.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                      No crops currently assigned
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {plotAssocs.map((assoc) => (
                        <div
                          key={assoc.id}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors ${
                            assoc.status === "ACTIVE"
                              ? "bg-emerald-50/50 border-emerald-200/80 text-slate-800"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 font-semibold truncate">
                              <Sprout
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  assoc.status === "ACTIVE"
                                    ? "text-emerald-600"
                                    : "text-slate-400"
                                }`}
                              />
                              <span className="truncate">{assoc.cropActivityName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Started: {assoc.startDate}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {assoc.status === "ACTIVE" ? (
                              <button
                                disabled={!canEdit}
                                onClick={() => handleStatusToggle(assoc.id, assoc.status)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                title="Click to complete"
                              >
                                Active
                              </button>
                            ) : (
                              <button
                                disabled={!canEdit}
                                onClick={() => handleStatusToggle(assoc.id, assoc.status)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 hover:bg-slate-300"
                                title="Click to reactivate"
                              >
                                Completed
                              </button>
                            )}

                            {canEdit && (
                              <button
                                onClick={() => handleDelete(assoc.id)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remove association"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                  {canEdit && (
                    <button
                      onClick={() => handleOpenCreate(plot.id)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Assign Crops
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Associations Data Table */
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">Target Land Plot</th>
                <th className="p-3">Mapped Crop / Activity</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">Status</th>
                {canEdit && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white">
              {filteredAssociations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                    No plot-crop associations found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAssociations.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{assoc.plotName}</td>
                    <td className="p-3 font-semibold text-emerald-800 flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {assoc.cropActivityName}
                    </td>
                    <td className="p-3 text-slate-500">{assoc.startDate}</td>
                    <td className="p-3">
                      {assoc.status === "ACTIVE" ? (
                        <button
                          disabled={!canEdit}
                          onClick={() => handleStatusToggle(assoc.id, assoc.status)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-200 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-700" />
                          Active Tracking
                        </button>
                      ) : (
                        <button
                          disabled={!canEdit}
                          onClick={() => handleStatusToggle(assoc.id, assoc.status)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-200 transition-colors"
                        >
                          <Clock className="w-3 h-3 text-slate-500" />
                          Completed
                        </button>
                      )}
                    </td>
                    {canEdit && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDelete(assoc.id)}
                          className="p-1 text-slate-600 hover:text-red-700 transition-colors inline-block"
                          title="Delete Association"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal / Multi-Crop Assignment Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Crop(s) to Plot
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Plot Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Target Land Plot</span>
                  {currentSelectedPlot && (
                    <span className="text-[11px] text-emerald-700 font-normal">
                      {currentSelectedPlot.areaAcres} Acres • {currentSelectedPlot.location || "General"}
                    </span>
                  )}
                </label>
                <select
                  id="assoc-plot-select"
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  {plots.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.name} ({plot.areaAcres} Acres)
                    </option>
                  ))}
                </select>
              </div>

              {/* Hidden/Standard Select for E2E Test Compatibility */}
              <select
                id="assoc-crop-select"
                value={selectedCropIds[0] || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedCropIds([e.target.value]);
                  }
                }}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
              >
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name} [{crop.type}]
                  </option>
                ))}
              </select>

              {/* Multi-Crop Picker Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    Select Crops & Activities ({selectedCropIds.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCrops}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllCrops}
                      className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar for Crops */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter crops / activities..."
                      value={cropSearchTerm}
                      onChange={(e) => setCropSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[11px] max-w-[200px] overflow-x-auto">
                    <select
                      value={cropTypeFilter}
                      onChange={(e) => setCropTypeFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 px-1 py-0.5 focus:outline-none"
                    >
                      <option value="ALL">All Categories</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Crop Checkbox Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {filteredCropsInModal.length === 0 ? (
                    <div className="col-span-2 py-4 text-center text-slate-400 text-xs italic">
                      No matching crops or activities found.
                    </div>
                  ) : (
                    filteredCropsInModal.map((crop) => {
                      const isSelected = selectedCropIds.includes(crop.id);
                      const isAlreadyActive = currentlyActiveCropIdsForPlot.includes(crop.id);

                      return (
                        <div
                          key={crop.id}
                          data-testid={`crop-checkbox-${crop.name}`}
                          onClick={() => toggleCropSelection(crop.id)}
                          className={`p-2 rounded-md border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? "bg-emerald-700 border-emerald-700 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="truncate">
                              <span className="truncate block text-xs">{crop.name}</span>
                              <span className="text-[10px] font-normal text-slate-400">
                                {crop.type}
                              </span>
                            </div>
                          </div>

                          {isAlreadyActive && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tracking Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
              <div className="text-[11px] text-slate-500">
                {selectedCropIds.length} item(s) will be assigned
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-assoc-btn"
                  type="submit"
                  disabled={selectedCropIds.length === 0}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Assign {selectedCropIds.length > 1 ? `${selectedCropIds.length} Crops` : "Crop"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

