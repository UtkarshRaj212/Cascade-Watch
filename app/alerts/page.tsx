"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/DashboardContext";
import { RiskAlertPanel } from "@/components/RiskAlertPanel";
import {
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Filter,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Building2,
} from "lucide-react";

export default function AlertsPage() {
  const {
    simulationResult,
    selectedDrug,
    selectedFacilityId,
    setSelectedFacilityId,
    facilities,
  } = useDashboard();

  const [statusFilter, setStatusFilter] = useState<"all" | "critical" | "warning" | "low">("all");

  const facilityStates = simulationResult.facilityStateList;

  const counts = useMemo(() => {
    return {
      total: facilityStates.length,
      critical: facilityStates.filter((s) => s.dynamicRiskStatus === "critical").length,
      warning: facilityStates.filter((s) => s.dynamicRiskStatus === "warning").length,
      low: facilityStates.filter((s) => s.dynamicRiskStatus === "low").length,
      insufficient: facilityStates.filter((s) => s.dynamicRiskStatus === "insufficient_data").length,
    };
  }, [facilityStates]);

  const filteredStates = useMemo(() => {
    if (statusFilter === "all") return facilityStates;
    return facilityStates.filter((s) => s.dynamicRiskStatus === statusFilter);
  }, [facilityStates, statusFilter]);

  return (
    <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5 min-h-0">
      {/* Top Banner / Breadcrumb & Status */}
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
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                Ranked Facility Risk Alerts &amp; Triage Feed
              </h1>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Prioritized stockout hazard ranking based on current inventory, consumption spikes, and cascade spillover.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/facilities"
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] hover:border-[#383838] transition-colors"
          >
            <span>Facility Audit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards for Alert Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => setStatusFilter("all")}
          className={`p-3.5 rounded-xl text-left border transition-all ${
            statusFilter === "all"
              ? "bg-[#181818] border-white/40 shadow-md ring-1 ring-white/20"
              : "bg-[#080808] border-[#222222] hover:border-[#383838]"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">All Monitored</span>
            <Building2 className="w-4 h-4 text-neutral-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-white">{counts.total}</span>
          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">Total facilities</span>
        </button>

        <button
          onClick={() => setStatusFilter("critical")}
          className={`p-3.5 rounded-xl text-left border transition-all ${
            statusFilter === "critical"
              ? "bg-rose-950/60 border-rose-500 shadow-md ring-1 ring-rose-500/30"
              : "bg-[#080808] border-[#222222] hover:border-rose-800/60"
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Critical Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-bold font-mono text-rose-400">{counts.critical}</span>
          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">&le; 5 Days Cover / Imminent</span>
        </button>

        <button
          onClick={() => setStatusFilter("warning")}
          className={`p-3.5 rounded-xl text-left border transition-all ${
            statusFilter === "warning"
              ? "bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500/30"
              : "bg-[#080808] border-[#222222] hover:border-amber-800/60"
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Warning Buffer</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-amber-400">{counts.warning}</span>
          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">&le; 10 Days Cover</span>
        </button>

        <button
          onClick={() => setStatusFilter("low")}
          className={`p-3.5 rounded-xl text-left border transition-all ${
            statusFilter === "low"
              ? "bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
              : "bg-[#080808] border-[#222222] hover:border-emerald-800/60"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Stable Buffer</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400">{counts.low}</span>
          <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">Healthy safety reserves</span>
        </button>
      </div>

      {/* Main Alerts Feed Grid */}
      <div className="bg-[#080808] border border-[#222222] rounded-xl p-5 shadow-lg flex-1 min-h-[460px] flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Filtered Priority Queue ({filteredStates.length} items)
            </span>
          </div>

          <div className="text-xs font-mono text-neutral-400">
            Target Formulation: <span className="text-white font-semibold">{selectedDrug?.name}</span>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <RiskAlertPanel
            facilityStates={filteredStates}
            selectedDrug={selectedDrug}
            selectedFacilityId={selectedFacilityId}
            onSelectFacility={(id) => setSelectedFacilityId(id)}
          />
        </div>
      </div>
    </main>
  );
}
