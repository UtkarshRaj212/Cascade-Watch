"use client";

import React from "react";
import { Menu, Activity, RefreshCw, Calendar, MapPin, Pill, Filter } from "lucide-react";
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
    <header className="border-b border-[#222222] bg-black/90 backdrop-blur-lg px-6 py-4 sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        {/* Left Side: Hamburger Icon + Branding */}
        <div className="flex items-center gap-4">
          <button
            id="hamburger-menu-btn"
            onClick={onOpenSideNav}
            className="p-2.5 rounded-lg bg-[#0e0e0e] border border-[#262626] hover:border-[#404040] hover:bg-[#181818] text-neutral-300 hover:text-white transition-all shadow-sm group"
            title="Open Side Panel"
            aria-label="Toggle Side Panel"
          >
            <Menu className="w-5 h-5 group-hover:scale-105 transition-transform" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-white text-black flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              ▲
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-lg tracking-tight text-white font-mono">
                  CascadeWatch
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#141414] text-neutral-300 border border-[#2a2a2a] font-mono">
                  Decision Support System
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Predictive Medicine Stockout & Referral Ripple Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center: Section Quick Nav Tabs (Vercel Style) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#0a0a0a] border border-[#222222] p-1 rounded-lg">
          <button
            onClick={() => onSelectSection("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === "all"
                ? "bg-[#1f1f1f] text-white shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            All Sections
          </button>
          <button
            onClick={() => onSelectSection("network-map")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === "network-map"
                ? "bg-[#1f1f1f] text-white shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Network Map
          </button>
          <button
            onClick={() => onSelectSection("cascade-intel")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === "cascade-intel"
                ? "bg-[#1f1f1f] text-white shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Cascade Ripple
          </button>
          <button
            onClick={() => onSelectSection("trajectory")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === "trajectory"
                ? "bg-[#1f1f1f] text-white shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Stock Trajectory
          </button>
          <button
            onClick={() => onSelectSection("alerts-inspector")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeSection === "alerts-inspector"
                ? "bg-[#1f1f1f] text-white shadow-sm font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Risk Alerts & Facility Audit
          </button>
        </div>

        {/* Right Side: Tactical Filters & Run Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* District Selector */}
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-3 py-2 text-xs">
            <MapPin className="w-4 h-4 text-neutral-400" />
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
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-3 py-2 text-xs">
            <Pill className="w-4 h-4 text-neutral-400" />
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
          <div className="flex items-center gap-2.5 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-3 py-2 text-xs">
            <Calendar className="w-4 h-4 text-neutral-400" />
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
                className="w-24 accent-white cursor-pointer h-2 bg-[#222222] rounded-lg appearance-none"
                aria-label="Analysis Horizon Slider"
              />
              <span className="font-mono font-bold text-white text-xs min-w-[34px] text-right">
                {horizonDays}d
              </span>
            </div>
          </div>

          {/* Run Analysis Button */}
          <button
            id="run-analysis-btn"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm ${
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

      {/* Analysis Status Bar */}
      <div className="max-w-[1700px] mx-auto mt-3 pt-3 border-t border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Telemetry Feed Live
          </span>
          <span className="text-[#333333]">&bull;</span>
          <span>Simulation Engine: Deterministic Referral Shock Model</span>
          <span className="text-[#333333]">&bull;</span>
          <span>Scope: {selectedDistrict === "all" ? "All Districts" : `${selectedDistrict} District`}</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-400">
          <span>Active Horizon Window: Day 0 &rarr; Day {horizonDays}</span>
          <span className="text-[#333333]">&bull;</span>
          <span>Refreshed: {lastAnalysisTimestamp}</span>
        </div>
      </div>
    </header>
  );
}
