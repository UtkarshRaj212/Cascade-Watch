"use client";

import React from "react";
import { Menu, RefreshCw, Calendar, MapPin, Pill } from "lucide-react";
import { Drug } from "@/lib/db/schema";
import { DashboardSection } from "./SideNav";

interface DashboardHeaderProps {
  districts: string[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  drugs: Drug[];
  selectedDrugId: string;
  onSelectDrug: (drugId: string) => void;
  horizonDays: number;
  onChangeHorizon: (horizon: number) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  lastAnalysisTimestamp: string;
  onOpenSideNav: () => void;
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
}

export function DashboardHeader({
  districts,
  selectedDistrict,
  onSelectDistrict,
  drugs,
  selectedDrugId,
  onSelectDrug,
  horizonDays,
  onChangeHorizon,
  onRunAnalysis,
  isAnalyzing,
  lastAnalysisTimestamp,
  onOpenSideNav,
  activeSection,
  onSelectSection,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-[#222222] bg-black/95 backdrop-blur-md px-6 py-3.5 sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto space-y-3">
        {/* Row 1: Brand & Operational Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Hamburger + Clean Branding */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button
              id="hamburger-menu-btn"
              onClick={onOpenSideNav}
              className="p-2.5 rounded-lg bg-[#0a0a0a] border border-[#222222] hover:border-[#3a3a3a] hover:bg-[#141414] text-neutral-300 hover:text-white transition-all shadow-sm shrink-0"
              title="Open Side Panel"
              aria-label="Toggle Side Panel"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm shrink-0 select-none">
                ▲
              </div>
              <div className="min-w-0">
                <span className="font-bold text-lg tracking-tight text-white font-mono block leading-none">
                  CascadeWatch
                </span>
                <p className="text-xs text-neutral-400 mt-1 whitespace-nowrap">
                  Predictive Medicine Stockout &amp; Referral Ripple Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Right: Operational Controls with no text wrapping */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* District Selector */}
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-3 py-2 text-xs whitespace-nowrap shrink-0">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
              <label htmlFor="district-select" className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
                District:
              </label>
              <select
                id="district-select"
                aria-label="Filter by district"
                value={selectedDistrict}
                onChange={(e) => onSelectDistrict(e.target.value)}
                className="bg-transparent text-neutral-100 font-semibold focus:outline-none cursor-pointer text-xs pr-1"
              >
                <option value="all" className="bg-[#0a0a0a] text-neutral-200">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d} className="bg-[#0a0a0a] text-neutral-200">
                    {d} District
                  </option>
                ))}
              </select>
            </div>

            {/* Drug Selector */}
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-3 py-2 text-xs whitespace-nowrap shrink-0">
              <Pill className="w-4 h-4 text-neutral-400 shrink-0" />
              <label htmlFor="drug-select" className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
                Drug:
              </label>
              <select
                id="drug-select"
                aria-label="Select target drug"
                value={selectedDrugId}
                onChange={(e) => onSelectDrug(e.target.value)}
                className="bg-transparent text-neutral-100 font-semibold focus:outline-none cursor-pointer text-xs pr-1 max-w-[200px] truncate"
              >
                {drugs.map((med) => (
                  <option key={med.id} value={med.id} className="bg-[#0a0a0a] text-neutral-200">
                    {med.name} ({med.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Horizon Selector */}
            <div className="flex items-center gap-2.5 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-3 py-2 text-xs whitespace-nowrap shrink-0">
              <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Horizon:</span>
              <div className="flex items-center gap-2">
                <input
                  id="horizon-slider"
                  type="range"
                  min="7"
                  max="45"
                  step="1"
                  value={horizonDays}
                  onChange={(e) => onChangeHorizon(parseInt(e.target.value, 10))}
                  className="w-20 accent-white cursor-pointer h-2 bg-[#222222] rounded-lg appearance-none"
                  aria-label="Analysis Horizon Slider"
                />
                <span className="font-mono font-bold text-white text-xs min-w-[30px] text-right">
                  {horizonDays}d
                </span>
              </div>
            </div>

            {/* Run Analysis Button */}
            <button
              id="run-analysis-btn"
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm whitespace-nowrap shrink-0 ${
                isAnalyzing
                  ? "bg-[#1f1f1f] text-neutral-400 border border-[#333333] cursor-wait"
                  : "bg-white text-black hover:bg-neutral-200 active:scale-[0.98]"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-neutral-400" : "text-black"}`} />
              <span>{isAnalyzing ? "Computing..." : "Run Analysis"}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Vercel Sub-Navigation Tabs & Telemetry Status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2.5 border-t border-[#1a1a1a]">
          {/* Section Quick Nav Tabs (with whitespace-nowrap) */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => onSelectSection("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                activeSection === "all"
                  ? "bg-[#1f1f1f] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-neutral-400 hover:text-white hover:bg-[#111111]"
              }`}
            >
              All Sections
            </button>
            <button
              onClick={() => onSelectSection("overview")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                activeSection === "overview"
                  ? "bg-[#1f1f1f] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-neutral-400 hover:text-white hover:bg-[#111111]"
              }`}
            >
              1. Macro Overview
            </button>
            <button
              onClick={() => onSelectSection("network-map")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                activeSection === "network-map"
                  ? "bg-[#1f1f1f] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-neutral-400 hover:text-white hover:bg-[#111111]"
              }`}
            >
              2. Network Map
            </button>
            <button
              onClick={() => onSelectSection("cascade-intel")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                activeSection === "cascade-intel"
                  ? "bg-[#1f1f1f] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-neutral-400 hover:text-white hover:bg-[#111111]"
              }`}
            >
              3. Cascade Ripple
            </button>
            <button
              onClick={() => onSelectSection("trajectory")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                activeSection === "trajectory"
                  ? "bg-[#1f1f1f] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-neutral-400 hover:text-white hover:bg-[#111111]"
              }`}
            >
              4. Stock Trajectory
            </button>
            <button
              onClick={() => onSelectSection("alerts-inspector")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                activeSection === "alerts-inspector"
                  ? "bg-[#1f1f1f] text-white shadow-sm font-semibold border border-[#333333]"
                  : "text-neutral-400 hover:text-white hover:bg-[#111111]"
              }`}
            >
              5. Risk Alerts &amp; Facility Audit
            </button>
          </div>

          {/* Telemetry Status info */}
          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono whitespace-nowrap shrink-0">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Telemetry Live
            </span>
            <span className="text-[#333333]">&bull;</span>
            <span>Deterministic Referral Model</span>
            <span className="text-[#333333]">&bull;</span>
            <span>Refreshed: {lastAnalysisTimestamp}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
