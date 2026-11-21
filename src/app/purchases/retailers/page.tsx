"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import type { PartyItem, PartyType } from "@/lib/parties-data";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ContentCard } from "@/components/ui/content-card";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Receipt,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export default function RetailersPurchasersPage() {
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyItem | null>(null);

  // Form State without GSTIN and Status
  const [formData, setFormData] = useState({
    name: "",
    type: "Retailer" as PartyType,
    phone: "",
    email: "",
    city: "",
    address: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const fetchParties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parties");
      if (res.ok) {
        const data = await res.json();
        setParties(Array.isArray(data) ? data : []);
      } else {
        showToast("error", "Failed to fetch retailers and purchasers.");
      }
    } catch (err) {
      showToast("error", getErrorMessage(err) || "Network error loading parties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        fetchParties();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [fetchParties]);

  const openCreateModal = () => {
    setEditingParty(null);
    setFormData({
      name: "",
      type: "Retailer",
      phone: "",
      email: "",
      city: "",
      address: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (party: PartyItem) => {
    setEditingParty(party);
    setFormData({
      name: party.name,
      type: party.type,
      phone: party.phone || "",
      email: party.email || "",
      city: party.city || "",
      address: party.address || "",
      notes: party.notes || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingParty(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("error", "Entity / Party Name is required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingParty) {
        // Update
        const res = await fetch(`/api/parties/${editingParty.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast("success", `Updated ${formData.name} successfully!`);
          closeModal();
          fetchParties();
        } else {
          const err = await res.json();
          showToast("error", err.error || "Failed to update record");
        }
      } else {
        // Create
        const res = await fetch("/api/parties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          showToast("success", `Added ${formData.name} successfully!`);
          closeModal();
          fetchParties();
        } else {
          const err = await res.json();
          showToast("error", err.error || "Failed to create party");
        }
      }
    } catch (err) {
      showToast("error", getErrorMessage(err) || "Failed to save record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (party: PartyItem) => {
    if (!confirm(`Are you sure you want to delete "${party.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/parties/${party.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("success", `Removed "${party.name}"`);
        fetchParties();
      } else {
        const err = await res.json();
        showToast("error", err.error || "Failed to delete party");
      }
    } catch (err) {
      showToast("error", getErrorMessage(err) || "Delete failed");
    }
  };

  // Filtered List without GSTIN and Status
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType =
        typeFilter === "ALL"
          ? true
          : typeFilter === "RETAILER"
          ? p.type === "Retailer" || p.type === "Both"
          : typeFilter === "VENDOR"
          ? p.type === "Vendor" || p.type === "Both"
          : typeFilter === "CUSTOMER"
          ? p.type === "Customer" || p.type === "Both"
          : p.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [parties, searchTerm, typeFilter]);

  // KPIs
  const totalCount = parties.length;
  const retailersCount = parties.filter((p) => p.type === "Retailer" || p.type === "Both").length;
  const vendorsCount = parties.filter((p) => p.type === "Vendor" || p.type === "Both").length;

  return (
    <PageContainer>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 transition-all duration-200 ${
            toast.type === "success"
              ? "bg-[#EAF3EE] text-[#16805D] border-[#16805D]/25"
              : "bg-rose-50 text-[#DC3545] border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#16805D] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#DC3545] shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-slate-600 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Standardized Page Header */}
      <PageHeader
        title="Retailers & Suppliers Directory"
        breadcrumbs={[
          { label: "Vouchers", href: "/purchases" },
          { label: "Retailers & Suppliers" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/purchases"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Vouchers</span>
            </Link>

            <button
              onClick={fetchParties}
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 rounded-lg transition-colors shadow-2xs"
              title="Refresh List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#16805D]" : ""}`} />
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Entity</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards (3-Card Balanced Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Registered
            </p>
            <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
            <span className="text-[11px] text-slate-400">All directory entries</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-[#16805D] uppercase tracking-wider">
              Retail Buyers
            </p>
            <p className="text-2xl font-bold text-slate-900">{retailersCount}</p>
            <span className="text-[11px] text-slate-400">Retail & harvest customers</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EAF3EE] flex items-center justify-center text-[#174D3C]">
            <Store className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Suppliers & Vendors
            </p>
            <p className="text-2xl font-bold text-slate-900">{vendorsCount}</p>
            <span className="text-[11px] text-slate-400">Agri-inputs & hardware</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <ContentCard
        title="Directory Entities"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
              {[
                { label: "All Types", value: "ALL" },
                { label: "Retailers", value: "RETAILER" },
                { label: "Vendors", value: "VENDOR" },
                { label: "Customers", value: "CUSTOMER" },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setTypeFilter(pill.value)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                    typeFilter === pill.value
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C] focus:border-[#174D3C] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-5 -my-5">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#174D3C]" />
              <p className="text-xs font-medium">Loading Directory...</p>
            </div>
          ) : filteredParties.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">No entities match your filters</p>
              <p className="text-xs text-slate-500">
                {searchTerm || typeFilter !== "ALL"
                  ? "Try resetting filters or search keywords."
                  : "No parties currently registered. Click above to add your first partner."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Entity Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParties.map((party) => {
                  const isRetailer = party.type === "Retailer";
                  const isVendor = party.type === "Vendor";
                  const isBoth = party.type === "Both";

                  return (
                    <tr key={party.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200/80">
                            {party.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {party.name}
                            </div>
                            {party.notes && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                                {party.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isRetailer
                              ? "bg-[#EAF3EE] text-[#16805D]"
                              : isVendor
                              ? "bg-blue-50 text-blue-700"
                              : isBoth
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {party.type === "Vendor" ? "Vendor / Supplier" : party.type}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          {party.phone ? (
                            <div className="text-slate-800 font-medium flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{party.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {party.email && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{party.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{party.city || party.address || "Local"}</span>
                        </div>
                        {party.address && party.city && (
                          <span className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px] mt-0.5 block">
                            {party.address}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/sales?buyer=${encodeURIComponent(party.name)}`}
                            className="p-1.5 text-slate-400 hover:text-[#174D3C] hover:bg-slate-100 rounded transition-colors"
                            title="Sales invoice"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/purchases?vendor=${encodeURIComponent(party.name)}`}
                            className="p-1.5 text-slate-400 hover:text-[#174D3C] hover:bg-slate-100 rounded transition-colors"
                            title="Purchase voucher"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => openEditModal(party)}
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(party)}
                            className="p-1.5 text-slate-400 hover:text-[#DC3545] hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ContentCard>

      {/* Modal: Add / Edit Entity */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {editingParty ? "Edit Partner Entity" : "Register Partner Entity"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Entity Name <span className="text-[#DC3545]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agri Fresh Outlets"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Category Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as PartyType })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  >
                    <option value="Retailer">Retailer (Produce Buyer)</option>
                    <option value="Vendor">Vendor / Purchaser (Suppliers)</option>
                    <option value="Both">Both (Supplier & Buyer)</option>
                    <option value="Customer">Direct Customer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98421 55320"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. info@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Coimbatore, Pollachi"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Address</label>
                <textarea
                  rows={2}
                  placeholder="Street address, landmark..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Remarks / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Regular buyer, 15-day credit"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : editingParty ? (
                    "Save Changes"
                  ) : (
                    "Register Entity"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
