"use client";

import type { MasterDailySheetState } from "@/components/daily-log/master-sheet/use-master-daily-sheet";
import {
  CheckCircle2,
  ExternalLink,
  X
} from "lucide-react";
import Link from "next/link";

type Props = Pick<MasterDailySheetState,
  "dispatchResult" |
  "setDispatchResult"
>;

export function DispatchResult({
  dispatchResult,
  setDispatchResult,
}: Props) {
  return (
    dispatchResult && (
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-900 text-white shadow-xl border border-emerald-700/60 space-y-3 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2.5 border-b border-emerald-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Daily Sheet Successfully Dispatched!</h4>
              <p className="text-[11px] text-emerald-200">{dispatchResult.message}</p>
            </div>
          </div>
          <button
            onClick={() => setDispatchResult(null)}
            className="p-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-xs">
          {dispatchResult.dispatched?.activity && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
              <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                <span>Work Activity</span>
                <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200">
                  {dispatchResult.dispatched.activity.status}
                </span>
              </div>
              <div className="text-white mt-0.5 font-semibold text-xs">{dispatchResult.dispatched.activity.activityType}</div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">Routed to Daily Work Log</div>
            </div>
          )}

          {dispatchResult.dispatched?.labor && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
              <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                <span>Labor & Wages</span>
                <Link href="/workers" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                  View in HR <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="text-white mt-0.5 font-semibold text-xs">
                {dispatchResult.dispatched.labor.menCount} Men + {dispatchResult.dispatched.labor.womenCount} Women
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                Payout: ₹{dispatchResult.dispatched.labor.totalCost?.toLocaleString()}
              </div>
            </div>
          )}

          {dispatchResult.dispatched?.fertilizer && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
              <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                <span>Fertilizer Applied</span>
                <Link href="/fertilizer" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                  View in Fertilizer <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="text-white mt-0.5 font-semibold text-xs">{dispatchResult.dispatched.fertilizer.fertilizerName}</div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                {dispatchResult.dispatched.fertilizer.quantityKg} kg • ₹{dispatchResult.dispatched.fertilizer.cost}
              </div>
            </div>
          )}

          {dispatchResult.dispatched?.diesel && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
              <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                <span>Fuel Dispense</span>
                <Link href="/diesel" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                  View in Diesel <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="text-white mt-0.5 font-semibold text-xs">
                {dispatchResult.dispatched.diesel.quantityLiters} Liters
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">Cost: ₹{dispatchResult.dispatched.diesel.cost}</div>
            </div>
          )}

          {dispatchResult.dispatched?.machinery && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
              <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                <span>Machinery Operating</span>
                <Link href="/machinery" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                  View in Fleet <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="text-white mt-0.5 font-semibold text-xs">{dispatchResult.dispatched.machinery.machineName}</div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                {dispatchResult.dispatched.machinery.runningHours} running hours
              </div>
            </div>
          )}

          {dispatchResult.dispatched?.sales && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
              <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                <span>Crop Harvest Sale</span>
                <Link href="/sales" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                  View in Sales <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="text-white mt-0.5 font-semibold text-xs">
                {dispatchResult.dispatched.sales.cropName} ({dispatchResult.dispatched.sales.quantityKg} kg)
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                Revenue: ₹{dispatchResult.dispatched.sales.value?.toLocaleString()}
              </div>
            </div>
          )}

          {dispatchResult.dispatched?.purchase && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40">
              <div className="font-bold text-emerald-300 flex items-center justify-between text-[11px]">
                <span>Purchase Voucher</span>
                <Link href="/purchases" className="text-[10px] underline text-emerald-200 flex items-center gap-0.5">
                  View in Purchases <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="text-white mt-0.5 font-semibold text-xs">{dispatchResult.dispatched.purchase.description}</div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                Amount: ₹{dispatchResult.dispatched.purchase.cost?.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
}
