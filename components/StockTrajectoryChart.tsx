"use client";

import React, { useState, useMemo } from "react";
import { FacilitySimulationState } from "@/lib/simulation";
import { Drug } from "@/lib/db/schema";
import { TrendingDown, Calendar, Package, AlertCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface StockTrajectoryChartProps {
  selectedState: FacilitySimulationState | null;
  selectedDrug: Drug | undefined;
  horizonDays: number;
  simDay: number;
  onSelectSimDay?: (day: number) => void;
}

export function StockTrajectoryChart({
  selectedState,
  selectedDrug,
  horizonDays,
  simDay,
  onSelectSimDay,
}: StockTrajectoryChartProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  if (!selectedState || selectedState.trajectory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-black border border-[#222222] rounded-xl h-72 text-neutral-500 font-mono text-xs shadow-sm">
        <TrendingDown className="w-10 h-10 mb-3 text-neutral-600" />
        <span className="text-sm">Select a facility to inspect simulated inventory trajectory</span>
      </div>
    );
  }

  const { facility, inventory, trajectory, stockoutDay } = selectedState;

  const chartWidth = 850;
  const chartHeight = 290;
  const padding = { top: 35, right: 40, bottom: 45, left: 70 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const maxStock = useMemo(() => {
    let max = Math.max(
      inventory.currentStock + inventory.pipelineUnits,
      inventory.safetyStock * 1.5,
      100
    );
    trajectory.forEach((pt) => {
      if (pt.stock > max) max = pt.stock;
    });
    return Math.ceil(max * 1.15);
  }, [inventory, trajectory]);

  const getX = (day: number) => padding.left + (day / horizonDays) * plotWidth;
  const getY = (stock: number) => padding.top + plotHeight - (Math.max(0, stock) / maxStock) * plotHeight;

  const pathD = useMemo(() => {
    return trajectory
      .filter((pt) => pt.day <= horizonDays)
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(pt.day).toFixed(1)} ${getY(pt.stock).toFixed(1)}`)
      .join(" ");
  }, [trajectory, horizonDays, maxStock]);

  const areaD = useMemo(() => {
    const pts = trajectory.filter((pt) => pt.day <= horizonDays);
    if (pts.length === 0) return "";
    const firstX = getX(pts[0].day);
    const lastX = getX(pts[pts.length - 1].day);
    const zeroY = getY(0);
    return `${pathD} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
  }, [pathD, trajectory, horizonDays, maxStock]);

  const confidenceBandD = useMemo(() => {
    const pts = trajectory.filter((pt) => pt.day <= horizonDays && pt.confidenceUpper !== undefined);
    if (pts.length === 0) return "";
    const forward = pts
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(pt.day).toFixed(1)} ${getY(pt.confidenceUpper ?? pt.stock).toFixed(1)}`)
      .join(" ");
    const backward = [...pts]
      .reverse()
      .map((pt) => `L ${getX(pt.day).toFixed(1)} ${getY(pt.confidenceLower ?? 0).toFixed(1)}`)
      .join(" ");
    return `${forward} ${backward} Z`;
  }, [trajectory, horizonDays, maxStock]);

  const yTicks = [0, Math.round(maxStock * 0.33), Math.round(maxStock * 0.66), maxStock];

  const xStep = horizonDays <= 14 ? 2 : horizonDays <= 28 ? 5 : 7;
  const xTicks: number[] = [];
  for (let d = 0; d <= horizonDays; d += xStep) {
    xTicks.push(d);
  }
  if (!xTicks.includes(horizonDays)) {
    xTicks.push(horizonDays);
  }

  const activeDay = hoveredDay !== null ? hoveredDay : simDay;
  const activePoint = trajectory[Math.min(activeDay, trajectory.length - 1)];

  return (
    <div className="flex flex-col bg-black border border-[#222222] rounded-xl overflow-hidden font-mono shadow-sm">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-neutral-300" />
          <div>
            <span className="font-semibold text-white text-sm uppercase tracking-wider block">
              Inventory Depletion Trajectory & Replenishment Horizon
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Auditing {facility.name} &bull; Formulation: {selectedDrug?.name || "Selected Formulation"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-white inline-block"></span> Projected Stock Balance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-sky-500/20 border border-sky-400/40 inline-block rounded-xs"></span> Projected Variance (P10–P90)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-amber-400 border-dashed inline-block"></span> Safety Threshold
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 inline-block"></span> Zero Stockout Level
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative p-3 bg-black flex justify-center">
        <svg
          className="w-full max-w-[950px] select-none"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredDay(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            const dayFrac = (svgX - padding.left) / plotWidth;
            const dayClamped = Math.max(0, Math.min(horizonDays, Math.round(dayFrac * horizonDays)));
            setHoveredDay(dayClamped);
          }}
          onClick={() => {
            if (hoveredDay !== null && onSelectSimDay) {
              onSelectSimDay(hoveredDay);
            }
          }}
        >
          <defs>
            <linearGradient id="stockAreaGradVercel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Grid lines - horizontal */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#171717"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#737373"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {formatNumber(val)}
                </text>
              </g>
            );
          })}

          {/* Grid lines - vertical */}
          {xTicks.map((d) => {
            const x = getX(d);
            return (
              <g key={d}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={chartHeight - padding.bottom}
                  stroke="#171717"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 18}
                  fill="#737373"
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  T+{d}d
                </text>
              </g>
            );
          })}

          {/* Safety Stock Threshold Dotted Line */}
          {inventory.safetyStock > 0 && inventory.safetyStock < maxStock && (
            <g>
              <line
                x1={padding.left}
                y1={getY(inventory.safetyStock)}
                x2={chartWidth - padding.right}
                y2={getY(inventory.safetyStock)}
                stroke="#f59e0b"
                strokeWidth="1.4"
                strokeDasharray="4 3"
                strokeOpacity="0.8"
              />
              <text
                x={chartWidth - padding.right - 6}
                y={getY(inventory.safetyStock) - 6}
                fill="#f59e0b"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                Safe Reserve ({inventory.safetyStock} {selectedDrug?.unit})
              </text>
            </g>
          )}

          {/* Zero Stockout Baseline */}
          <line
            x1={padding.left}
            y1={getY(0)}
            x2={chartWidth - padding.right}
            y2={getY(0)}
            stroke="#e11d48"
            strokeWidth="1.8"
          />

          {/* Projected Variance Band (P10 to P90) */}
          {confidenceBandD && (
            <path
              d={confidenceBandD}
              fill="url(#confidenceGrad)"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.45"
            />
          )}

          {/* Stock Trajectory Area Fill */}
          <path d={areaD} fill="url(#stockAreaGradVercel)" />

          {/* Stock Trajectory Line */}
          <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="2.5" />

          {/* Replenishment Event Marker */}
          {inventory.nextDeliveryDays !== null && inventory.nextDeliveryDays <= horizonDays && (
            <g>
              <line
                x1={getX(inventory.nextDeliveryDays)}
                y1={padding.top}
                x2={getX(inventory.nextDeliveryDays)}
                y2={chartHeight - padding.bottom}
                stroke="#10b981"
                strokeWidth="1.6"
                strokeDasharray="4 2"
              />
              <rect
                x={getX(inventory.nextDeliveryDays) - 50}
                y={padding.top - 20}
                width="100"
                height="18"
                rx="3"
                fill="#062916"
                stroke="#10b981"
                strokeWidth="1.2"
              />
              <text
                x={getX(inventory.nextDeliveryDays)}
                y={padding.top - 7}
                fill="#a7f3d0"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                +{inventory.pipelineUnits} {selectedDrug?.unit}
              </text>
            </g>
          )}

          {/* Stockout Point Highlight */}
          {stockoutDay !== null && stockoutDay <= horizonDays && (
            <g>
              <line
                x1={getX(stockoutDay)}
                y1={padding.top + 10}
                x2={getX(stockoutDay)}
                y2={getY(0)}
                stroke="#f43f5e"
                strokeWidth="1.6"
                strokeDasharray="3 2"
              />
              <circle cx={getX(stockoutDay)} cy={getY(0)} r="5.5" fill="#f43f5e" />
              <rect
                x={Math.min(getX(stockoutDay) - 45, chartWidth - padding.right - 95)}
                y={getY(0) - 26}
                width="92"
                height="20"
                rx="3"
                fill="#380913"
                stroke="#f43f5e"
                strokeWidth="1.2"
              />
              <text
                x={Math.min(getX(stockoutDay), chartWidth - padding.right - 49)}
                y={getY(0) - 12}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Stockout Day {stockoutDay}
              </text>
            </g>
          )}

          {/* Current Simulation Day Scrubber Line */}
          <line
            x1={getX(simDay)}
            y1={padding.top}
            x2={getX(simDay)}
            y2={chartHeight - padding.bottom}
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeDasharray="3 2"
          />
          <circle
            cx={getX(simDay)}
            cy={getY(trajectory[Math.min(simDay, trajectory.length - 1)]?.stock || 0)}
            r="5"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="2.5"
          />

          {/* Hover Scrub Line */}
          {hoveredDay !== null && hoveredDay !== simDay && (
            <g>
              <line
                x1={getX(hoveredDay)}
                y1={padding.top}
                x2={getX(hoveredDay)}
                y2={chartHeight - padding.bottom}
                stroke="#737373"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredDay)}
                cy={getY(trajectory[Math.min(hoveredDay, trajectory.length - 1)]?.stock || 0)}
                r="4.5"
                fill="#d4d4d4"
              />
            </g>
          )}
        </svg>

        {/* Floating Day Telemetry Box */}
        {activePoint && (
          <div className="absolute top-5 right-8 bg-[#0a0a0a]/95 border border-[#333333] rounded-lg p-3 text-xs shadow-2xl font-mono min-w-[210px]">
            <div className="flex items-center justify-between gap-3 border-b border-[#222222] pb-1.5 mb-1.5 font-bold">
              <span className="text-white">Day T+{activeDay} Forecast</span>
              <span className={activePoint.isStockedOut ? "text-rose-400" : "text-emerald-400"}>
                {activePoint.isStockedOut ? "ZERO STOCK" : "BUFFER ACTIVE"}
              </span>
            </div>
            <div className="space-y-1 text-neutral-300">
              <div className="flex justify-between gap-3">
                <span className="text-neutral-500">Projected Stock:</span>
                <span className="font-bold text-white">{activePoint.stock} {selectedDrug?.unit}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-neutral-500">Burn Velocity:</span>
                <span>{activePoint.consumption} {selectedDrug?.unit}/d</span>
              </div>
              {activePoint.confidenceLower !== undefined && activePoint.confidenceUpper !== undefined && (
                <div className="flex justify-between gap-3 text-sky-400">
                  <span className="text-neutral-500">Variance Range:</span>
                  <span>{activePoint.confidenceLower} – {activePoint.confidenceUpper} {selectedDrug?.unit}</span>
                </div>
              )}
              {activePoint.divertedDemand > 0 && (
                <div className="flex justify-between gap-3 text-rose-400">
                  <span>Cascade Spillover:</span>
                  <span>+{activePoint.divertedDemand} {selectedDrug?.unit}/d</span>
                </div>
              )}
              {activePoint.replenishmentArrival > 0 && (
                <div className="flex justify-between gap-3 text-emerald-400">
                  <span>Shipment Arrival:</span>
                  <span>+{activePoint.replenishmentArrival} {selectedDrug?.unit}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Guidance */}
      <div className="px-5 py-2 border-t border-[#222222] bg-[#0a0a0a] flex items-center justify-between text-xs text-neutral-400">
        <span>Click anywhere along the chart trajectory to jump the simulation day scrubber</span>
        <span className="text-neutral-300 font-semibold">Selected Facility: {facility.name}</span>
      </div>
    </div>
  );
}
