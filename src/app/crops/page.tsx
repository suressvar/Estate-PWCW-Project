"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Tag,
  Tags,
  Search,
  Filter,
  CheckCircle2,
  X,
  Layers,
  Leaf,
  Droplets,
  Wrench,
  Sparkles,
} from "lucide-react";

export default function CropsPage() {
  const [crops, setCrops] = useState<CropItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "CROP",
    "ACTIVITY",
    "FRUIT CROPS",
    "VEGETABLES",
    "TIMBER & TREES",
    "FODDER CROPS",
    "INTER-CROP",
    "FIELD ACTIVITY",
    "IRRIGATION & WATER",
    "SOIL & FERTILIZATION",
  ]);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [roleName, setRoleName] = useState<string>("Admin");

  // Filtering & Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("CROP");
  const [isCreatingInlineCategory, setIsCreatingInlineCategory] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState("");

  // Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newManagerCategory, setNewManagerCategory] = useState("");
  const [managerMessage, setManagerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [cropsRes, assocRes, plotsRes, catRes] = await Promise.all([
        fetch("/api/crops"),
        fetch("/api/plot-crops"),
        fetch("/api/plots"),
        fetch("/api/crop-categories"),
      ]);
      const [cropsData, assocData, plotsData, catData] = await Promise.all([
        cropsRes.json(),
        assocRes.json(),
        plotsRes.json(),
        catRes.json(),
      ]);
      setCrops(cropsData);
      setAssociations(assocData);
      setPlots(plotsData);
      if (Array.isArray(catData) && catData.length > 0) {
        setCategories(catData);
      }
    } catch (e) {
      console.error("Error fetching master data:", e);
    }
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
    setType(categories[0] || "CROP");
    setIsCreatingInlineCategory(false);
    setInlineCategoryName("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (crop: CropItem) => {
    setEditingId(crop.id);
    setName(crop.name);
    setType(crop.type);
    setIsCreatingInlineCategory(false);
    setInlineCategoryName("");
    setIsFormOpen(true);
  };

  const handleAddInlineCategory = async () => {
    const trimmed = inlineCategoryName.trim().toUpperCase();
    if (!trimmed) return;
    try {
      await fetch("/api/crop-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: trimmed }),
      });
      if (!categories.includes(trimmed)) {
        setCategories((prev) => [...prev, trimmed]);
      }
      setType(trimmed);
      setIsCreatingInlineCategory(false);
      setInlineCategoryName("");
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = (type || "CROP").trim().toUpperCase();
    if (editingId) {
      await fetch("/api/crops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, type: finalType }),
      });
    } else {
      await fetch("/api/crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: finalType }),
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

  // Manager Category Handlers
  const handleCreateManagerCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newManagerCategory.trim().toUpperCase();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setManagerMessage({ type: "error", text: "This category classification already exists." });
      return;
    }
    try {
      const res = await fetch("/api/crop-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: trimmed }),
      });
      if (res.ok) {
        setCategories((prev) => [...prev, trimmed]);
        setNewManagerCategory("");
        setManagerMessage({ type: "success", text: `Category "${trimmed}" created successfully!` });
        setTimeout(() => setManagerMessage(null), 3000);
      }
    } catch (err) {
      setManagerMessage({ type: "error", text: "Failed to create category." });
    }
  };

  const handleDeleteManagerCategory = async (catToDelete: string) => {
    const isUsed = crops.some((c) => c.type.toUpperCase() === catToDelete.toUpperCase());
    if (isUsed) {
      alert(`Cannot delete "${catToDelete}" because active crop/activity definitions are using this classification.`);
      return;
    }
    if (confirm(`Are you sure you want to remove the "${catToDelete}" category classification?`)) {
      try {
        await fetch(`/api/crop-categories?category=${encodeURIComponent(catToDelete)}`, {
          method: "DELETE",
        });
        setCategories((prev) => prev.filter((c) => c !== catToDelete));
        if (selectedCategoryFilter === catToDelete) {
          setSelectedCategoryFilter("ALL");
        }
      } catch (err) {
        console.error("Failed to delete category:", err);
      }
    }
  };

  // Filtered crops list
  const filteredCrops = useMemo(() => {
    return crops.filter((crop) => {
      const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat =
        selectedCategoryFilter === "ALL" ||
        crop.type.toUpperCase() === selectedCategoryFilter.toUpperCase();
      return matchesSearch && matchesCat;
    });
  }, [crops, searchTerm, selectedCategoryFilter]);

  // Dynamic Badge Renderer
  const renderCategoryBadge = (categoryType: string) => {
    const upper = (categoryType || "").toUpperCase();
    if (upper === "CROP" || upper.includes("HARVEST") || upper.includes("VEGETABLE") || upper.includes("FRUIT") || upper.includes("PRODUCE")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
          <Sprout className="w-3 h-3 text-emerald-700" />
          {categoryType}
        </span>
      );
    }
    if (upper.includes("TIMBER") || upper.includes("TREE") || upper.includes("FODDER")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded border border-teal-300">
          <Leaf className="w-3 h-3 text-teal-700" />
          {categoryType}
        </span>
      );
    }
    if (upper.includes("WATER") || upper.includes("IRRIGAT")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded border border-sky-300">
          <Droplets className="w-3 h-3 text-sky-700" />
          {categoryType}
        </span>
      );
    }
    if (upper.includes("FERTILIZ") || upper.includes("SOIL") || upper.includes("TEST")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded border border-indigo-300">
          <FlaskConical className="w-3 h-3 text-indigo-700" />
          {categoryType}
        </span>
      );
    }
    if (upper.includes("ACTIVITY") || upper.includes("TASK") || upper.includes("LABOR") || upper.includes("MAINTENANCE")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
          <Wrench className="w-3 h-3 text-amber-700" />
          {categoryType}
        </span>
      );
    }
    // Generic custom category
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-100/90 px-2 py-0.5 rounded border border-purple-300">
        <Tag className="w-3 h-3 text-purple-700" />
        {categoryType}
      </span>
    );
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

      {/* Action Bar & Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            Master Definitions ({filteredCrops.length} {filteredCrops.length !== crops.length && `of ${crops.length}`})
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canEdit && (
            <button
              id="manage-categories-btn"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-md border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5"
              title="Manage Category Classifications"
            >
              <Tags className="w-3.5 h-3.5 text-emerald-700" />
              Manage Categories
            </button>
          )}

          {canEdit && (
            <button
              id="add-crop-btn"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create New Crop / Activity
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search crop or activity name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 shrink-0">Category:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full md:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
          >
            <option value="ALL">All Categories ({crops.length})</option>
            {categories.map((cat) => {
              const count = crops.filter((c) => c.type.toUpperCase() === cat.toUpperCase()).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Modal / Form Overlay (Create / Edit Definition) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-700" />
                {editingId ? "Edit Definition Record" : "Create Definition Record"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Item Name</label>
                <input
                  id="crop-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Groundnut, Organic Turmeric, Drip Irrigation"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Category Classification</label>
                  {!isCreatingInlineCategory && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineCategory(true)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      + New Classification
                    </button>
                  )}
                </div>

                {isCreatingInlineCategory ? (
                  <div className="p-3 bg-emerald-50/60 rounded-md border border-emerald-200 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      Create New Category Classification
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={inlineCategoryName}
                        onChange={(e) => setInlineCategoryName(e.target.value)}
                        placeholder="e.g. SPICES, MEDICINAL CROPS, PRUNING"
                        className="flex-1 p-1.5 bg-white border border-emerald-300 rounded text-xs text-slate-900 focus:outline-none focus:border-emerald-600 uppercase"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddInlineCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddInlineCategory}
                        disabled={!inlineCategoryName.trim()}
                        className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingInlineCategory(false);
                          setInlineCategoryName("");
                        }}
                        className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    id="crop-category-select"
                    value={type}
                    onChange={(e) => {
                      if (e.target.value === "__NEW_CUSTOM__") {
                        setIsCreatingInlineCategory(true);
                      } else {
                        setType(e.target.value);
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__NEW_CUSTOM__" className="text-emerald-700 font-bold">
                      + Add New Classification...
                    </option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Category Classifications Manager
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {managerMessage && (
              <div
                className={`p-2.5 rounded text-xs font-semibold flex items-center gap-1.5 ${
                  managerMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {managerMessage.text}
              </div>
            )}

            {/* Add Category Form */}
            <form onSubmit={handleCreateManagerCategory} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Add New Category Classification
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newManagerCategory}
                  onChange={(e) => setNewManagerCategory(e.target.value)}
                  placeholder="e.g. TIMBER & TREES, ORGANIC SPICES, GREEN MANURE"
                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-emerald-600 uppercase"
                />
                <button
                  type="submit"
                  disabled={!newManagerCategory.trim()}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-xs transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Registered Classifications ({categories.length})
              </label>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {categories.map((cat) => {
                  const usageCount = crops.filter(
                    (c) => c.type.toUpperCase() === cat.toUpperCase()
                  ).length;

                  return (
                    <div
                      key={cat}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {renderCategoryBadge(cat)}
                        <span className="text-[11px] text-slate-400">
                          ({usageCount} {usageCount === 1 ? "item" : "items"})
                        </span>
                      </div>

                      {usageCount === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteManagerCategory(cat)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete unused category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          In Use
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
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
            {filteredCrops.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="p-8 text-center text-slate-400">
                  <Sprout className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-sm text-slate-600">No definitions found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {searchTerm || selectedCategoryFilter !== "ALL"
                      ? "Try changing your search keywords or category filter."
                      : "Create your first crop or activity to get started."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredCrops.map((crop) => {
                const activePlotsForCrop = associations.filter(
                  (a) => a.cropActivityId === crop.id && a.status === "ACTIVE"
                );

                return (
                  <tr key={crop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{crop.name}</td>
                    <td className="p-3">{renderCategoryBadge(crop.type)}</td>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
