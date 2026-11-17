"use client";

import type { PurchasesPageState } from "@/components/purchases/use-purchases-page";
import {
  Plus,
  Tag,
  Trash2,
  X
} from "lucide-react";

type Props = Pick<PurchasesPageState,
  "catModalOpen" |
  "setCatModalOpen" |
  "setNewCatName" |
  "handleAddCategory" |
  "newCatName" |
  "savingCat" |
  "categories" |
  "handleDeleteCategory"
>;

export function PurchaseCategoriesModal({
  catModalOpen,
  setCatModalOpen,
  setNewCatName,
  handleAddCategory,
  newCatName,
  savingCat,
  categories,
  handleDeleteCategory,
}: Props) {
  return (
    catModalOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                <Tag className="w-4 h-4" />
              </span>
              <span>Manage Purchase Categories</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setCatModalOpen(false);
                setNewCatName("");
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input
              type="text"
              required
              placeholder="New Category (e.g. Irrigation Spares, Packaging, Tools)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d]"
            />
            <button
              type="submit"
              disabled={savingCat || !newCatName.trim()}
              className="px-4 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{savingCat ? "Adding..." : "Add"}</span>
            </button>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Configured Categories ({categories.length})
            </div>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Tag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{cat}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setCatModalOpen(false);
                setNewCatName("");
              }}
              className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );
}
