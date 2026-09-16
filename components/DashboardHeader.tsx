"use client";

import React from "react";
import { Menu, RefreshCw, Calendar, MapPin, Pill, SlidersHorizontal } from "lucide-react";
import { Drug } from "@/lib/db/schema";

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
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-[#222222] bg-black/95 backdrop-blur-md px-6 py-3.5 sticky top-0 z-40">
      <div className="max-w-[1750px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        {/* Left: Hamburger Button + Clean Branding */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            id="hamburger-menu-btn"
            onClick={onOpenSideNav}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0e0e0e] border border-[#262626] hover:border-[#404040] hover:bg-[#161616] text-neutral-200 hover:text-white transition-all shadow-sm shrink-0 group"
            title="Open Deep-Dive Side Panel"
            aria-label="Toggle Side Panel"
          >
            <Menu className="w-5 h-5 text-neutral-300 group-hover:text-white" />
            <span className="text-xs font-mono font-medium hidden sm:inline text-neutral-300 group-hover:text-white">
              Deep-Dive Panel
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm shrink-0 select-none">
              ▲
            </div>
            <div className="min-w-0">
              <span className="font-bold text-lg tracking-tight text-white font-mono block leading-none">
                CascadeWatch
              </span>
              {/* <p className="text-xs text-neutral-400 mt-1 whitespace-nowrap">
                Predictive Medicine Stockout &amp; Referral Ripple Intelligence
              </p> */}
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm whitespace-nowrap shrink-0 ${isAnalyzing
                ? "bg-[#1f1f1f] text-neutral-400 border border-[#333333] cursor-wait"
                : "bg-white text-black hover:bg-neutral-200 active:scale-[0.98]"
              }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-neutral-400" : "text-black"}`} />
            <span>{isAnalyzing ? "Computing..." : "Run Analysis"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
