"use client";

import React, { useState, useEffect } from "react";
import { PlotItem, PlotCropAssociation, CropItem } from "@/lib/master-data";
import { RoleBadge } from "@/components/ui/role-badge";
import { PlotsCropsNav } from "@/components/plots-crops-nav";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ShieldAlert,
  SlidersHorizontal,
  Sprout,
  Check,
  X,
  Search,
} from "lucide-react";

export default function PlotsPage() {
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [roleName, setRoleName] = useState<string>("Admin");

  // Plot Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [areaAcres, setAreaAcres] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Quick Multi-Crop Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignPlotId, setAssignPlotId] = useState<string>("");
  const [selectedCropIds, setSelectedCropIds] = useState<string[]>([]);
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [cropSearch, setCropSearch] = useState("");

  const fetchData = async () => {
    const [plotsRes, assocRes, cropsRes] = await Promise.all([
      fetch("/api/plots"),
      fetch("/api/plot-crops"),
      fetch("/api/crops"),
    ]);
    const [plotsData, assocData, cropsData] = await Promise.all([
      plotsRes.json(),
      assocRes.json(),
      cropsRes.json(),
    ]);
    setPlots(plotsData);
    setAssociations(assocData);
    setCrops(cropsData);
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

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setLocation("");
    setAreaAcres("");
    setStatus("ACTIVE");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (plot: PlotItem) => {
    setEditingId(plot.id);
    setName(plot.name);
    setLocation(plot.location);
    setAreaAcres(String(plot.areaAcres));
    setStatus(plot.status);
    setIsFormOpen(true);
  };

  const handleOpenAssign = (plotId: string) => {
    setAssignPlotId(plotId);
    const existingActive = associations
      .filter((a) => a.plotId === plotId && a.status === "ACTIVE")
      .map((a) => a.cropActivityId);
    setSelectedCropIds(existingActive.length > 0 ? existingActive : (crops.length > 0 ? [crops[0].id] : []));
    setAssignStartDate(new Date().toISOString().split("T")[0]);
    setCropSearch("");
    setIsAssignModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch("/api/plots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, location, areaAcres: Number(areaAcres), status }),
      });
    } else {
      await fetch("/api/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, areaAcres: Number(areaAcres), status }),
      });
    }
    setIsFormOpen(false);
    fetchData();
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCropIds.length === 0) {
      alert("Please select at least one crop/activity to assign.");
      return;
    }
    await fetch("/api/plot-crops", {
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
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this plot?")) {
      await fetch(`/api/plots?id=${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const targetAssignPlot = plots.find((p) => p.id === assignPlotId);

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
            <MapPin className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Plot Master Data Management</h1>
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

      {/* Action Bar & Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-900">Registered Land Plots ({plots.length})</h2>
        {canEdit && (
          <button
            id="add-plot-btn"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create New Plot
          </button>
        )}
      </div>

      {/* Modal / Create/Edit Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? "Edit Plot Master Record" : "Create New Plot Master Record"}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Plot Identifier / Name</label>
                <input
                  id="plot-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Plot E - East Orchard"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Location / Sector</label>
                <input
                  id="plot-location-input"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. North East Block"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Area (Acres)</label>
                <input
                  id="plot-area-input"
                  type="number"
                  step="0.1"
                  required
                  value={areaAcres}
                  onChange={(e) => setAreaAcres(e.target.value)}
                  placeholder="e.g. 10.5"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-plot-btn"
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Multi-Crop Quick Assign Modal Overlay */}
      {isAssignModalOpen && targetAssignPlot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Crops to {targetAssignPlot.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Search Crops / Activities</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search crops..."
                    value={cropSearch}
                    onChange={(e) => setCropSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Select Crops ({selectedCropIds.length} chosen)
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
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
                              ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                isSelected
                                  ? "bg-emerald-700 border-emerald-700 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
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
                <label className="font-semibold text-slate-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={assignStartDate}
                  onChange={(e) => setAssignStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedCropIds.length === 0}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
              >
                Save Assigned Crops
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plot Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Plot Identifier</th>
              <th className="p-3">Location</th>
              <th className="p-3">Area (Acres)</th>
              <th className="p-3">Active Crops / Activities</th>
              <th className="p-3">Status</th>
              <th className="p-3">Registered Date</th>
              {canEdit && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {plots.map((plot) => {
              const plotActiveCrops = associations.filter(
                (a) => a.plotId === plot.id && a.status === "ACTIVE"
              );

              return (
                <tr key={plot.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{plot.name}</td>
                  <td className="p-3 text-slate-600">{plot.location || "—"}</td>
                  <td className="p-3 font-semibold text-slate-800">{plot.areaAcres} Acres</td>
                  <td className="p-3">
                    {plotActiveCrops.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {plotActiveCrops.map((pc) => (
                          <span
                            key={pc.id}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200"
                          >
                            <Sprout className="w-3 h-3 text-emerald-600" />
                            {pc.cropActivityName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No crops active</span>
                    )}
                  </td>
                  <td className="p-3">
                    {plot.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        <CheckCircle className="w-3 h-3 text-emerald-700" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        <XCircle className="w-3 h-3 text-slate-500" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{plot.createdAt}</td>
                  {canEdit && (
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenAssign(plot.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors inline-flex items-center gap-1"
                        title="Assign Crops to Plot"
                      >
                        <Sprout className="w-3 h-3 text-emerald-700" />
                        Assign Crops
                      </button>
                      <button
                        onClick={() => handleOpenEdit(plot)}
                        className="p-1 text-slate-600 hover:text-emerald-700 transition-colors inline-block"
                        title="Edit Plot"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(plot.id)}
                        className="p-1 text-slate-600 hover:text-red-700 transition-colors inline-block"
                        title="Delete Plot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

