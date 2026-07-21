"use client";

import React, { useState } from "react";
import { PlusCircle, Send } from "lucide-react";

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [plot, setPlot] = useState("Plot A - North Field");
  const [activity, setActivity] = useState("Fertilizer Application");
  const [menCount, setMenCount] = useState("4");
  const [womenCount, setWomenCount] = useState("6");
  const [dieselUsed, setDieselUsed] = useState("15");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 max-w-xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          Quick Field Log Entry
        </h3>
        <span className="text-xs text-slate-400 font-medium">Mobile Optimized</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Target Plot</label>
          <select
            value={plot}
            onChange={(e) => setPlot(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          >
            <option>Plot A - North Field (12.5 Acres)</option>
            <option>Plot B - Coconut Grove (8.0 Acres)</option>
            <option>Plot C - South Pasture (15.2 Acres)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Activity Type</label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          >
            <option>Fertilizer Application</option>
            <option>Crop Weeding & Tying</option>
            <option>Tractor Tilling</option>
            <option>Harvest / Production</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Male Labor Count</label>
          <input
            type="number"
            value={menCount}
            onChange={(e) => setMenCount(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Female Labor Count</label>
          <input
            type="number"
            value={womenCount}
            onChange={(e) => setWomenCount(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="font-semibold text-slate-700">Diesel Consumption (Liters)</label>
          <input
            type="number"
            value={dieselUsed}
            onChange={(e) => setDieselUsed(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          Submit Field Log
        </button>
      </div>
    </form>
  );

}
