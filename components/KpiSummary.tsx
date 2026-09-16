"use client";

import React from "react";
import { AlertOctagon, AlertTriangle, TrendingDown, PackageX, Clock } from "lucide-react";

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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-950">
      {/* 1. Critical Facilities */}
      <div className="bg-slate-900 border border-slate-800 rounded p-3 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Critical Facilities
          </span>
          <AlertOctagon className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-rose-400">
            {criticalFacilities}
          </span>
          <span className="text-[11px] text-rose-300/80 font-medium">
            {criticalFacilities > 0 ? "Immediate Action" : "Zero Critical"}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-500 font-mono">
          ≤ 5 days cover or zero stock
        </div>
      </div>

      {/* 2. Facilities at Risk */}
      <div className="bg-slate-900 border border-slate-800 rounded p-3 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Facilities at Risk
          </span>
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-amber-400">
            {facilitiesAtRisk}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Warning + Critical
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-500 font-mono">
          Vulnerable to deflection / delay
        </div>
      </div>

      {/* 3. Expected Stockouts */}
      <div className="bg-slate-900 border border-slate-800 rounded p-3 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Expected Stockouts
          </span>
          <TrendingDown className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            {expectedStockouts}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            in {horizonDays}d window
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-500 font-mono">
          Sim day T+{simDay} state
        </div>
      </div>

      {/* 4. Unmet Demand */}
      <div className="bg-slate-900 border border-slate-800 rounded p-3 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Unmet Demand
          </span>
          <PackageX className="w-4 h-4 text-orange-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-orange-400">
            {unmetDemandUnits.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {unit}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-500 font-mono">
          Cumulative patient shortfall
        </div>
      </div>

      {/* 5. Average Days Cover */}
      <div className="bg-slate-900 border border-slate-800 rounded p-3 relative overflow-hidden flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Average Days Cover
          </span>
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${averageDaysCover < 7 ? "text-amber-400" : "text-emerald-400"}`}>
            {averageDaysCover}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            days
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-500 font-mono">
          District network buffer
        </div>
      </div>
    </div>
  );
}
