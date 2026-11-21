"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage as getErrorMessage } from "@/lib/errors";
import type { VoucherView } from "@/types/api";
import { ExpenseLedgerItem, LedgerGroupItem } from "@/lib/accounting-data";
import { ExpenseUnit } from "@/lib/vouchers-data";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCard } from "@/components/ui/content-card";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  Layers,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldAlert,
  Trash2,

} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function VoucherRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const v_type =
    (params.v_type as string) === "goat"
      ? "feed"
      : (params.v_type as string) || "feed";

  const [logs, setLogs] = useState<VoucherView[]>([]);
  const [ledgers, setLedgers] = useState<ExpenseLedgerItem[]>([]);
  const [, setGroups] = useState<LedgerGroupItem[]>([]);
  const [units, setUnits] = useState<ExpenseUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Universal Form Fields
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [billDate, setBillDate] = useState("");
  const [billNo, setBillNo] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [ledgerId, setLedgerId] = useState("");
  const [ledgerGroupText, setLedgerGroupText] = useState("");
  const [pnlCategory, setPnlCategory] = useState(
    v_type === "other" ? "Direct Expenses" : "Purchase"
  );
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

  const fetchData = useCallback(async () => {
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
  }, [ledgerId, v_type]);

  useEffect(() => {
    let dispose: void | (() => void);
    const pending = setTimeout(() => {
      dispose = (() => {
        if (params.v_type === "other") {
          router.replace("/purchases/other");
          return;
        }
        fetchData();
      })();
    }, 0);
    return () => {
      clearTimeout(pending);
      if (typeof dispose === "function") dispose();
    };
  }, [v_type, params.v_type, router, fetchData]);

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

  const openEdit = (item: VoucherView) => {
    setEditingId(item.id);
    setPurchaseDate(item.purchaseDate || item.voucherDate || "");
    setBillDate(item.billDate || "");
    setBillNo(item.billNo || "");
    setSellerName(item.sellerName || item.supplier || item.supplierName || "");
    setNotes(item.notes || "");
    setLedgerId(item.ledgerId || (ledgers[0]?.id || ""));
    setPnlCategory(
      item.pnlCategory || (v_type === "other" ? "Direct Expenses" : "Purchase")
    );

    const matchedLedger = ledgers.find((l) => l.id === item.ledgerId);
    setLedgerGroupText(matchedLedger?.groupName || "Direct Expenses");

    if (v_type === "goat") {
      setTagId(item.tagId || "");
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
      let payload: Omit<VoucherView, "id"> = {
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
        setMsg({
          type: "success",
          text: `Voucher record ${editingId ? "updated" : "saved"} successfully!`,
        });
        setShowModal(false);
        fetchData();
        setTimeout(() => setMsg(null), 4000);
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save voucher" });
      }
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voucher record?")) return;
    const res = await fetch(`/api/vouchers/${v_type}/${id}`, {
      method: "DELETE",
    });
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

    const vendor = (
      item.sellerName ||
      item.supplier ||
      item.supplierName ||
      ""
    ).toLowerCase();
    const tag = (item.tagId || "").toLowerCase();
    const name = (
      item.feedName ||
      item.medicineName ||
      item.vaccineName ||
      item.particularName ||
      ""
    ).toLowerCase();
    const query = search.toLowerCase();

    return vendor.includes(query) || tag.includes(query) || name.includes(query);
  });

  const totalSum = filtered.reduce((acc, i) => {
    const val =
      i.price !== undefined
        ? i.price
        : i.cost !== undefined
          ? i.cost
          : i.amount !== undefined
            ? i.amount
            : 0;
    return acc + Number(val);
  }, 0);

  const titleMap: Record<string, string> = {
    feed: "Feed & Nutrition",
    medicine: "Crop Medicine & Protection",
    vaccine: "Biologics & Immunity",
    other: "Other Operational",
  };

  return (
    <PageContainer>
      {/* Header Bar */}
      <PageHeader
        title={`${titleMap[v_type] || v_type} Voucher Register`}
        breadcrumbs={[
          { label: "Purchases & Expenses", href: "/purchases" },
          { label: `${titleMap[v_type] || v_type} Register` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/purchases"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Purchases
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Voucher
            </button>
          </div>
        }
      />

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${msg.type === "success"
            ? "bg-[#EAF3EE] text-[#174D3C] border-[#174D3C]/20"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#174D3C]" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          )}
          {msg.text}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Category Outflow"
          value={`₹${totalSum.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-[#174D3C]" />}
        />
        <StatCard
          title="Total Vouchers"
          value={`${filtered.length}`}
          icon={<Receipt className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Configured Ledgers"
          value={`${ledgers.length}`}
          icon={<Layers className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Table */}
      <ContentCard
        title={`${titleMap[v_type] || v_type} Transactions`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor, tag, or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-[#174D3C]"
              />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-[#174D3C]"
              />
            </div>

            {(startDate || endDate || search) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSearch("");
                }}
                className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 ml-1"
              >
                Reset
              </button>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold uppercase tracking-wider">
                {v_type === "goat" && (
                  <>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Seller Name</th>
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Tag ID</th>
                    <th className="py-3 px-4">Breed</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Weight</th>
                    <th className="py-3 px-4 text-right">Price (₹)</th>
                    <th className="py-3 px-4">Ledger</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </>
                )}
                {v_type === "feed" && (
                  <>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Feed Description</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-right">Cost (₹)</th>
                    <th className="py-3 px-4">Ledger</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </>
                )}
                {v_type === "medicine" && (
                  <>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Medicine Name</th>
                    <th className="py-3 px-4">Qty / Dose</th>
                    <th className="py-3 px-4 text-right">Cost (₹)</th>
                    <th className="py-3 px-4">Ledger</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </>
                )}
                {v_type === "vaccine" && (
                  <>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Vaccine Name</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4 text-right">Cost (₹)</th>
                    <th className="py-3 px-4">Ledger</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </>
                )}
                {v_type === "other" && (
                  <>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier / Payee</th>
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Particular</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Ledger</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    Loading register data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    No voucher records found matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {item.purchaseDate || item.voucherDate}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.sellerName || item.supplier || item.supplierName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {item.billNo || "—"}
                    </td>

                    {v_type === "goat" && (
                      <>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#174D3C]">
                          {item.tagId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{item.breed}</td>
                        <td className="py-3.5 px-4">{item.gender}</td>
                        <td className="py-3.5 px-4">
                          {item.weight ? `${item.weight} kg` : "—"}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                          ₹{Number(item.price).toLocaleString()}
                        </td>
                      </>
                    )}

                    {v_type === "feed" && (
                      <>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {item.feedName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{item.unit}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                          ₹{Number(item.cost).toLocaleString()}
                        </td>
                      </>
                    )}

                    {v_type === "medicine" && (
                      <>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {item.medicineName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {item.quantity} {item.doseUnit}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                          ₹{Number(item.cost).toLocaleString()}
                        </td>
                      </>
                    )}

                    {v_type === "vaccine" && (
                      <>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {item.vaccineName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {item.quantity} vials
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                          ₹{Number(item.cost).toLocaleString()}
                        </td>
                      </>
                    )}

                    {v_type === "other" && (
                      <>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {item.particularName || item.notes || "Other Expense"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {item.quantity} {item.unitName}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                          ₹{Number(item.amount).toLocaleString()}
                        </td>
                      </>
                    )}

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {item.particularName || "Direct Expenses"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-[#174D3C] hover:bg-[#EAF3EE] rounded-lg transition-colors"
                          title="Edit Voucher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
              <tfoot className="bg-[#F8FAFC] font-semibold border-t border-slate-200 text-slate-900">
                <tr>
                  <td
                    colSpan={
                      v_type === "goat"
                        ? 7
                        : v_type === "feed"
                          ? 6
                          : v_type === "medicine"
                            ? 5
                            : v_type === "vaccine"
                              ? 5
                              : 5
                    }
                    className="py-3 px-4 uppercase tracking-wider text-right text-xs"
                  >
                    Total Voucher Outflow:
                  </td>
                  <td className="py-3 px-4 text-[#174D3C] text-sm font-mono font-bold text-right">
                    ₹{totalSum.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </ContentCard>

      {/* Voucher Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4">
            {/* Form Header */}
            <div className="bg-[#174D3C] text-white p-4 -m-6 mb-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#EAF3EE]">
                  ESTATE VOUCHER ENTRY
                </span>
                <h2 className="text-base font-bold capitalize">
                  {v_type} Purchase Record
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Date of Purchase *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Vendor / Seller Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Seller / Supplier name"
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Bill / Invoice No
                  </label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="e.g. INV-8821"
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg font-medium text-slate-900 font-mono focus:outline-none focus:border-[#174D3C]"
                  />
                </div>
              </div>

              {/* Row 2: Type-specific fields */}
              {v_type === "goat" && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Tag ID *
                    </label>
                    <input
                      type="text"
                      required
                      readOnly={!!editingId}
                      value={tagId}
                      onChange={(e) => setTagId(e.target.value)}
                      className={`w-full px-2.5 py-1.5 border rounded-lg font-mono font-bold ${editingId
                        ? "bg-slate-100 text-slate-600"
                        : "bg-white border-slate-200 text-[#174D3C]"
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Breed
                    </label>
                    <input
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="Tellicherry, Boer, Sirohi"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as typeof gender)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    >
                      <option value="Female">Female (Doe)</option>
                      <option value="Male">Male (Buck)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>
                </div>
              )}

              {v_type === "feed" && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Feed Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Maize Silage, Concentrate Mash"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Quantity & Unit *
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-1/2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-1/2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.unitSymbol}>
                            {u.unitSymbol}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Total Cost (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>
                </div>
              )}

              {v_type === "medicine" && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Albendazole, Oxytetracycline"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Qty & Dose Unit *
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-1/2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                      />
                      <input
                        type="text"
                        value={doseUnit}
                        onChange={(e) => setDoseUnit(e.target.value)}
                        placeholder="vials/L"
                        className="w-1/2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Cost (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>
                </div>
              )}

              {v_type === "vaccine" && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Vaccine Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="ET Vaccine, PPR Vaccine"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Quantity (vials) *
                    </label>
                    <input
                      type="number"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Cost (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-[#174D3C]"
                    />
                  </div>
                </div>
              )}

              {/* Row 3: Accounting Ledgers & PnL Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ledger Account *
                  </label>
                  <select
                    value={ledgerId}
                    onChange={(e) => handleLedgerChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                  >
                    {ledgers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.ledgerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ledger Group (Auto)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={ledgerGroupText}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-semibold mb-1">
                    P&L Category *
                  </label>
                  <select
                    value={pnlCategory}
                    onChange={(e) => setPnlCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-[#174D3C]"
                  >
                    <option value="Purchase">Purchase (Trading Debit)</option>
                    <option value="Direct Expenses">Direct Expenses</option>
                    <option value="Indirect Expenses">Indirect Expenses</option>
                    <option value="Administrative Expenses">
                      Administrative Expenses
                    </option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174D3C] hover:bg-[#103C30] text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
