"use client";

import React from "react";
import { AlertOctagon, AlertTriangle, TrendingDown, PackageX, Clock } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface KpiSummaryProps {
  criticalFacilities: number;
  facilitiesAtRisk: number;
  expectedStockouts: number;
  unmetDemandUnits: number;
  averageDaysCover: number;
  unit: string;
  horizonDays: number;
  simDay: number;
  isVertical?: boolean;
}

export function KpiSummary({
  criticalFacilities,
  facilitiesAtRisk,
  expectedStockouts,
  unmetDemandUnits,
  averageDaysCover,
  unit,
  horizonDays,
  simDay,
  isVertical = false,
}: KpiSummaryProps) {
  const containerClass = isVertical
    ? "flex flex-col justify-between gap-1.5 xl:gap-2 h-full min-h-0"
    : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4";

  const cardClass = isVertical
    ? "bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl px-3.5 py-1.5 xl:py-2 flex-1 min-h-0 flex flex-col justify-between shadow-sm"
    : "bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm";

  return (
    <div className={containerClass}>
      {/* 1. Critical Facilities */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-[10px] xl:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Critical Facilities
          </span>
          <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        </div>
        <div className="my-0.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-xl xl:text-2xl font-bold font-mono text-rose-500">
            {criticalFacilities}
          </span>
          <span className="text-[11px] xl:text-xs text-rose-400 font-medium whitespace-nowrap">
            {criticalFacilities > 0 ? "Immediate Stockout Threat" : "Zero Critical"}
          </span>
        </div>
        <div className="text-[10px] xl:text-[11px] text-neutral-500 font-mono truncate">
          <span>&le; 5 days cover or zero stock at T+{simDay}</span>
        </div>
      </div>

      {/* 2. Facilities at Risk */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-[10px] xl:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Facilities at Risk
          </span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        </div>
        <div className="my-0.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-xl xl:text-2xl font-bold font-mono text-amber-400">
            {facilitiesAtRisk}
          </span>
          <span className="text-[11px] xl:text-xs text-neutral-300 font-medium whitespace-nowrap">
            Warning Buffer
          </span>
        </div>
        <div className="text-[10px] xl:text-[11px] text-neutral-500 font-mono truncate">
          <span>Depletion buffer &le; 10 days</span>
        </div>
      </div>

      {/* 3. Expected Stockouts */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-[10px] xl:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Expected Stockouts
          </span>
          <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        </div>
        <div className="my-0.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-xl xl:text-2xl font-bold font-mono text-white">
            {expectedStockouts}
          </span>
          <span className="text-[11px] xl:text-xs text-neutral-400 font-medium whitespace-nowrap">
            in {horizonDays}d Window
          </span>
        </div>
        <div className="text-[10px] xl:text-[11px] text-neutral-500 font-mono truncate">
          <span>Projected zero-crossing points</span>
        </div>
      </div>

      {/* 4. Unmet Demand */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-[10px] xl:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Unmet Demand
          </span>
          <PackageX className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        </div>
        <div className="my-0.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-xl xl:text-2xl font-bold font-mono text-orange-400">
            {formatNumber(unmetDemandUnits)}
          </span>
          <span className="text-[11px] xl:text-xs text-neutral-400 font-medium whitespace-nowrap">
            {unit}
          </span>
        </div>
        <div className="text-[10px] xl:text-[11px] text-neutral-500 font-mono truncate">
          <span>Cumulative patient prescription deficit</span>
        </div>
      </div>

      {/* 5. Average Days Cover */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-[10px] xl:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Average Days Cover
          </span>
          <Clock className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
        </div>
        <div className="my-0.5 flex items-baseline gap-2 flex-wrap">
          <span className={`text-xl xl:text-2xl font-bold font-mono ${averageDaysCover < 7 ? "text-amber-400" : "text-emerald-400"}`}>
            {averageDaysCover}
          </span>
          <span className="text-[11px] xl:text-xs text-neutral-400 font-medium whitespace-nowrap">
            days reserve
          </span>
        </div>
        <div className="text-[10px] xl:text-[11px] text-neutral-500 font-mono truncate">
          <span>Mean regional inventory autonomy</span>
        </div>
      </div>
    </div>
  );
}
