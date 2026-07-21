"use client";

import React, { useState, useEffect } from "react";
import { PlotCropAssociation, PlotItem, CropItem } from "@/lib/master-data";
import { RoleBadge } from "@/components/ui/role-badge";
import {
  Link2,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

export default function PlotCropsPage() {
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [roleName, setRoleName] = useState<string>("Admin");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [selectedCropId, setSelectedCropId] = useState("");
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

    if (plotsData.length > 0) setSelectedPlotId(plotsData[0].id);
    if (cropsData.length > 0) setSelectedCropId(cropsData[0].id);
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
    if (plots.length > 0) setSelectedPlotId(plots[0].id);
    if (crops.length > 0) setSelectedCropId(crops[0].id);
    setIsFormOpen(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/plot-crops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plotId: selectedPlotId,
        cropActivityId: selectedCropId,
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & RBAC Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-lg border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Plot-Crop Active Tracking Associations</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign which active crops or operational activities are mapped to specific land plots.
          </p>
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
        <h2 className="text-sm font-bold text-slate-900">Active Associations ({associations.length})</h2>
        {canEdit && (
          <button
            id="add-plot-crop-btn"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Assign Crop to Plot
          </button>
        )}
      </div>

      {/* Modal / Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">Assign Crop/Activity to Plot</h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Land Plot</label>
                <select
                  id="assoc-plot-select"
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {plots.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.name} ({plot.areaAcres} Acres)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Crop / Activity</label>
                <select
                  id="assoc-crop-select"
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name} [{crop.type}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tracking Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                />
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
                id="save-assoc-btn"
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
              >
                Create Association
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Associations Data Table */}
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
            {associations.map((assoc) => (
              <tr key={assoc.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 font-bold text-slate-900">{assoc.plotName}</td>
                <td className="p-3 font-semibold text-emerald-800">{assoc.cropActivityName}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
