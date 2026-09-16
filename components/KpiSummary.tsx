"use client";

import React from "react";
import { AlertOctagon, AlertTriangle, TrendingDown, PackageX, Clock, HelpCircle } from "lucide-react";

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
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Critical Facilities
          </span>
          <AlertOctagon className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl lg:text-4xl font-bold font-mono text-rose-500">
            {criticalFacilities}
          </span>
          <span className="text-xs text-rose-400 font-medium">
            {criticalFacilities > 0 ? "Immediate Action Required" : "Zero Critical"}
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono flex items-center gap-1.5">
          <span>&le; 5 days cover or zero stock at T+{simDay}</span>
        </div>
      </div>

      {/* 2. Facilities at Risk */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Facilities at Risk
          </span>
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl lg:text-4xl font-bold font-mono text-amber-400">
            {facilitiesAtRisk}
          </span>
          <span className="text-xs text-neutral-300 font-medium">
            Warning &bull; Escalating Strain
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono flex items-center gap-1.5">
          <span>Depletion buffer &le; 10 days</span>
        </div>
      </div>

      {/* 3. Expected Stockouts */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Expected Stockouts
          </span>
          <TrendingDown className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl lg:text-4xl font-bold font-mono text-white">
            {expectedStockouts}
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            Within {horizonDays}d Window
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono flex items-center gap-1.5">
          <span>Projected zero-crossing points</span>
        </div>
      </div>

      {/* 4. Unmet Demand */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Unmet Demand
          </span>
          <PackageX className="w-4 h-4 text-orange-400" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl lg:text-4xl font-bold font-mono text-orange-400">
            {unmetDemandUnits.toLocaleString()}
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            {unit}
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono flex items-center gap-1.5">
          <span>Cumulative patient prescription deficit</span>
        </div>
      </div>

      {/* 5. Average Days Cover */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#2e2e2e] transition-colors rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Average Days Cover
          </span>
          <Clock className="w-4 h-4 text-neutral-300" />
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className={`text-3xl lg:text-4xl font-bold font-mono ${averageDaysCover < 7 ? "text-amber-400" : "text-emerald-400"}`}>
            {averageDaysCover}
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            days reserve
          </span>
        </div>
        <div className="mt-2 text-xs text-neutral-500 font-mono flex items-center gap-1.5">
          <span>Mean regional inventory autonomy</span>
        </div>
      </div>
    </div>
  );
}
