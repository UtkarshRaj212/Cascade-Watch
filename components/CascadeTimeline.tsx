"use client";

import React, { useEffect } from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock, ShieldAlert } from "lucide-react";

interface CascadeTimelineProps {
  simDay: number;
  horizonDays: number;
  onSelectSimDay: (day: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  primaryStockoutDay: number | null;
  replenishmentDeliveryDay: number | null;
}

export function CascadeTimeline({
  simDay,
  horizonDays,
  onSelectSimDay,
  isPlaying,
  onTogglePlay,
  primaryStockoutDay,
  replenishmentDeliveryDay,
}: CascadeTimelineProps) {
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onSelectSimDay((simDay + 1) % (horizonDays + 1));
    }, 750);

    return () => clearInterval(interval);
  }, [isPlaying, simDay, horizonDays, onSelectSimDay]);

  return (
    <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl p-5 font-mono shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#1f1f1f] pb-4 mb-4">
        {/* Playback Controls & Current Day Display */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Play / Pause - Vercel signature high contrast */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm ${
              isPlaying
                ? "bg-amber-400 text-black hover:bg-amber-300"
                : "bg-white text-black hover:bg-neutral-200 active:scale-[0.98]"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? "Pause Timeline" : "Play Simulation"}</span>
          </button>

          {/* Step buttons */}
          <div className="flex items-center gap-1 bg-[#121212] border border-[#262626] rounded-lg p-1">
            <button
              onClick={() => onSelectSimDay(Math.max(0, simDay - 1))}
              disabled={simDay <= 0}
              className="p-1.5 hover:bg-[#222222] text-neutral-300 disabled:opacity-30 rounded-md transition-colors"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectSimDay(Math.min(horizonDays, simDay + 1))}
              disabled={simDay >= horizonDays}
              className="p-1.5 hover:bg-[#222222] text-neutral-300 disabled:opacity-30 rounded-md transition-colors"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectSimDay(0)}
              className="p-1.5 hover:bg-[#222222] text-neutral-300 rounded-md transition-colors ml-1"
              title="Reset to Day 0"
              aria-label="Reset to Day 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Current Day Pill */}
          <div className="flex items-center gap-2.5 bg-[#121212] border border-[#262626] px-3.5 py-1.5 rounded-lg">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-500 text-xs uppercase tracking-wider font-semibold">Sim Step:</span>
            <span className="text-white font-bold text-sm">
              Day T+{simDay}
            </span>
            <span className="text-neutral-500 text-xs">of {horizonDays} days</span>
          </div>
        </div>

        {/* Phase descriptor status */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-neutral-400 font-semibold">Cascade Simulation State:</span>
          {primaryStockoutDay !== null && simDay >= primaryStockoutDay ? (
            <span className="text-rose-300 font-bold bg-rose-950/50 border border-rose-800/80 px-3 py-1 rounded-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Active Patient Referral Deflection Triggered
            </span>
          ) : (
            <span className="text-emerald-300 font-medium bg-emerald-950/40 border border-emerald-800/70 px-3 py-1 rounded-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Pre-Stockout Baseline (Referral Network Stable)
            </span>
          )}
        </div>
      </div>

      {/* Timeline Slider with Milestones */}
      <div className="relative px-2 pt-2 pb-2">
        <input
          id="cascade-timeline-slider"
          type="range"
          min="0"
          max={horizonDays}
          step="1"
          value={simDay}
          onChange={(e) => onSelectSimDay(parseInt(e.target.value, 10))}
          className="w-full accent-white cursor-pointer h-2.5 bg-[#1e1e1e] rounded-lg appearance-none"
          aria-label="Cascade Simulation Day Slider"
        />

        {/* Milestone indicators below slider */}
        <div className="flex flex-wrap justify-between items-center text-xs text-neutral-400 mt-3 font-mono gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
            T+0d (Current Live Baseline)
          </span>

          {primaryStockoutDay !== null && primaryStockoutDay <= horizonDays && (
            <span className="text-rose-400 font-bold flex items-center gap-1.5 bg-rose-950/30 px-2.5 py-0.5 rounded border border-rose-900/50">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Primary Epicenter Stockout: Day {primaryStockoutDay}
            </span>
          )}

          {replenishmentDeliveryDay !== null && replenishmentDeliveryDay <= horizonDays && (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/30 px-2.5 py-0.5 rounded border border-emerald-900/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Scheduled Inbound Delivery: Day {replenishmentDeliveryDay}
            </span>
          )}

          <span className="text-neutral-400">
            T+{horizonDays}d (Window Maximum)
          </span>
        </div>
      </div>
    </div>
  );
}
