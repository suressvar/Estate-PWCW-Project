"use client";
import { useCallback } from 'react';
import { errorMessage as getErrorMessage } from "@/lib/errors";

import type { PartyItem,PartyType } from "@/lib/parties-data";
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
import React,{ useEffect,useMemo,useState } from "react";

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
    const pending = setTimeout(() => { dispose = (() => {
    fetchParties();
  })(); }, 0);
    return () => { clearTimeout(pending); if (typeof dispose === 'function') dispose(); };
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
        showToast("success", `Deleted ${party.name} successfully.`);
        fetchParties();
      } else {
        const err = await res.json();
        showToast("error", err.error || "Could not delete party");
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
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Notification Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 hover:text-slate-700 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/purchases"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
            title="Return to Vouchers"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Vouchers Module
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Party Directory</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Store className="w-6 h-6 text-emerald-700" />
              Retailers & Suppliers Directory
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchParties}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <Link
            href="/purchases"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-700" />
            Purchase Voucher
          </Link>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            Add Retailer / Purchaser
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (3-Card Balanced Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Registered</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">All Entities</span>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700">Retailers</p>
            <p className="text-2xl font-bold text-emerald-900 mt-0.5">{retailersCount}</p>
            <span className="text-[11px] text-emerald-600 mt-1 block">Outlets & Stores</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-700">Purchasers & Vendors</p>
            <p className="text-2xl font-bold text-blue-900 mt-0.5">{vendorsCount}</p>
            <span className="text-[11px] text-blue-600 mt-1 block">Suppliers & Dealers</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, city, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-emerald-600 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              typeFilter === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter("RETAILER")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              typeFilter === "RETAILER"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Retailers
          </button>
          <button
            onClick={() => setTypeFilter("VENDOR")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              typeFilter === "VENDOR"
                ? "bg-blue-800 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Vendors/Purchasers
          </button>
          <button
            onClick={() => setTypeFilter("CUSTOMER")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              typeFilter === "CUSTOMER"
                ? "bg-amber-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Customers
          </button>
        </div>
      </div>

      {/* Directory Table (without GSTIN and Status columns) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-700" />
            <p className="text-sm font-medium">Loading Retailers & Purchasers Directory...</p>
          </div>
        ) : filteredParties.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Retailers or Purchasers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || typeFilter !== "ALL"
                ? "Try clearing your filters or search keywords."
                : "No parties currently registered. Click below to add a new retailer or purchaser."}
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-xl hover:bg-emerald-900 transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Retailer / Purchaser
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Party / Entity Name</th>
                  <th className="px-4 py-3.5">Type / Category</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Location / City</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParties.map((party) => {
                  const isRetailer = party.type === "Retailer";
                  const isVendor = party.type === "Vendor";
                  const isBoth = party.type === "Both";

                  return (
                    <tr key={party.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isRetailer
                                ? "bg-emerald-100 text-emerald-800"
                                : isVendor
                                ? "bg-blue-100 text-blue-800"
                                : isBoth
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {party.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {party.name}
                            </div>
                            {party.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                                {party.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isRetailer
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : isVendor
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : isBoth
                              ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {party.type === "Vendor" ? "Vendor / Supplier" : party.type}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {party.phone ? (
                            <a
                              href={`tel:${party.phone}`}
                              className="text-xs text-slate-800 font-medium hover:text-emerald-700 flex items-center gap-1.5"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              {party.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                          {party.email && (
                            <a
                              href={`mailto:${party.email}`}
                              className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1.5"
                            >
                              <Mail className="w-3 h-3 text-slate-400" />
                              {party.email}
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-xs text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{party.city || party.address || "Local"}</span>
                        </div>
                        {party.address && party.city && (
                          <span className="text-[11px] text-slate-400 block line-clamp-1 max-w-[240px] mt-0.5">
                            {party.address}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/sales?buyer=${encodeURIComponent(party.name)}`}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Create Sales Invoice Record for this buyer"
                          >
                            <Receipt className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/purchases?vendor=${encodeURIComponent(party.name)}`}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Create Purchase Voucher with this entity"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(party)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(party)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog (without GSTIN and Status) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingParty ? "Edit Retailer / Purchaser" : "Add Retailer / Purchaser"}
                  </h3>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Name and Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Party / Entity Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kovai Fresh Retailers"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Category / Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PartyType })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="Retailer">Retailer (Outlets, Shops, Markets)</option>
                    <option value="Vendor">Vendor / Purchaser (Suppliers, Dealers)</option>
                    <option value="Both">Both (Supplier & Retail Buyer)</option>
                    <option value="Customer">Direct Customer</option>
                  </select>
                </div>
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Phone / Mobile</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98421 55320"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. info@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* City / Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Coimbatore, Pollachi, Udumalpet"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Street Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Business Address</label>
                <textarea
                  rows={2}
                  placeholder="Street address, shop number, landmark..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-hidden resize-none"
                />
              </div>

              {/* Notes / Terms */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Regular organic buyer, 15-day credit terms, fertilizer supplier"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
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
    </div>
  );
}
