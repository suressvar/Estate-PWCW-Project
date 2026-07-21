"use client";

import React, { useState, useEffect } from "react";
import { PlotItem, PlotCropAssociation } from "@/lib/master-data";

interface CascadeLogFormProps {
  moduleTitle: string;
  submitEndpoint: string;
  onSuccess: () => void;
  renderExtraFields: (formState: any, setFormState: React.Dispatch<React.SetStateAction<any>>) => React.ReactNode;
  initialExtraState?: any;
}

export function CascadeLogForm({
  moduleTitle,
  submitEndpoint,
  onSuccess,
  renderExtraFields,
  initialExtraState = {},
}: CascadeLogFormProps) {
  const [plots, setPlots] = useState<PlotItem[]>([]);
  const [associations, setAssociations] = useState<PlotCropAssociation[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>("");
  const [filteredPlotCrops, setFilteredPlotCrops] = useState<PlotCropAssociation[]>([]);
  const [selectedPlotCropId, setSelectedPlotCropId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [extraState, setExtraState] = useState<any>(initialExtraState);

  useEffect(() => {
    async function loadMasterData() {
      const [plotsRes, assocRes] = await Promise.all([
        fetch("/api/plots"),
        fetch("/api/plot-crops"),
      ]);
      const plotsData: PlotItem[] = await plotsRes.json();
      const assocData: PlotCropAssociation[] = await assocRes.json();

      setPlots(plotsData);
      setAssociations(assocData);

      if (plotsData.length > 0) {
        const firstPlotId = plotsData[0].id;
        setSelectedPlotId(firstPlotId);
        const filtered = assocData.filter((a) => a.plotId === firstPlotId);
        setFilteredPlotCrops(filtered);
        if (filtered.length > 0) setSelectedPlotCropId(filtered[0].id);
      }
    }
    loadMasterData();
  }, []);

  const handlePlotChange = (plotId: string) => {
    setSelectedPlotId(plotId);
    const filtered = associations.filter((a) => a.plotId === plotId);
    setFilteredPlotCrops(filtered);
    if (filtered.length > 0) {
      setSelectedPlotCropId(filtered[0].id);
    } else {
      setSelectedPlotCropId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeAssoc = associations.find((a) => a.id === selectedPlotCropId);
    const activePlot = plots.find((p) => p.id === selectedPlotId);

    const payload = {
      plotCropId: selectedPlotCropId || undefined,
      plotName: activePlot ? activePlot.name : "General Estate",
      cropActivityName: activeAssoc ? activeAssoc.cropActivityName : "N/A",
      date,
      notes,
      ...extraState,
    };

    await fetch(submitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setNotes("");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-5 shadow-xs space-y-4 max-w-xl">
      <div className="border-b border-slate-200/80 pb-3">
        <h3 className="text-sm font-bold text-slate-900">New {moduleTitle} Entry</h3>
        <p className="text-xs text-slate-600 font-medium">Immutable transaction log bound to current user session</p>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Plot Selector */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Select Plot</label>
          <select
            id="form-plot-select"
            value={selectedPlotId}
            onChange={(e) => handlePlotChange(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name} ({plot.areaAcres} Acres)
              </option>
            ))}
          </select>
        </div>

        {/* Crop / Activity Selector (Filtered) */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Active Crop / Activity</label>
          <select
            id="form-crop-select"
            value={selectedPlotCropId}
            onChange={(e) => setSelectedPlotCropId(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            {filteredPlotCrops.length > 0 ? (
              filteredPlotCrops.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.cropActivityName} [{pc.status}]
                </option>
              ))
            ) : (
              <option value="">No Active Crop Mapped to Plot</option>
            )}
          </select>
        </div>

        {/* Transaction Date */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Transaction Date</label>
          <input
            id="form-date-input"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Category Specific Fields */}
        {renderExtraFields(extraState, setExtraState)}

        {/* Notes */}
        <div className="space-y-1 sm:col-span-2">
          <label className="font-semibold text-slate-700">Notes / Field Remarks</label>
          <input
            id="form-notes-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional transaction notes..."
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          id="form-submit-btn"
          type="submit"
          className="w-full sm:w-auto px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
        >
          Submit Immutable Log Entry
        </button>
      </div>
    </form>
  );
}
