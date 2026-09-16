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
}: KpiSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {/* 1. Critical Facilities */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Critical Facilities
          </span>
          <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl lg:text-4xl font-bold font-mono text-rose-500">
            {criticalFacilities}
          </span>
          <span className="text-xs text-rose-400 font-medium whitespace-nowrap">
            {criticalFacilities > 0 ? "Immediate Action" : "Zero Critical"}
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono">
          <span>&le; 5 days cover or zero stock at T+{simDay}</span>
        </div>
      </div>

      {/* 2. Facilities at Risk */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Facilities at Risk
          </span>
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl lg:text-4xl font-bold font-mono text-amber-400">
            {facilitiesAtRisk}
          </span>
          <span className="text-xs text-neutral-300 font-medium whitespace-nowrap">
            Warning Buffer
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono">
          <span>Depletion buffer &le; 10 days</span>
        </div>
      </div>

      {/* 3. Expected Stockouts */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Expected Stockouts
          </span>
          <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl lg:text-4xl font-bold font-mono text-white">
            {expectedStockouts}
          </span>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">
            in {horizonDays}d Window
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono">
          <span>Projected zero-crossing points</span>
        </div>
      </div>

      {/* 4. Unmet Demand */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Unmet Demand
          </span>
          <PackageX className="w-4 h-4 text-orange-400 shrink-0" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl lg:text-4xl font-bold font-mono text-orange-400">
            {formatNumber(unmetDemandUnits)}
          </span>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">
            {unit}
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono">
          <span>Cumulative patient prescription deficit</span>
        </div>
      </div>

      {/* 5. Average Days Cover */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
            Average Days Cover
          </span>
          <Clock className="w-4 h-4 text-neutral-300 shrink-0" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
          <span className={`text-3xl lg:text-4xl font-bold font-mono ${averageDaysCover < 7 ? "text-amber-400" : "text-emerald-400"}`}>
            {averageDaysCover}
          </span>
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">
            days reserve
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono">
          <span>Mean regional inventory autonomy</span>
        </div>
      </div>
    </div>
  );
}
