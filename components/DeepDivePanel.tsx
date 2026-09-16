"use client";

import React, { useState } from "react";
import {
  X,
  Waves,
  TrendingDown,
  ShieldAlert,
  Building2,
  Layers,
  Sparkles,
  Calendar,
} from "lucide-react";
import { FacilitySimulationState, CascadeDetails } from "@/lib/simulation";
import { Drug } from "@/lib/db/schema";
import { CascadeTimeline } from "./CascadeTimeline";
import { CascadeSummary } from "./CascadeSummary";
import { StockTrajectoryChart } from "./StockTrajectoryChart";
import { RiskAlertPanel } from "./RiskAlertPanel";
import { FacilityDetails } from "./FacilityDetails";

export type DeepDiveTab = "all" | "cascade" | "trajectory" | "alerts" | "facility";

interface DeepDivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedState: FacilitySimulationState | null;
  selectedDrug: Drug | undefined;
  simDay: number;
  horizonDays: number;
  onSelectSimDay: (day: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  cascade: CascadeDetails;
  facilityStates: FacilitySimulationState[];
  selectedFacilityId: string | null;
  onSelectFacility: (facilityId: string) => void;
}

export function DeepDivePanel({
  isOpen,
  onClose,
  selectedState,
  selectedDrug,
  simDay,
  horizonDays,
  onSelectSimDay,
  isPlaying,
  onTogglePlay,
  cascade,
  facilityStates,
  selectedFacilityId,
  onSelectFacility,
}: DeepDivePanelProps) {
  const [activeTab, setActiveTab] = useState<DeepDiveTab>("all");

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-200"
          aria-label="Close panel backdrop"
        />
      )}

      {/* Sliding Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[840px] max-w-[94vw] bg-[#050505] border-r border-[#222222] z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#222222] bg-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              ▲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight font-mono">
                  Deep-Dive Supply Chain Intel
                </span>
                <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#141414] text-neutral-300 border border-[#2a2a2a] font-mono">
                  Extended Analytics
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Cascade Simulation &bull; Inventory Trajectories &bull; Risk Alerts &bull; Facility Audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1f1f1f] transition-colors border border-transparent hover:border-[#333333]"
            aria-label="Close Deep-Dive Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Sub-Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-[#1c1c1c] bg-[#0a0a0a] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === "all"
                ? "bg-[#1f1f1f] text-white font-semibold border border-[#333333]"
                : "text-neutral-400 hover:text-white hover:bg-[#121212]"
            }`}
          >
            View All Deep-Dive
          </button>
          <button
            onClick={() => setActiveTab("cascade")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === "cascade"
                ? "bg-[#1f1f1f] text-white font-semibold border border-[#333333]"
                : "text-neutral-400 hover:text-white hover:bg-[#121212]"
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-rose-400" />
            <span>Cascade Ripple</span>
          </button>
          <button
            onClick={() => setActiveTab("trajectory")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === "trajectory"
                ? "bg-[#1f1f1f] text-white font-semibold border border-[#333333]"
                : "text-neutral-400 hover:text-white hover:bg-[#121212]"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
            <span>Stock Trajectory</span>
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === "alerts"
                ? "bg-[#1f1f1f] text-white font-semibold border border-[#333333]"
                : "text-neutral-400 hover:text-white hover:bg-[#121212]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Risk Alerts ({facilityStates.filter(s => s.dynamicRiskStatus === 'critical' || s.dynamicRiskStatus === 'warning').length})</span>
          </button>
          <button
            onClick={() => setActiveTab("facility")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all ${
              activeTab === "facility"
                ? "bg-[#1f1f1f] text-white font-semibold border border-[#333333]"
                : "text-neutral-400 hover:text-white hover:bg-[#121212]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Facility Audit</span>
          </button>
        </div>

        {/* Drawer Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section 1: Cascade Ripple Simulation */}
          {(activeTab === "all" || activeTab === "cascade") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                <Waves className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Cascade Propagation &amp; Referral Spillover Simulation
                </h3>
              </div>

              {/* Simulation Scrubber */}
              <CascadeTimeline
                simDay={simDay}
                horizonDays={horizonDays}
                onSelectSimDay={onSelectSimDay}
                isPlaying={isPlaying}
                onTogglePlay={onTogglePlay}
                primaryStockoutDay={cascade.primaryStockoutDay}
                replenishmentDeliveryDay={selectedState?.inventory.nextDeliveryDays || null}
              />

              {/* Cascade Summary */}
              <CascadeSummary
                cascade={cascade}
                selectedDrug={selectedDrug}
                simDay={simDay}
                onSelectFacility={onSelectFacility}
              />
            </div>
          )}

          {/* Section 2: Stock Trajectory Chart */}
          {(activeTab === "all" || activeTab === "trajectory") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                <TrendingDown className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Inventory Depletion Trajectory &amp; Stockout Horizon
                </h3>
              </div>

              <StockTrajectoryChart
                selectedState={selectedState}
                selectedDrug={selectedDrug}
                horizonDays={horizonDays}
                simDay={simDay}
                onSelectSimDay={onSelectSimDay}
              />
            </div>
          )}

          {/* Section 3: Ranked Risk Alerts */}
          {(activeTab === "all" || activeTab === "alerts") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Ranked Facility Risk Alerts Feed
                </h3>
              </div>

              <div className="h-[460px]">
                <RiskAlertPanel
                  facilityStates={facilityStates}
                  selectedDrug={selectedDrug}
                  selectedFacilityId={selectedFacilityId}
                  onSelectFacility={onSelectFacility}
                />
              </div>
            </div>
          )}

          {/* Section 4: Facility Operational Diagnostic Audit */}
          {(activeTab === "all" || activeTab === "facility") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#222222]">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Facility Operational Diagnostic Audit
                </h3>
              </div>

              <FacilityDetails
                selectedState={selectedState}
                selectedDrug={selectedDrug}
                simDay={simDay}
              />
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#1f1f1f] bg-black flex items-center justify-between text-xs text-neutral-400 font-mono shrink-0">
          <span>Active formulation: {selectedDrug?.name || "Essential Medicine"}</span>
          <span>Simulation Day: T+{simDay} of {horizonDays}d</span>
        </div>
      </aside>
    </>
  );
}
