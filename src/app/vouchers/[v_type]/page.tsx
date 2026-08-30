"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Filter,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  FileSpreadsheet,
} from "lucide-react";
import { ExpenseLedgerItem, LedgerGroupItem } from "@/lib/accounting-data";
import { ExpenseUnit } from "@/lib/vouchers-data";

export default function VoucherRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const v_type = (params.v_type as string) === "goat" ? "feed" : (params.v_type as string) || "feed";

  const [logs, setLogs] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<ExpenseLedgerItem[]>([]);
  const [groups, setGroups] = useState<LedgerGroupItem[]>([]);
  const [units, setUnits] = useState<ExpenseUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Universal Form Fields
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [billDate, setBillDate] = useState("");
  const [billNo, setBillNo] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [ledgerId, setLedgerId] = useState("");
  const [ledgerGroupText, setLedgerGroupText] = useState("");
  const [pnlCategory, setPnlCategory] = useState(v_type === "other" ? "Direct Expenses" : "Purchase");
  const [notes, setNotes] = useState("");

  // Type-Specific Form Fields
  const [tagId, setTagId] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Female");
  const [weight, setWeight] = useState<number | "">(30);
  const [price, setPrice] = useState<number | "">(12000);

  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number | "">(10);
  const [unit, setUnit] = useState("bags");
  const [doseUnit, setDoseUnit] = useState("vials");
  const [cost, setCost] = useState<number | "">(5000);

  const fetchData = async () => {
    try {
      const [logsRes, ledgersRes, groupsRes, unitsRes] = await Promise.all([
        fetch(`/api/vouchers/${v_type}`),
        fetch("/api/expense-ledgers"),
        fetch("/api/ledger-groups"),
        fetch("/api/expense-units"),
      ]);

      const logsData = await logsRes.json();
      const ledgersData = await ledgersRes.json();
      const groupsData = await groupsRes.json();
      const unitsData = await unitsRes.json();

      setLogs(logsData);
      setLedgers(ledgersData);
      setGroups(groupsData);
      setUnits(unitsData);

      if (ledgersData.length > 0 && !ledgerId) {
        setLedgerId(ledgersData[0].id);
        setLedgerGroupText(ledgersData[0].groupName || "Direct Expenses");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.v_type === "other") {
      router.replace("/purchases/other");
      return;
    }
    fetchData();
  }, [v_type, params.v_type, router]);

  const handleLedgerChange = (lId: string) => {
    setLedgerId(lId);
    const selected = ledgers.find((l) => l.id === lId);
    if (selected) {
      setLedgerGroupText(selected.groupName || "");
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setBillDate("");
    setBillNo("");
    setSellerName("");
    setNotes("");
    setPnlCategory(v_type === "other" ? "Direct Expenses" : "Purchase");

    if (v_type === "goat") {
      setTagId(`RN-GT-${Math.floor(100 + Math.random() * 900)}`);
      setBreed("Tellicherry");
      setGender("Female");
      setWeight(32);
      setPrice(13500);
    } else if (v_type === "feed") {
      setItemName("Concentrate Feed Mash");
      setQuantity(20);
      setUnit("bags");
      setCost(16000);
    } else if (v_type === "medicine") {
      setItemName("Multivitamin Tonic");
      setQuantity(5);
      setDoseUnit("L");
      setCost(2400);
    } else if (v_type === "vaccine") {
      setItemName("ET Vaccine (50 Doses)");
      setQuantity(2);
      setCost(1200);
    } else {
      setItemName("Electricity & Water Supply");
      setQuantity(1);
      setUnit("nos");
      setCost(4500);
    }
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setPurchaseDate(item.purchaseDate || item.voucherDate || "");
    setBillDate(item.billDate || "");
    setBillNo(item.billNo || "");
    setSellerName(item.sellerName || item.supplier || item.supplierName || "");
    setNotes(item.notes || "");
    setLedgerId(item.ledgerId || (ledgers[0]?.id || ""));
    setPnlCategory(item.pnlCategory || (v_type === "other" ? "Direct Expenses" : "Purchase"));

    const matchedLedger = ledgers.find((l) => l.id === item.ledgerId);
    setLedgerGroupText(matchedLedger?.groupName || "Direct Expenses");

    if (v_type === "goat") {
      setTagId(item.tagId);
      setBreed(item.breed || "");
      setGender(item.gender || "Female");
      setWeight(item.weight || 0);
      setPrice(item.price || 0);
    } else if (v_type === "feed") {
      setItemName(item.feedName || "");
      setQuantity(item.quantity || 0);
      setUnit(item.unit || "bags");
      setCost(item.cost || 0);
    } else if (v_type === "medicine") {
      setItemName(item.medicineName || "");
      setDoseUnit(item.doseUnit || "vials");
      setQuantity(item.quantity || 0);
      setCost(item.cost || 0);
    } else if (v_type === "vaccine") {
      setItemName(item.vaccineName || "");
      setQuantity(item.quantity || 0);
      setCost(item.cost || 0);
    } else {
      setQuantity(item.quantity || 1);
      setUnit(item.unitName || "nos");
      setCost(item.amount || 0);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let payload: any = {
        billDate,
        billNo,
        ledgerId,
        pnlCategory,
        notes,
      };

      if (v_type === "goat") {
        payload = {
          ...payload,
          sellerName,
          purchaseDate,
          tagId,
          breed,
          gender,
          weight: Number(weight),
          price: Number(price),
        };
      } else if (v_type === "feed") {
        payload = {
          ...payload,
          feedName: itemName,
          quantity: Number(quantity),
          unit,
          cost: Number(cost),
          purchaseDate,
          supplier: sellerName,
        };
      } else if (v_type === "medicine") {
        payload = {
          ...payload,
          medicineName: itemName,
          doseUnit,
          quantity: Number(quantity),
          cost: Number(cost),
          purchaseDate,
          supplier: sellerName,
        };
      } else if (v_type === "vaccine") {
        payload = {
          ...payload,
          vaccineName: itemName,
          quantity: Number(quantity),
          cost: Number(cost),
          purchaseDate,
          supplier: sellerName,
        };
      } else {
        payload = {
          ...payload,
          voucherDate: purchaseDate,
          supplierName: sellerName,
          quantity: Number(quantity),
          unitName: unit,
          amount: Number(cost),
        };
      }

      let res;
      if (editingId) {
        res = await fetch(`/api/vouchers/${v_type}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/vouchers/${v_type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setMsg({ type: "success", text: `Voucher record ${editingId ? "updated" : "saved"} successfully!` });
        setShowModal(false);
        fetchData();
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save voucher" });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voucher record?")) return;
    const res = await fetch(`/api/vouchers/${v_type}/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg({ type: "success", text: "Voucher deleted successfully!" });
      fetchData();
      setTimeout(() => setMsg(null), 4000);
    } else {
      setMsg({ type: "error", text: "Failed to delete voucher" });
    }
  };

  // Filter logs
  const filtered = logs.filter((item) => {
    const itemDate = item.purchaseDate || item.voucherDate || "";
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    const vendor = (item.sellerName || item.supplier || item.supplierName || "").toLowerCase();
    const tag = (item.tagId || "").toLowerCase();
    const name = (item.feedName || item.medicineName || item.vaccineName || item.particularName || "").toLowerCase();
    const query = search.toLowerCase();

    return vendor.includes(query) || tag.includes(query) || name.includes(query);
  });

  const totalSum = filtered.reduce((acc, i) => {
    const val = i.price !== undefined ? i.price : i.cost !== undefined ? i.cost : i.amount !== undefined ? i.amount : 0;
    return acc + Number(val);
  }, 0);

  const titleMap: Record<string, string> = {
    feed: "Feed & Nutrition",
    medicine: "Crop Medicine & Protection",
    vaccine: "Biologics & Immunity",
    other: "Other Operational",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between glass-panel p-5 rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/vouchers"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">
              {titleMap[v_type] || v_type} Voucher Register
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Voucher
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {msg.text}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor, tag, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1 bg-slate-50 border border-slate-300 rounded text-slate-800 text-xs font-medium"
            />
          </div>

          {(startDate || endDate || search) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); setSearch(""); }}
              className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              {v_type === "goat" && (
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Seller Name</th>
                  <th className="p-3.5">Bill No</th>
                  <th className="p-3.5">Tag ID</th>
                  <th className="p-3.5">Breed</th>
                  <th className="p-3.5">Gender</th>
                  <th className="p-3.5">Weight</th>
                  <th className="p-3.5">Price (₹)</th>
                  <th className="p-3.5">Ledger</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              )}
              {v_type === "feed" && (
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5">Bill No</th>
                  <th className="p-3.5">Feed Description</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Unit</th>
                  <th className="p-3.5">Cost (₹)</th>
                  <th className="p-3.5">Ledger</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              )}
              {v_type === "medicine" && (
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5">Bill No</th>
                  <th className="p-3.5">Medicine Name</th>
                  <th className="p-3.5">Qty / Dose</th>
                  <th className="p-3.5">Cost (₹)</th>
                  <th className="p-3.5">Ledger</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              )}
              {v_type === "vaccine" && (
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5">Bill No</th>
                  <th className="p-3.5">Vaccine Name</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Cost (₹)</th>
                  <th className="p-3.5">Ledger</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              )}
              {v_type === "other" && (
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Supplier / Payee</th>
                  <th className="p-3.5">Bill No</th>
                  <th className="p-3.5">Particular</th>
                  <th className="p-3.5">Qty</th>
                  <th className="p-3.5">Amount (₹)</th>
                  <th className="p-3.5">Ledger</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500 font-medium">Loading register data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 font-medium">No voucher records found matching filter.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-medium text-slate-700">{item.purchaseDate || item.voucherDate}</td>
                    <td className="p-3.5 font-bold text-slate-900">{item.sellerName || item.supplier || item.supplierName}</td>
                    <td className="p-3.5 text-slate-500 font-mono">{item.billNo || "-"}</td>

                    {v_type === "goat" && (
                      <>
                        <td className="p-3.5 font-mono font-bold text-emerald-800">{item.tagId}</td>
                        <td className="p-3.5 text-slate-700">{item.breed}</td>
                        <td className="p-3.5">{item.gender}</td>
                        <td className="p-3.5">{item.weight ? `${item.weight} kg` : "-"}</td>
                        <td className="p-3.5 font-bold text-emerald-900">₹{Number(item.price).toLocaleString()}</td>
                      </>
                    )}

                    {v_type === "feed" && (
                      <>
                        <td className="p-3.5 font-bold text-slate-800">{item.feedName}</td>
                        <td className="p-3.5 font-semibold text-slate-700">{item.quantity}</td>
                        <td className="p-3.5 text-slate-600">{item.unit}</td>
                        <td className="p-3.5 font-bold text-emerald-900">₹{Number(item.cost).toLocaleString()}</td>
                      </>
                    )}

                    {v_type === "medicine" && (
                      <>
                        <td className="p-3.5 font-bold text-slate-800">{item.medicineName}</td>
                        <td className="p-3.5 font-semibold text-slate-700">{item.quantity} {item.doseUnit}</td>
                        <td className="p-3.5 font-bold text-emerald-900">₹{Number(item.cost).toLocaleString()}</td>
                      </>
                    )}

                    {v_type === "vaccine" && (
                      <>
                        <td className="p-3.5 font-bold text-slate-800">{item.vaccineName}</td>
                        <td className="p-3.5 font-semibold text-slate-700">{item.quantity} vials</td>
                        <td className="p-3.5 font-bold text-emerald-900">₹{Number(item.cost).toLocaleString()}</td>
                      </>
                    )}

                    {v_type === "other" && (
                      <>
                        <td className="p-3.5 font-bold text-slate-800">{item.particularName || item.notes || "Other Expense"}</td>
                        <td className="p-3.5 font-semibold text-slate-700">{item.quantity} {item.unitName}</td>
                        <td className="p-3.5 font-bold text-emerald-900">₹{Number(item.amount).toLocaleString()}</td>
                      </>
                    )}

                    <td className="p-3.5 font-semibold text-slate-600">{item.particularName || "Direct Expenses"}</td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Edit Voucher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Row */}
            {filtered.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={v_type === "goat" ? 7 : v_type === "feed" ? 6 : v_type === "medicine" ? 5 : v_type === "vaccine" ? 5 : 5} className="p-3.5 uppercase tracking-wider text-right">
                    Total Voucher Outflow:
                  </td>
                  <td className="p-3.5 text-emerald-900 text-sm font-extrabold">
                    ₹{totalSum.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Voucher Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Form Header */}
            <div className="bg-emerald-900 text-white p-4 -m-6 mb-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">ESTATE PWCW VOUCHER ENTRY</span>
                <h2 className="text-base font-bold capitalize">{v_type} Purchase Record</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Row 1: Universal details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Date of Purchase *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Vendor / Seller Name *</label>
                  <input
                    type="text"
                    required
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Seller / Supplier name"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Bill / Invoice No</label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="e.g. INV-8821"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Type-specific fields */}
              {v_type === "goat" && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Tag ID *</label>
                    <input
                      type="text"
                      required
                      readOnly={!!editingId}
                      value={tagId}
                      onChange={(e) => setTagId(e.target.value)}
                      className={`w-full p-2 border rounded-lg font-mono font-bold ${editingId ? "bg-slate-100 text-slate-600" : "bg-white border-emerald-300 text-emerald-900"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Breed</label>
                    <input
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="Tellicherry, Boer, Sirohi"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    >
                      <option value="Female">Female (Doe)</option>
                      <option value="Male">Male (Buck)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-900"
                    />
                  </div>
                </div>
              )}

              {v_type === "feed" && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Feed Item Name *</label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Maize Silage, Concentrate Mash"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Quantity & Unit *</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.unitSymbol}>{u.unitSymbol}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Total Cost (₹) *</label>
                    <input
                      type="number"
                      required
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}

              {v_type === "medicine" && (
                <div className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Albendazole, Oxytetracycline"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Qty & Dose Unit *</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                      <input
                        type="text"
                        value={doseUnit}
                        onChange={(e) => setDoseUnit(e.target.value)}
                        placeholder="vials/L"
                        className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Cost (₹) *</label>
                    <input
                      type="number"
                      required
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}

              {v_type === "vaccine" && (
                <div className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Vaccine Name *</label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="ET Vaccine, PPR Vaccine"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Quantity (vials) *</label>
                    <input
                      type="number"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Cost (₹) *</label>
                    <input
                      type="number"
                      required
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}

              {v_type === "other" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Quantity & Unit</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.unitSymbol}>{u.unitSymbol}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Row 3: Accounting Ledgers & PnL Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Ledger Account *</label>
                  <select
                    value={ledgerId}
                    onChange={(e) => handleLedgerChange(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    {ledgers.map((l) => (
                      <option key={l.id} value={l.id}>{l.ledgerName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">Ledger Group (Auto)</label>
                  <input
                    type="text"
                    readOnly
                    value={ledgerGroupText}
                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">P&L Category *</label>
                  <select
                    value={pnlCategory}
                    onChange={(e) => setPnlCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    <option value="Purchase">Purchase (Trading Debit)</option>
                    <option value="Direct Expenses">Direct Expenses</option>
                    <option value="Indirect Expenses">Indirect Expenses</option>
                    <option value="Administrative Expenses">Administrative Expenses</option>
                  </select>
                </div>
              </div>



              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
