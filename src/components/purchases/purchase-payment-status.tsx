import type { PurchaseVoucherItem } from "@/types/estate";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function PurchasePaymentStatus({ status }: { status: PurchaseVoucherItem["paymentStatus"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${status === "PAID" || !status
          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
          : status === "PENDING"
            ? "bg-amber-100 text-amber-800 border border-amber-200"
            : "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
        }`}
    >
      {status === "PENDING" ? (
        <Clock className="w-2.5 h-2.5" />
      ) : status === "PARTIAL" ? (
        <AlertCircle className="w-2.5 h-2.5" />
      ) : (
        <CheckCircle2 className="w-2.5 h-2.5" />
      )}
      {status || "PAID"}
    </span>
  );
}
