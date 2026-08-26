"use client";

import React, { useState, useEffect } from "react";
import { CropItem, PlotCropAssociation, PlotItem } from "@/lib/master-data";
import { RoleBadge } from "@/components/ui/role-badge";
import { PlotsCropsNav } from "@/components/plots-crops-nav";
import {
  Sprout,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  SlidersHorizontal,
  FlaskConical,
  MapPin,
} from "lucide-react";

export default function CropsPage() {
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [roleName, setRoleName] = useState<string>("Admin");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"CROP" | "ACTIVITY">("CROP");

  const fetchData = async () => {
    const [cropsRes, assocRes, plotsRes] = await Promise.all([
      fetch("/api/crops"),
      fetch("/api/plot-crops"),
      fetch("/api/plots"),
    ]);
    const [cropsData, assocData, plotsData] = await Promise.all([
      cropsRes.json(),
      assocRes.json(),
      plotsRes.json(),
    ]);
    setCrops(cropsData);
    setAssociations(assocData);
    setPlots(plotsData);
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
    setType("CROP");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (crop: CropItem) => {
    setEditingId(crop.id);
    setName(crop.name);
    setType(crop.type);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch("/api/crops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, type }),
      });
    } else {
      await fetch("/api/crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
    }
    setIsFormOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this Crop/Activity?")) {
      await fetch(`/api/crops?id=${id}`, { method: "DELETE" });
      fetchData();
    }
  };

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
            <Sprout className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Crops & Activities Master Data</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain master definitions for agricultural crops and field operation activities.
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
        <h2 className="text-sm font-bold text-slate-900">Master Definitions ({crops.length})</h2>
        {canEdit && (
          <button
            id="add-crop-btn"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create New Crop / Activity
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
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? "Edit Definition Record" : "Create Definition Record"}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Item Name</label>
                <input
                  id="crop-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Groundnut or Drip Irrigation"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category Classification</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "CROP" | "ACTIVITY")}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="CROP">CROP (Harvestable Produce)</option>
                  <option value="ACTIVITY">ACTIVITY (Field Task / Labor)</option>
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
                id="save-crop-btn"
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Crops Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Item Name</th>
              <th className="p-3">Category Classification</th>
              <th className="p-3">Active Assigned Plots</th>
              <th className="p-3">Registered Date</th>
              {canEdit && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white">
            {crops.map((crop) => {
              const activePlotsForCrop = associations.filter(
                (a) => a.cropActivityId === crop.id && a.status === "ACTIVE"
              );

              return (
                <tr key={crop.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{crop.name}</td>
                  <td className="p-3">
                    {crop.type === "CROP" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        <Sprout className="w-3 h-3 text-emerald-700" />
                        Harvest Crop
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-300/60">
                        <FlaskConical className="w-3 h-3 text-emerald-700" />
                        Field Activity
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {activePlotsForCrop.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {activePlotsForCrop.map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200"
                          >
                            <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                            {a.plotName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No active plots</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{crop.createdAt}</td>
                  {canEdit && (
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(crop)}
                        className="p-1 text-slate-600 hover:text-emerald-700 transition-colors inline-block"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(crop.id)}
                        className="p-1 text-slate-600 hover:text-red-700 transition-colors inline-block"
                        title="Delete Item"
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

