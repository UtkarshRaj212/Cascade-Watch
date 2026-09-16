"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/DashboardContext";
import { CascadeTimeline } from "@/components/CascadeTimeline";
import { CascadeSummary } from "@/components/CascadeSummary";
import {
  Waves,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Building2,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowLeft,
  Activity,
} from "lucide-react";

export default function CascadePage() {
  const {
    simulationResult,
    selectedDrug,
    currentSimDay,
    setCurrentSimDay,
    horizonDays,
    isPlaying,
    setIsPlaying,
    currentSelectedState,
    setSelectedFacilityId,
  } = useDashboard();

  const cascade = simulationResult.cascade;

  // Auto-play animation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSimDay((prev) => {
          if (prev >= horizonDays) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 750);
    }
    return () => clearInterval(interval);
  }, [isPlaying, horizonDays, setCurrentSimDay, setIsPlaying]);

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
              <Waves className="w-5 h-5 text-rose-400" />
              <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                Cascade Propagation &amp; Referral Spillover Simulation
              </h1>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Simulating patient redirection ripples and secondary buffer depletion across referral networks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] text-neutral-300">
            Active Wave: <span className="text-rose-400 font-semibold">{cascade.cascadeWaveReached}</span>
          </span>
          <Link
            href="/trajectory"
            className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#222222] hover:border-[#383838] transition-colors"
          >
            <span>View Trajectory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Simulation Timeline Bar */}
      <div className="bg-[#080808] border border-[#222222] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Interactive Simulation Scrubber (Day 0 to Day {horizonDays})</span>
          </div>
          <span className="text-xs font-mono text-neutral-300 font-bold bg-[#141414] px-2.5 py-1 rounded border border-[#262626]">
            Current Time: T+{currentSimDay} Days
          </span>
        </div>

        <CascadeTimeline
          simDay={currentSimDay}
          horizonDays={horizonDays}
          onSelectSimDay={setCurrentSimDay}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          primaryStockoutDay={cascade.primaryStockoutDay}
          replenishmentDeliveryDay={currentSelectedState?.inventory.nextDeliveryDays || null}
        />
      </div>

      {/* Grid: Cascade Summary & Simulation Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Cascade Summary Details (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <CascadeSummary
            cascade={cascade}
            selectedDrug={selectedDrug}
            simDay={currentSimDay}
            onSelectFacility={(id) => setSelectedFacilityId(id)}
          />
        </div>

        {/* Right: Cascade Ripple Metrics & Quick Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Key Cascade Stats */}
          <div className="bg-[#080808] border border-[#222222] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1c1c1c]">
              <Layers className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Cascade Ripple Quantitative Impact
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-[#0e0e0e] border border-[#1f1f1f]">
                <span className="text-[11px] font-mono text-neutral-400 block mb-1">
                  Primary Stockout Day
                </span>
                <span className="text-xl font-bold font-mono text-rose-400">
                  {cascade.primaryStockoutDay !== null ? `Day ${cascade.primaryStockoutDay}` : "No Stockout"}
                </span>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {cascade.primaryFacility?.name || "Target Facility"}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e0e0e] border border-[#1f1f1f]">
                <span className="text-[11px] font-mono text-neutral-400 block mb-1">
                  Deflected Demand Rate
                </span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  +{cascade.divertedDemandRate} {selectedDrug?.unit || "units"}/day
                </span>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Displaced to secondary facilities
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e0e0e] border border-[#1f1f1f]">
                <span className="text-[11px] font-mono text-neutral-400 block mb-1">
                  Cumulative Diverted Units
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {cascade.totalDivertedUnits} {selectedDrug?.unit || "units"}
                </span>
                <p className="text-[10px] text-neutral-400 mt-1">
                  As of simulation Day T+{currentSimDay}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e0e0e] border border-[#1f1f1f]">
                <span className="text-[11px] font-mono text-neutral-400 block mb-1">
                  Cascade Secondary Failures
                </span>
                <span className={`text-xl font-bold font-mono ${cascade.expectedAdditionalStockouts > 0 ? "text-rose-500" : "text-emerald-400"}`}>
                  +{cascade.expectedAdditionalStockouts} facilities
                </span>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Accelerated stockout risk
                </p>
              </div>
            </div>

            {/* Spillover Warning Box */}
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs font-mono text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-300 block">Proactive Transfer Notice</span>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  When primary tertiary referral hospitals stock out, adjacent sub-district and community hospitals experience up to 45% demand surges within 48 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Quick links to other analytics */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/trajectory"
              className="p-4 rounded-xl bg-[#080808] hover:bg-[#111111] border border-[#222222] hover:border-[#383838] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-mono block">Stock Trajectory</span>
                <span className="text-[11px] text-neutral-400">Inventory depletion curves &amp; stockout day</span>
              </div>
            </Link>

            <Link
              href="/alerts"
              className="p-4 rounded-xl bg-[#080808] hover:bg-[#111111] border border-[#222222] hover:border-[#383838] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-2">
                <ShieldAlert className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-mono block">Risk Alerts Feed</span>
                <span className="text-[11px] text-neutral-400">Ranked facility emergencies &amp; actions</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
