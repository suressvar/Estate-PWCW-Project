"use client";

import { PlotsCropsNav } from "@/components/plots-crops-nav";
import { writeRequest } from '@/lib/http-client';
import type { CropItem, PlotCropAssociation, PlotItem } from "@/types/estate";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import {
  CheckCircle2,
  Droplets,
  Edit2,
  Filter,
  FlaskConical,
  Leaf,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Sprout,
  Tag,
  Tags,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

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
    "IRRIGATION & WATER",
    "SOIL & FERTILIZATION",
  ]);
  const canEdit = true;

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
  const [saveError, setSaveError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);

  // Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newManagerCategory, setNewManagerCategory] = useState("");
  const [managerMessage, setManagerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoadError('');
    try {
      const [cropsRes, assocRes, plotsRes, catRes] = await Promise.all([
        fetch("/api/crops"),
        fetch("/api/plot-crops"),
        fetch("/api/plots"),
        fetch("/api/crop-categories"),
      ]);
      if (![cropsRes, assocRes, plotsRes, catRes].every(response => response.ok)) throw new Error('Unable to load crop records. Please retry.');
      const [cropsData, assocData, plotsData, catData] = await Promise.all([
        cropsRes.json(),
        assocRes.json(),
        plotsRes.json(),
        catRes.json(),
      ]);
      if (![cropsData, assocData, plotsData, catData].every(Array.isArray)) throw new Error('Unable to load crop records. Please retry.');
      setCrops(cropsData);
      setAssociations(assocData);
      setPlots(plotsData);
      if (Array.isArray(catData) && catData.length > 0) {
        setCategories(catData);
      }
    } catch {
      setLoadError('Unable to load crop records. Please retry.');
    }
  };

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchData();
      })();
    }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
  }, []);

  const handleOpenCreate = () => {
    setSaveError('');
    setEditingId(null);
    setName("");
    setType(categories[0] || "CROP");
    setIsCreatingInlineCategory(false);
    setInlineCategoryName("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (crop: CropItem) => {
    setSaveError('');
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
      await writeRequest("/api/crop-categories", {
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
      setSaveError(error instanceof Error ? error.message : 'Failed to add category.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    setSaveError('');
    try {
      const finalType = (type || "CROP").trim().toUpperCase();
      if (editingId) {
        await writeRequest("/api/crops", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name, type: finalType }),
        });
      } else {
        await writeRequest("/api/crops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type: finalType }),
        });
      }
      setIsFormOpen(false);
      await fetchData();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save crop. Please try again.');
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this Crop/Activity?")) {
      try {
        await writeRequest(`/api/crops?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        await fetchData();
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Unable to delete crop. Please try again.');
      }
    }
  };

  const handleCreateManagerCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newManagerCategory.trim().toUpperCase();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setManagerMessage({ type: "error", text: "This category classification already exists." });
      return;
    }
    try {
      const res = await writeRequest("/api/crop-categories", {
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
    } catch (error) {
      setManagerMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to create category." });
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
        await writeRequest(`/api/crop-categories?category=${encodeURIComponent(catToDelete)}`, {
          method: "DELETE",
        });
        setCategories((prev) => prev.filter((c) => c !== catToDelete));
        if (selectedCategoryFilter === catToDelete) {
          setSelectedCategoryFilter("ALL");
        }
      } catch (err) {
        setManagerMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete category.' });
      }
    }
  };

  const filteredCrops = useMemo(() => {
    return crops.filter((crop) => {
      const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat =
        selectedCategoryFilter === "ALL" ||
        crop.type.toUpperCase() === selectedCategoryFilter.toUpperCase();
      return matchesSearch && matchesCat;
    });
  }, [crops, searchTerm, selectedCategoryFilter]);

  const renderCategoryBadge = (categoryType: string) => {
    const upper = (categoryType || "").toUpperCase();
    if (upper === "CROP" || upper.includes("HARVEST") || upper.includes("VEGETABLE") || upper.includes("FRUIT") || upper.includes("PRODUCE")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <Sprout className="w-3 h-3 text-emerald-700" />
          {categoryType}
        </span>
      );
    }
    if (upper.includes("TIMBER") || upper.includes("TREE") || upper.includes("FODDER")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
          <Leaf className="w-3 h-3 text-teal-700" />
          {categoryType}
        </span>
      );
    }
    if (upper.includes("WATER") || upper.includes("IRRIGAT")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
          <Droplets className="w-3 h-3 text-sky-700" />
          {categoryType}
        </span>
      );
    }
    if (upper.includes("FERTILIZ") || upper.includes("SOIL") || upper.includes("TEST")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
          <FlaskConical className="w-3 h-3 text-indigo-700" />
          {categoryType}
        </span>
      );
    }
    if (upper.includes("ACTIVITY") || upper.includes("TASK") || upper.includes("LABOR") || upper.includes("MAINTENANCE")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          <Wrench className="w-3 h-3 text-amber-700" />
          {categoryType}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
        <Tag className="w-3 h-3 text-purple-700" />
        {categoryType}
      </span>
    );
  };

  return (
    <PageContainer>
      {loadError && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={() => void fetchData()} className="underline font-semibold ml-2">Retry loading</button>
        </div>
      )}
      {saveError && !isFormOpen && (
        <p role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">{saveError}</p>
      )}

      {/* Unified Module Nav Tabs */}
      <PlotsCropsNav
        stats={{
          plotsCount: plots.length,
          cropsCount: crops.length,
          associationsCount: associations.length,
        }}
      />

      {/* Page Header */}
      <PageHeader
        title="Crops & Activities Master Data"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Plots & Crops", href: "/plots" },
          { label: "Crops Master" },
        ]}
        actions={
          canEdit ? (
            <div className="flex items-center gap-2">
              <button
                id="manage-categories-btn"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5"
                title="Manage Category Classifications"
              >
                <Tags className="w-3.5 h-3.5 text-estate-primary" />
                Manage Categories
              </button>
              <button
                id="add-crop-btn"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-estate-primary hover:bg-estate-primary-hover text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create New Crop / Activity
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Read-Only Banner */}
      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Read-Only View Enabled for <strong>Field Staff</strong> role. Edit controls are restricted.</span>
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <ContentCard noPadding>
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search crop or activity name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-estate-primary focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 shrink-0">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full md:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-estate-primary font-medium"
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

        {/* Crops Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs erp-table">
            <thead>
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3">Category Classification</th>
                <th className="p-3">Active Assigned Plots</th>
                <th className="p-3">Registered Date</th>
                {canEdit && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCrops.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="p-12 text-center text-slate-400">
                    <Sprout className="w-9 h-9 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-sm text-slate-700">No definitions found</p>
                    <p className="text-xs text-slate-400 mt-1">
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
                      <td className="p-3 font-semibold text-slate-900">{crop.name}</td>
                      <td className="p-3">{renderCategoryBadge(crop.type)}</td>
                      <td className="p-3">
                        {activePlotsForCrop.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {activePlotsForCrop.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                              >
                                <MapPin className="w-2.5 h-2.5 text-estate-primary" />
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
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(crop)}
                            className="p-1.5 text-slate-500 hover:text-estate-primary hover:bg-slate-100 rounded-md transition-colors inline-block"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(crop.id)}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors inline-block"
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
      </ContentCard>

      {/* Modal / Form Overlay (Create / Edit Definition) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <fieldset disabled={isSaving} className="contents">
              {saveError && <p role="alert" className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200 font-medium">{saveError}</p>}

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-estate-primary" />
                  {editingId ? "Edit Definition Record" : "Create Definition Record"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Item Name</label>
                  <input
                    id="crop-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Groundnut, Organic Turmeric, Drip Irrigation"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary focus:bg-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Category Classification</label>
                    {!isCreatingInlineCategory && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingInlineCategory(true)}
                        className="text-[11px] font-semibold text-estate-primary hover:text-estate-primary-hover flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        + New Classification
                      </button>
                    )}
                  </div>

                  {isCreatingInlineCategory ? (
                    <div className="p-3 bg-estate-subtle/50 rounded-lg border border-estate-primary/20 space-y-2">
                      <span className="text-[11px] font-bold text-estate-primary block">
                        Create New Category Classification
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={inlineCategoryName}
                          onChange={(e) => setInlineCategoryName(e.target.value)}
                          placeholder="e.g. SPICES, MEDICINAL CROPS, PRUNING"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-estate-primary uppercase"
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
                          className="px-3 py-1.5 bg-estate-primary hover:bg-estate-primary-hover disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingInlineCategory(false);
                            setInlineCategoryName("");
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-estate-primary text-xs font-medium"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__NEW_CUSTOM__" className="text-estate-primary font-bold">
                        + Add New Classification...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-crop-btn"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-estate-primary hover:bg-estate-primary-hover text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                >
                  Save Record
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-estate-primary" />
                <h3 className="text-sm font-bold text-slate-900">
                  Category Classifications Manager
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {managerMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${managerMessage.type === "success"
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
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-estate-primary uppercase"
                />
                <button
                  type="submit"
                  disabled={!newManagerCategory.trim()}
                  className="px-3.5 py-2 bg-estate-primary hover:bg-estate-primary-hover disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1"
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
                        <span className="text-[10px] text-estate-primary font-medium bg-estate-subtle px-2 py-0.5 rounded-full border border-estate-primary/20">
                          In Use
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
