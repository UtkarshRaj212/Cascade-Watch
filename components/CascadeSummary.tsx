"use client";

import React from "react";
import { CascadeDetails } from "@/lib/simulation";
import { Drug } from "@/lib/db/schema";
import { Waves, ArrowRight, Layers } from "lucide-react";

interface CascadeSummaryProps {
  cascade: CascadeDetails;
  selectedDrug: Drug | undefined;
  simDay: number;
  onSelectFacility: (facilityId: string) => void;
}

export function CascadeSummary({
  cascade,
  selectedDrug,
  simDay,
  onSelectFacility,
}: CascadeSummaryProps) {
  const {
    primaryFacility,
    primaryStockoutDay,
    secondaryFacilitiesAffected,
    divertedDemandRate,
    totalDivertedUnits,
    cascadeWaveReached,
    expectedAdditionalStockouts,
  } = cascade;

  const isCascadeTriggered = primaryStockoutDay !== null && simDay >= primaryStockoutDay;

  return (
    <div className="flex flex-col bg-black border border-[#222222] rounded-xl overflow-hidden font-mono shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-[#222222] bg-[#0a0a0a] gap-3">
        <div className="flex items-center gap-3">
          <Waves className="w-5 h-5 text-neutral-300 shrink-0" />
          <div>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider block">
              Cascade Ripple &amp; Referral Spillover Analysis
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Inter-facility patient deflection &amp; downstream depletion metrics
            </p>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 ${isCascadeTriggered
              ? "bg-rose-950/70 text-rose-300 border-rose-700/80 shadow-sm"
              : "bg-[#141414] text-neutral-400 border-[#2b2b2b]"
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${isCascadeTriggered ? "bg-rose-500 animate-pulse" : "bg-neutral-500"}`} />
            {isCascadeTriggered ? "CASCADE IN ACTIVE DEFLECTION" : "CASCADE LATENT / PRE-DEFLECTION"}
          </span>
        </div>
      </div>

      {/* 5 Cascade Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 p-5 border-b border-[#1f1f1f] bg-[#050505]">
        {/* 1. Primary Facility */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between min-w-0">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Primary Epicenter</span>
          <div className="my-2.5">
            <span className="font-bold text-white text-sm block leading-snug break-words">
              {primaryFacility?.name || "None Identified"}
            </span>
            <span className="text-xs text-neutral-400 block mt-1 leading-snug">
              {primaryFacility ? `${primaryFacility.tier} • ${primaryFacility.district}` : "No hub selected"}
            </span>
          </div>
          <span className="text-xs text-rose-400 font-semibold block mt-auto">
            {primaryStockoutDay !== null ? `Stockout Day T+${primaryStockoutDay}` : "Buffer Stable"}
          </span>
        </div>

        {/* 2. Secondary Facilities Affected */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between min-w-0">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Secondary Facilities</span>
          <div className="my-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-amber-400">
              {secondaryFacilitiesAffected.length}
            </span>
            <span className="text-xs text-neutral-400">centers</span>
          </div>
          <span className="text-xs text-neutral-500 block mt-auto leading-tight">Direct referral recipients</span>
        </div>

        {/* 3. Diverted Demand */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between min-w-0">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Diverted Demand Rate</span>
          <div className="my-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl lg:text-3xl font-bold font-mono text-orange-400">
              +{divertedDemandRate}
            </span>
            <span className="text-xs text-neutral-400">{selectedDrug?.unit || "units"}/day</span>
          </div>
          <span className="text-xs text-neutral-500 block mt-auto leading-tight break-words">
            {totalDivertedUnits > 0 ? `${totalDivertedUnits} cumulative units redirected` : "Awaiting stockout threshold"}
          </span>
        </div>

        {/* 4. Cascade Wave Reached */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between min-w-0">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Cascade Wave Reached</span>
          <div className="my-2.5 flex items-start gap-1.5">
            <Layers className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span className="font-bold text-white text-sm leading-snug break-words">
              {cascadeWaveReached.split(" - ")[0]}
            </span>
          </div>
          <span className="text-xs text-neutral-400 block mt-auto leading-tight break-words">
            {cascadeWaveReached.split(" - ")[1] || "Baseline"}
          </span>
        </div>

        {/* 5. Expected Additional Stockouts */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3.5 flex flex-col justify-between min-w-0">
          <span className="text-neutral-400 text-xs uppercase block font-semibold">Additional Stockouts</span>
          <div className="my-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-2xl lg:text-3xl font-bold font-mono ${expectedAdditionalStockouts > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {expectedAdditionalStockouts}
            </span>
            <span className="text-xs text-neutral-400">secondary sites</span>
          </div>
          <span className="text-xs text-neutral-500 block mt-auto leading-tight break-words">
            Accelerated ripple depletion
          </span>
        </div>
      </div>

      {/* Connected Absorption Nodes & Propagation Logic */}
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-neutral-400 pb-1">
          <span className="uppercase tracking-wider font-bold text-white text-xs sm:text-sm">
            Connected Referral Recipients Absorbing Deflected Patients
          </span>
          <span className="text-neutral-500 font-mono text-[11px] sm:text-xs">
            Directly coupled to {primaryFacility?.name || "the focal epicenter"}
          </span>
        </div>

        {secondaryFacilitiesAffected.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] text-xs">
            No secondary referral redirection links registered for this focal center.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {secondaryFacilitiesAffected.map((fac) => (
              <div
                key={fac.id}
                onClick={() => onSelectFacility(fac.id)}
                className="p-4 bg-[#0a0a0a] hover:bg-[#111111] border border-[#1f1f1f] hover:border-neutral-500 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 group shadow-sm min-w-0"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug break-words">
                    {fac.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5 font-mono">
                    <span>{fac.facilityType}</span>
                    <span className="text-neutral-600">•</span>
                    <span>{fac.district}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end justify-center">
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold block whitespace-nowrap">
                    Absorption Node
                  </span>
                  <span className="text-xs text-neutral-400 flex items-center justify-end group-hover:text-white mt-1.5 whitespace-nowrap font-mono transition-colors">
                    Inspect <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
