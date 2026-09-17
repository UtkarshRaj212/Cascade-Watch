"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/DashboardContext";
import { RedistributionPanel } from "@/components/RedistributionPanel";
import { computeRedistributionPlan } from "@/lib/redistribution";
import {
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  Truck,
  ShoppingCart,
  Package,
  Building2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from "lucide-react";

export default function RedistributePage() {
  const {
    simulationResult,
    inventories,
    referralLinks,
    selectedDrug,
    selectedDistrict,
    currentSimDay,
    horizonDays,
  } = useDashboard();

  const plan = useMemo(() => {
    if (!selectedDrug) return null;
    return computeRedistributionPlan({
      facilityStates: simulationResult.facilityStateList,
      inventories,
      referralLinks,
      drug: selectedDrug,
      district: selectedDistrict,
      currentSimDay,
    });
  }, [
    simulationResult,
    inventories,
    referralLinks,
    selectedDrug,
    selectedDistrict,
    currentSimDay,
  ]);

  if (!plan || !selectedDrug) {
    return (
      <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
        <p className="text-neutral-400 font-mono text-sm">
          Loading redistribution analysis...
        </p>
      </main>
    );
  }

  const coveragePct = Math.min(100, Math.round(plan.coverageRatio * 100));
  const coverageColor =
    coveragePct >= 100
      ? "text-emerald-400"
      : coveragePct >= 60
        ? "text-amber-400"
        : "text-rose-400";

  return (
    <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5 min-h-0">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222222]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-[#111111] hover:bg-[#1a1a1a] border border-[#262626] text-neutral-400 hover:text-white transition-colors"
            title="Back to Network Map"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
              <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                Redistribution &amp; Intervention Recommendations
              </h1>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Optimal stock transfers &amp; emergency procurement actions to
              prevent cascade failures.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] text-neutral-300">
            Drug:{" "}
            <span className="text-sky-400 font-semibold">
              {selectedDrug.name}
            </span>
          </span>
          <Link
            href="/alerts"
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] hover:border-[#383838] transition-colors"
          >
            <span>Risk Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Surplus Facilities */}
        <div className="p-3.5 rounded-xl bg-[#080808] border border-[#222222] space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Surplus Sites
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {plan.totalSurplusFacilities}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono block">
            Can donate stock
          </span>
        </div>

        {/* Deficit Facilities */}
        <div className="p-3.5 rounded-xl bg-[#080808] border border-[#222222] space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Deficit Sites
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-rose-400">
            {plan.totalDeficitFacilities}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono block">
            Need replenishment
          </span>
        </div>

        {/* Coverage Ratio */}
        <div className="p-3.5 rounded-xl bg-[#080808] border border-[#222222] space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Network Coverage
            </span>
            <BarChart3 className="w-4 h-4 text-sky-400" />
          </div>
          <span className={`text-2xl font-bold font-mono ${coverageColor}`}>
            {coveragePct}%
          </span>
          <span className="text-[10px] text-neutral-400 font-mono block">
            Deficit coverable internally
          </span>
        </div>

        {/* Transfer Actions */}
        <div className="p-3.5 rounded-xl bg-[#080808] border border-[#222222] space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Transfers
            </span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-white">
            {plan.summary.transfers}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono block">
            {plan.summary.totalUnitsRedistributed.toLocaleString()}{" "}
            {selectedDrug.unit}
          </span>
        </div>

        {/* Emergency Procurements */}
        <div className="p-3.5 rounded-xl bg-[#080808] border border-[#222222] space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Procurements
            </span>
            <ShoppingCart className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-amber-400">
            {plan.summary.procurements}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono block">
            External orders needed
          </span>
        </div>

        {/* Stabilized */}
        <div className="p-3.5 rounded-xl bg-[#080808] border border-[#222222] space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Stabilized
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {plan.summary.facilitiesStabilized}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono block">
            Fully covered by transfers
          </span>
        </div>
      </div>

      {/* Emergency Banner */}
      {plan.summary.emergencyActions > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-start gap-3">
          <Zap className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold font-mono text-rose-300 block">
              {plan.summary.emergencyActions} Emergency Action
              {plan.summary.emergencyActions > 1 ? "s" : ""} Required
            </span>
            <p className="text-[11px] font-mono text-neutral-300 mt-1 leading-relaxed">
              Facilities are either currently stocked out or will stock out
              within 72 hours. Immediate intervention is required to prevent
              patient care disruption and downstream cascade effects.
            </p>
          </div>
        </div>
      )}

      {/* Coverage Health Bar */}
      <div className="bg-[#080808] border border-[#222222] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Internal Redistribution Coverage
          </span>
          <span className={`text-xs font-mono font-bold ${coverageColor}`}>
            {plan.totalTransferableUnits.toLocaleString()} /{" "}
            {plan.totalDeficitUnits.toLocaleString()} {selectedDrug.unit}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#1a1a1a] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              coveragePct >= 100
                ? "bg-emerald-500"
                : coveragePct >= 60
                  ? "bg-amber-500"
                  : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(100, coveragePct)}%` }}
          />
        </div>
        <p className="text-[11px] font-mono text-neutral-400 mt-2">
          {coveragePct >= 100
            ? "Network has sufficient surplus to cover all deficit facilities through internal redistribution alone."
            : `Network surplus covers ${coveragePct}% of total deficit. Remaining ${Math.max(0, plan.totalDeficitUnits - plan.totalTransferableUnits).toLocaleString()} ${selectedDrug.unit} must be procured externally.`}
        </p>
      </div>

      {/* Action List */}
      <div className="bg-[#080808] border border-[#222222] rounded-xl p-5 shadow-lg flex-1 min-h-[400px] flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Prioritized Demand Facilities Queue ({plan.hospitalGroups.length} demand {plan.hospitalGroups.length === 1 ? "site" : "sites"} • {plan.actions.length} actions)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Generated{" "}
            {new Date(plan.generatedAt).toLocaleTimeString()} • Sim Day T+
            {currentSimDay}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <RedistributionPanel plan={plan} unit={selectedDrug.unit} />
        </div>
      </div>
    </main>
  );
}
