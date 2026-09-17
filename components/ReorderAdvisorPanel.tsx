"use client";

import React, { useMemo } from "react";
import { Facility, Drug, FacilityInventory } from "@/lib/db/schema";
import {
  computeReorderAdvice,
  getNearbyFacilityStocks,
  NEARBY_RADIUS_KM,
} from "@/lib/stockInsights";
import {
  CalendarClock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  Zap,
} from "lucide-react";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface ReorderAdvisorPanelProps {
  facility: Facility;
  inventory: FacilityInventory;
  drug: Drug | undefined;
  facilities: Facility[];
  inventories: FacilityInventory[];
}

export function ReorderAdvisorPanel({
  facility,
  inventory,
  drug,
  facilities,
  inventories,
}: ReorderAdvisorPanelProps) {
  const advice = useMemo(
    () => computeReorderAdvice(inventory, drug),
    [inventory, drug]
  );

  const nearbyStocks = useMemo(() => {
    if (!drug) return [];
    return getNearbyFacilityStocks(facility, facilities, inventories, drug.id);
  }, [facility, facilities, inventories, drug]);

  const nearbyCoverByFacility = useMemo(() => {
    const map = new Map<string, number>();
    if (!drug) return map;
    for (const i of inventories) {
      if (i.facilityId !== facility.id && i.drugId === drug.id && i.daysCover >= 0) {
        map.set(i.facilityId, i.daysCover);
      }
    }
    return map;
  }, [facility.id, inventories, drug]);

  const nearbyTotal = nearbyStocks.reduce((sum, n) => sum + n.currentStock, 0);
  const stockoutsNearby = nearbyStocks.filter((n) => n.currentStock <= 0).length;

  const unit = drug?.unit || "units";

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Callout: What to do */}
      <div
        className={`rounded-xl border p-4 ${
          advice.isUrgent
            ? "bg-rose-950/40 border-rose-800/60"
            : "bg-emerald-950/30 border-emerald-800/50"
        }`}
      >
        <div className="flex items-start gap-3">
          {advice.isUrgent ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${
                advice.isUrgent ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {advice.isUrgent
                ? "URGENT — Order Now"
                : "Recommended Next Stock Order"}
            </span>
            <p className="text-sm font-bold text-white mt-1 font-mono leading-snug">
              {advice.isUrgent
                ? `Place the order TODAY — stock of ${drug?.name || "this medicine"} will dip below safety level within ${advice.daysUntilSafetyStock <= 0 ? "0" : advice.daysUntilSafetyStock} days.`
                : `Order ${drug?.name || "this medicine"} by ${formatDate(
                    advice.recommendedOrderDate
                  )} (in ${advice.orderByInDays} days).`}
            </p>
            <p className="text-xs text-neutral-300 mt-1 font-sans">
              Suggested order:{" "}
              <span className="font-bold text-white">
                {advice.suggestedOrderQty} {unit}
              </span>{" "}
              — ordered now it arrives before stock hits the safety buffer, with
              a 2-day buffer for the recommended order date.
            </p>
          </div>
        </div>
      </div>

      {/* Reorder Math Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
            Order By
          </div>
          <div
            className={`text-sm font-bold font-mono mt-1.5 ${
              advice.isUrgent ? "text-rose-400" : "text-white"
            }`}
          >
            {advice.isUrgent ? "TODAY" : formatDate(advice.recommendedOrderDate)}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
            {advice.isUrgent ? "immediate" : `T+${advice.orderByInDays}d`}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Days of Cover
          </div>
          <div
            className={`text-sm font-bold font-mono mt-1.5 ${
              advice.daysCover <= 5.5
                ? "text-rose-400"
                : advice.daysCover <= 14
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {advice.daysCover} days
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
            {advice.leadTimeDays}d lead time
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            <Package className="w-3.5 h-3.5 text-sky-400" />
            To Safety Stock
          </div>
          <div
            className={`text-sm font-bold font-mono mt-1.5 ${
              advice.belowSafetyStock ? "text-rose-400" : "text-white"
            }`}
          >
            {advice.belowSafetyStock ? "BELOW" : `${advice.daysUntilSafetyStock} days`}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
            Safety stock: {inventory.safetyStock} {unit}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
            <Truck className="w-3.5 h-3.5 text-violet-400" />
            Suggested Qty
          </div>
          <div className="text-sm font-bold font-mono mt-1.5 text-white">
            {advice.suggestedOrderQty} {unit}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
            +2-day buffer included
          </div>
        </div>
      </div>

      {/* Nearby Stock (< 10km) */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Stock in Hospitals &lt; {NEARBY_RADIUS_KM} km
            </h3>
          </div>
          {nearbyStocks.length > 0 && (
            <span className="text-[11px] font-mono text-neutral-300">
              <strong className="text-white">{nearbyTotal} {unit}</strong>{" "}
              available nearby
            </span>
          )}
        </div>

        {nearbyStocks.length === 0 ? (
          <p className="text-xs text-neutral-500 font-mono py-3 text-center">
            No hospitals within {NEARBY_RADIUS_KM} km stock this medicine — relied
            on your own pipeline.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-[#161616]">
              {nearbyStocks.map((n) => {
                const ownCover = nearbyCoverByFacility.get(n.facility.id);
                const riskColor =
                  n.currentStock <= 0
                    ? "text-rose-400"
                    : ownCover === undefined
                    ? "text-amber-400"
                    : ownCover <= 5.5
                    ? "text-rose-400"
                    : ownCover <= 14
                    ? "text-amber-400"
                    : "text-emerald-400";
                return (
                  <li
                    key={n.facility.id}
                    className="flex items-center justify-between py-2 text-xs font-mono"
                  >
                    <div className="min-w-0">
                      <span className="text-neutral-200 font-semibold truncate block">
                        {n.facility.name}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {n.distanceKm} km away
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-bold ${riskColor}`}>
                        {n.currentStock} {unit}
                      </span>
                      {n.currentStock <= 0 && (
                        <span className="block text-[10px] text-rose-500">
                          stocked out
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {stockoutsNearby > 0 && (
              <p className="text-[11px] text-amber-400/90 font-mono mt-2 pt-2 border-t border-[#161616]">
                {stockoutsNearby} nearby hospital(s) have zero stock — they may
                draw on yours. Plan extra buffer.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}