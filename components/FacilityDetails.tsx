"use client";

import React from "react";
import { FacilitySimulationState } from "@/lib/simulation";
import { Drug } from "@/lib/db/schema";
import { Building2, Pill, Package, Flame, Clock, TrendingUp, AlertTriangle, CheckCircle, HelpCircle, XCircle, Truck } from "lucide-react";

interface FacilityDetailsProps {
  selectedState: FacilitySimulationState | null;
  selectedDrug: Drug | undefined;
  simDay: number;
}

export function FacilityDetails({ selectedState, selectedDrug, simDay }: FacilityDetailsProps) {
  if (!selectedState) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-800 rounded h-full text-slate-500 font-mono text-xs">
        <Building2 className="w-8 h-8 mb-2 text-slate-600" />
        <span>Select a facility from the map or alert panel to view operational details</span>
      </div>
    );
  }

  const { facility, inventory, currentStockAtDay, effectiveDaysCover, dynamicRiskStatus, dynamicRiskProbability, divertedDemandReceived } = selectedState;

  // Status-specific styling
  const statusTheme = {
    critical: {
      border: "border-rose-800",
      bg: "bg-rose-950/40",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      title: "text-rose-400",
      icon: XCircle,
      label: "CRITICAL RISK",
    },
    warning: {
      border: "border-amber-800",
      bg: "bg-amber-950/40",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      title: "text-amber-400",
      icon: AlertTriangle,
      label: "WARNING ELEVATED",
    },
    low: {
      border: "border-emerald-800",
      bg: "bg-emerald-950/30",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      title: "text-emerald-400",
      icon: CheckCircle,
      label: "HEALTHY BUFFER",
    },
    insufficient_data: {
      border: "border-slate-800",
      bg: "bg-slate-900/40",
      badge: "bg-slate-700 text-slate-300 border-slate-600",
      title: "text-slate-400",
      icon: HelpCircle,
      label: "NO TELEMETRY",
    },
  }[dynamicRiskStatus];

  const StatusIcon = statusTheme.icon;

  return (
    <div className={`flex flex-col bg-slate-950 border ${statusTheme.border} rounded overflow-hidden font-mono text-xs`}>
      {/* Top Header Card */}
      <div className={`p-3.5 ${statusTheme.bg} border-b ${statusTheme.border} flex items-start justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm tracking-tight">{facility.name}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-medium">
              {facility.code}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span>{facility.facilityType}</span>
            <span>&bull;</span>
            <span>{facility.tier} Tier</span>
            <span>&bull;</span>
            <span>{facility.district} District</span>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="flex flex-col items-end shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border ${statusTheme.badge}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusTheme.label}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            Sim Day T+{simDay}
          </span>
        </div>
      </div>

      {/* Selected Drug & Key Metrics Grid */}
      <div className="p-3.5 space-y-3.5">
        {/* Drug Context Banner */}
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded px-3 py-2">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-sky-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Formulation:</span>
              <span className="font-bold text-white text-xs">{selectedDrug?.name || "Selected Drug"}</span>
            </div>
          </div>
          <div className="text-right text-[11px]">
            <span className="text-slate-400">Category: </span>
            <span className="text-slate-200">{selectedDrug?.category || "Essential"}</span>
          </div>
        </div>

        {/* 2x2 Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Current Inventory */}
          <div className="bg-slate-900 border border-slate-800/80 rounded p-2.5">
            <span className="text-slate-400 text-[10px] uppercase block">Current Inventory</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-white">{currentStockAtDay.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">{selectedDrug?.unit}</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5">
              Baseline: {inventory.currentStock} {selectedDrug?.unit}
            </span>
          </div>

          {/* Average Daily Consumption */}
          <div className="bg-slate-900 border border-slate-800/80 rounded p-2.5">
            <span className="text-slate-400 text-[10px] uppercase block">Daily Consumption</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-white">
                {(inventory.avgDailyConsumption + divertedDemandReceived).toFixed(0)}
              </span>
              <span className="text-[10px] text-slate-400">{selectedDrug?.unit}/d</span>
            </div>
            {divertedDemandReceived > 0 ? (
              <span className="text-[9px] text-rose-400 block mt-0.5">
                +{divertedDemandReceived} diverted from cascade!
              </span>
            ) : (
              <span className="text-[9px] text-slate-500 block mt-0.5">Normal baseline rate</span>
            )}
          </div>

          {/* Days Cover */}
          <div className="bg-slate-900 border border-slate-800/80 rounded p-2.5">
            <span className="text-slate-400 text-[10px] uppercase block">Days Cover</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-lg font-bold ${
                  effectiveDaysCover <= 5
                    ? "text-rose-400"
                    : effectiveDaysCover <= 10
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {selectedState.isStockedOutNow ? "0.0" : effectiveDaysCover}
              </span>
              <span className="text-[10px] text-slate-400">days</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5">
              Safety threshold: {selectedDrug?.safetyStockDays || 10}d
            </span>
          </div>

          {/* Stockout Probability */}
          <div className="bg-slate-900 border border-slate-800/80 rounded p-2.5">
            <span className="text-slate-400 text-[10px] uppercase block">Stockout Probability</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-lg font-bold ${
                  dynamicRiskProbability >= 0.7
                    ? "text-rose-400"
                    : dynamicRiskProbability >= 0.4
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {Math.round(dynamicRiskProbability * 100)}%
              </span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-0.5">
              Based on buffer & pipeline
            </span>
          </div>
        </div>

        {/* Replenishment Pipeline Details */}
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Replenishment Status:</span>
              <span
                className={`font-bold ${
                  inventory.replenishmentStatus.toLowerCase().includes("delay")
                    ? "text-rose-400"
                    : "text-slate-200"
                }`}
              >
                {inventory.replenishmentStatus}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] block">Pipeline Inbound:</span>
            <span className="font-bold text-white">
              {inventory.pipelineUnits} {selectedDrug?.unit}
              {inventory.nextDeliveryDays !== null ? ` &bull; ETA Day ${inventory.nextDeliveryDays}` : ""}
            </span>
          </div>
        </div>

        {/* Risk Drivers Diagnostic Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded p-3">
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Operational Risk Drivers</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">{inventory.riskDriver}</p>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Bed Capacity: {facility.bedCapacity} beds</span>
            <span>Catchment Population: {facility.catchmentPopulation.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
