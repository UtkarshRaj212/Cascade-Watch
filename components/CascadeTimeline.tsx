"use client";

import React, { useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react";

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
  // Milestone flags along timeline
  const milestones = [
    { day: 0, label: "Day 0 (Baseline)", type: "baseline" },
  ];

  if (primaryStockoutDay !== null && primaryStockoutDay <= horizonDays) {
    milestones.push({
      day: primaryStockoutDay,
      label: `Day ${primaryStockoutDay} (Stockout)`,
      type: "stockout",
    });
  }

  if (replenishmentDeliveryDay !== null && replenishmentDeliveryDay <= horizonDays) {
    milestones.push({
      day: replenishmentDeliveryDay,
      label: `Day ${replenishmentDeliveryDay} (Shipment)`,
      type: "delivery",
    });
  }

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onSelectSimDay((simDay + 1) % (horizonDays + 1));
    }, 700);

    return () => clearInterval(interval);
  }, [isPlaying, simDay, horizonDays, onSelectSimDay]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded p-3 font-mono text-xs shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800/80 pb-2.5 mb-2.5">
        {/* Playback Controls & Current Day Display */}
        <div className="flex items-center gap-2.5">
          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all border ${
              isPlaying
                ? "bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400"
                : "bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "Pause Simulation" : "Play Simulation"}</span>
          </button>

          {/* Step buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => onSelectSimDay(Math.max(0, simDay - 1))}
              disabled={simDay <= 0}
              className="p-1 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectSimDay(Math.min(horizonDays, simDay + 1))}
              disabled={simDay >= horizonDays}
              className="p-1 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectSimDay(0)}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded ml-0.5"
              title="Reset to Day 0"
              aria-label="Reset to Day 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Day Pill */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400 text-[11px]">TIMELINE STEP:</span>
            <span className="text-white font-bold text-sm">
              Day T+{simDay}
            </span>
            <span className="text-slate-500 text-[11px]">/ {horizonDays}d</span>
          </div>
        </div>

        {/* Phase descriptor status */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">Simulation Status:</span>
          {primaryStockoutDay !== null && simDay >= primaryStockoutDay ? (
            <span className="text-rose-400 font-bold bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded">
              Active Cascade Deflection Ongoing
            </span>
          ) : (
            <span className="text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
              Pre-Stockout Baseline (Buffers intact)
            </span>
          )}
        </div>
      </div>

      {/* Timeline Slider with Milestones */}
      <div className="relative px-2 pt-1 pb-2">
        {/* Slider Input */}
        <input
          id="cascade-timeline-slider"
          type="range"
          min="0"
          max={horizonDays}
          step="1"
          value={simDay}
          onChange={(e) => onSelectSimDay(parseInt(e.target.value, 10))}
          className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          aria-label="Cascade Simulation Day Slider"
        />

        {/* Milestone indicators below slider */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono">
          <span>T+0d (Today)</span>

          {primaryStockoutDay !== null && primaryStockoutDay <= horizonDays && (
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Primary Stockout: Day {primaryStockoutDay}
            </span>
          )}

          {replenishmentDeliveryDay !== null && replenishmentDeliveryDay <= horizonDays && (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Shipment ETA: Day {replenishmentDeliveryDay}
            </span>
          )}

          <span>T+{horizonDays}d (Horizon Limit)</span>
        </div>
      </div>
    </div>
  );
}
