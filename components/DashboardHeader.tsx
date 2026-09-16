"use client";

import React from "react";
import { Activity, Play, RefreshCw, Calendar, MapPin, Pill, ShieldAlert } from "lucide-react";
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
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur px-5 py-3 sticky top-0 z-40">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-rose-950/80 border border-rose-600/40 flex items-center justify-center text-rose-400 shrink-0 shadow-sm">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-mono">CascadeWatch</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                Early Warning & Cascade Intel
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Healthcare Supply-Chain Decision Support System &bull; Ripple Stockout Forecasting
            </p>
          </div>
        </div>

        {/* Tactical Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* District Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="district-select" className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              District:
            </label>
            <select
              id="district-select"
              aria-label="Filter by district"
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-slate-200">
                  {d} District
                </option>
              ))}
            </select>
          </div>

          {/* Drug Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs">
            <Pill className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="drug-select" className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              Drug:
            </label>
            <select
              id="drug-select"
              aria-label="Select target drug"
              value={selectedDrugId}
              onChange={(e) => onSelectDrug(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs pr-1 max-w-[190px] truncate"
            >
              {drugs.map((med) => (
                <option key={med.id} value={med.id} className="bg-slate-900 text-slate-200">
                  {med.name} ({med.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">Horizon:</span>
            <div className="flex items-center gap-1.5">
              <input
                id="horizon-slider"
                type="range"
                min="7"
                max="45"
                step="1"
                value={horizonDays}
                onChange={(e) => onChangeHorizon(parseInt(e.target.value, 10))}
                className="w-20 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                aria-label="Analysis Horizon Slider"
              />
              <span className="font-mono font-semibold text-slate-200 text-xs min-w-[32px] text-right">
                {horizonDays}d
              </span>
            </div>
          </div>

          {/* Run Analysis Button */}
          <button
            id="run-analysis-btn"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold tracking-wide transition-all border ${
              isAnalyzing
                ? "bg-slate-800 text-slate-400 border-slate-700 cursor-wait"
                : "bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-sm active:scale-95"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? "Computing..." : "Run Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Analysis Status Bar */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Telemetry Online
          </span>
          <span className="text-slate-600">&bull;</span>
          <span>Simulation Model: Deterministic Network Flow</span>
          <span className="text-slate-600">&bull;</span>
          <span>District: {selectedDistrict === "all" ? "All Districts" : `${selectedDistrict} District`}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-500">
          <span>Active Forecast Window: T+0 to T+{horizonDays} days</span>
          <span className="text-slate-600">&bull;</span>
          <span>Updated: {lastAnalysisTimestamp}</span>
        </div>
      </div>
    </header>
  );
}
