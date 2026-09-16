"use client";

import React, { useState, useMemo } from "react";
import { FacilitySimulationState } from "@/lib/simulation";
import { Drug } from "@/lib/db/schema";
import { TrendingDown, Calendar, Package, AlertCircle, ArrowDown } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-800 rounded h-64 text-slate-500 font-mono text-xs">
        <TrendingDown className="w-8 h-8 mb-2 text-slate-600" />
        <span>Select a facility to view inventory trajectory</span>
      </div>
    );
  }

  const { facility, inventory, trajectory, stockoutDay } = selectedState;

  // Compute SVG chart coordinates
  const chartWidth = 700;
  const chartHeight = 260;
  const padding = { top: 30, right: 35, bottom: 40, left: 60 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Max stock for scaling Y-axis
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

  // Scales
  const getX = (day: number) => padding.left + (day / horizonDays) * plotWidth;
  const getY = (stock: number) => padding.top + plotHeight - (Math.max(0, stock) / maxStock) * plotHeight;

  // SVG path for stock trajectory
  const pathD = useMemo(() => {
    return trajectory
      .filter((pt) => pt.day <= horizonDays)
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(pt.day).toFixed(1)} ${getY(pt.stock).toFixed(1)}`)
      .join(" ");
  }, [trajectory, horizonDays, maxStock]);

  // Area under path
  const areaD = useMemo(() => {
    const pts = trajectory.filter((pt) => pt.day <= horizonDays);
    if (pts.length === 0) return "";
    const firstX = getX(pts[0].day);
    const lastX = getX(pts[pts.length - 1].day);
    const zeroY = getY(0);
    return `${pathD} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
  }, [pathD, trajectory, horizonDays, maxStock]);

  // Y-axis ticks
  const yTicks = [0, Math.round(maxStock * 0.33), Math.round(maxStock * 0.66), maxStock];

  // X-axis ticks (step every 5 or 7 days)
  const xStep = horizonDays <= 14 ? 2 : horizonDays <= 28 ? 5 : 7;
  const xTicks: number[] = [];
  for (let d = 0; d <= horizonDays; d += xStep) {
    xTicks.push(d);
  }
  if (!xTicks.includes(horizonDays)) {
    xTicks.push(horizonDays);
  }

  // Hovered day data
  const activeDay = hoveredDay !== null ? hoveredDay : simDay;
  const activePoint = trajectory[Math.min(activeDay, trajectory.length - 1)];

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded overflow-hidden font-mono text-xs">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider">
            Inventory Trajectory & Stockout Forecast
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span> Projected Stock
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-b border-amber-400 border-dashed inline-block"></span> Safety Threshold
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span> Zero Stockout Point
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative p-2 bg-slate-950 flex justify-center">
        <svg
          className="w-full max-w-[850px] select-none"
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
            {/* Area Gradient */}
            <linearGradient id="stockAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
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
                  stroke="#1e293b"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val.toLocaleString()}
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
                  stroke="#1e293b"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={chartHeight - padding.bottom + 16}
                  fill="#64748b"
                  fontSize="10"
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
                strokeWidth="1.2"
                strokeDasharray="4 3"
                strokeOpacity="0.75"
              />
              <text
                x={chartWidth - padding.right - 4}
                y={getY(inventory.safetyStock) - 4}
                fill="#f59e0b"
                fontSize="9"
                fontFamily="monospace"
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
            strokeWidth="1.5"
          />

          {/* Stock Trajectory Area Fill */}
          <path d={areaD} fill="url(#stockAreaGrad)" />

          {/* Stock Trajectory Line */}
          <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

          {/* Replenishment Event Marker */}
          {inventory.nextDeliveryDays !== null && inventory.nextDeliveryDays <= horizonDays && (
            <g>
              <line
                x1={getX(inventory.nextDeliveryDays)}
                y1={padding.top}
                x2={getX(inventory.nextDeliveryDays)}
                y2={chartHeight - padding.bottom}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <rect
                x={getX(inventory.nextDeliveryDays) - 45}
                y={padding.top - 18}
                width="90"
                height="16"
                rx="2"
                fill="#064e3b"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text
                x={getX(inventory.nextDeliveryDays)}
                y={padding.top - 6}
                fill="#a7f3d0"
                fontSize="9"
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
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <circle cx={getX(stockoutDay)} cy={getY(0)} r="5" fill="#f43f5e" />
              <rect
                x={Math.min(getX(stockoutDay) - 40, chartWidth - padding.right - 90)}
                y={getY(0) - 24}
                width="82"
                height="18"
                rx="2"
                fill="#881337"
                stroke="#f43f5e"
                strokeWidth="1"
              />
              <text
                x={Math.min(getX(stockoutDay), chartWidth - padding.right - 49)}
                y={getY(0) - 11}
                fill="#ffffff"
                fontSize="9"
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
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <circle
            cx={getX(simDay)}
            cy={getY(trajectory[Math.min(simDay, trajectory.length - 1)]?.stock || 0)}
            r="4.5"
            fill="#ffffff"
            stroke="#0284c7"
            strokeWidth="2"
          />

          {/* Hover Scrub Line */}
          {hoveredDay !== null && hoveredDay !== simDay && (
            <g>
              <line
                x1={getX(hoveredDay)}
                y1={padding.top}
                x2={getX(hoveredDay)}
                y2={chartHeight - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="1 1"
              />
              <circle
                cx={getX(hoveredDay)}
                cy={getY(trajectory[Math.min(hoveredDay, trajectory.length - 1)]?.stock || 0)}
                r="4"
                fill="#38bdf8"
              />
            </g>
          )}
        </svg>

        {/* Floating Day Telemetry Box */}
        {activePoint && (
          <div className="absolute top-4 right-6 bg-slate-900/95 border border-slate-700 rounded p-2 text-[11px] shadow-lg font-mono">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1 mb-1 font-bold">
              <span className="text-white">Day T+{activeDay} Forecast</span>
              <span className={activePoint.isStockedOut ? "text-rose-400" : "text-emerald-400"}>
                {activePoint.isStockedOut ? "ZERO INVENTORY" : "BUFFER ACTIVE"}
              </span>
            </div>
            <div className="space-y-0.5 text-slate-300">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Projected Stock:</span>
                <span className="font-bold text-white">{activePoint.stock} {selectedDrug?.unit}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Burn Rate:</span>
                <span>{activePoint.consumption} {selectedDrug?.unit}/d</span>
              </div>
              {activePoint.divertedDemand > 0 && (
                <div className="flex justify-between gap-3 text-rose-400">
                  <span>Cascade Inflow:</span>
                  <span>+{activePoint.divertedDemand} {selectedDrug?.unit}/d</span>
                </div>
              )}
              {activePoint.replenishmentArrival > 0 && (
                <div className="flex justify-between gap-3 text-emerald-400">
                  <span>Shipment Delivery:</span>
                  <span>+{activePoint.replenishmentArrival} {selectedDrug?.unit}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Guidance */}
      <div className="px-3.5 py-1.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Hover or click along trajectory to scrub simulation day</span>
        <span className="text-slate-500">Facility: {facility.name}</span>
      </div>
    </div>
  );
}
