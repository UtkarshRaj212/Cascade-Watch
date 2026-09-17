"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  X,
  LayoutDashboard,
  Network,
  Waves,
  TrendingDown,
  ShieldAlert,
  Building2,
  Database,
  Calendar,
  ChevronRight,
  ExternalLink,
  MapPin,
  Pill,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";

export function SideNav() {
  const pathname = usePathname();
  const {
    isSideNavOpen,
    setIsSideNavOpen,
    selectedDistrict,
    selectedDrug,
    horizonDays,
    facilities,
    simulationResult,
  } = useDashboard();

  const criticalCount = simulationResult.kpis.criticalFacilities;
  const atRiskCount = simulationResult.kpis.facilitiesAtRisk;

  const navLinks = [
    {
      href: "/",
      label: "Network & Referral Map",
      badge: "Command Center",
      description: "Spatial nodes, referral pathways & district KPIs",
      icon: Network,
      color: "text-emerald-400",
    },
    {
      href: "/cascade",
      label: "Cascade & Spillover Intel",
      badge: simulationResult.cascade.primaryStockoutDay !== null ? `Stockout Day ${simulationResult.cascade.primaryStockoutDay}` : "Simulation",
      badgeColor: "bg-rose-950/80 text-rose-300 border-rose-800/60",
      description: "Day-by-day ripple simulation & patient deflection",
      icon: Waves,
      color: "text-rose-400",
    },
    {
      href: "/trajectory",
      label: "Stock Trajectory",
      badge: `${horizonDays}d Horizon`,
      badgeColor: "bg-sky-950/80 text-sky-300 border-sky-800/60",
      description: "Inventory depletion curves & delivery milestones",
      icon: TrendingDown,
      color: "text-sky-400",
    },
    {
      href: "/alerts",
      label: "Risk Alerts & Priorities",
      badge: criticalCount > 0 ? `${criticalCount} Critical` : `${atRiskCount} At Risk`,
      badgeColor: criticalCount > 0 ? "bg-rose-900/60 text-rose-300 border-rose-700/60" : "bg-amber-900/60 text-amber-300 border-amber-700/60",
      description: "Ranked facility risk alerts & diagnostic audit",
      icon: ShieldAlert,
      color: "text-rose-500",
    },
    {
      href: "/facilities",
      label: "Facility Diagnostic Audit",
      badge: `${facilities.length} Facilities`,
      badgeColor: "bg-neutral-900 text-neutral-300 border-neutral-700",
      description: "Single-facility operational deep dive & buffer stock",
      icon: Building2,
      color: "text-amber-400",
    },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {isSideNavOpen && (
        <div
          onClick={() => setIsSideNavOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-200"
          aria-label="Close navigation sidebar"
        />
      )}

      {/* Navigation Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-84 max-w-[88vw] bg-[#070707] border-r border-[#222222] z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${isSideNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#222222] flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm">
              ▲
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block font-mono">
                CascadeWatch
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Supply Chain Intelligence
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsSideNavOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-[#333333]"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Context Summary Bar */}
        <div className="p-4 border-b border-[#181818] bg-[#0c0c0c]/80">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold block mb-2">
            Active Parameters
          </span>
          <div className="space-y-1.5 text-xs font-mono text-neutral-300">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                District:
              </span>
              <span className="font-semibold text-white">
                {selectedDistrict === "all" ? "All Districts" : `${selectedDistrict} District`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-neutral-400" />
                Drug:
              </span>
              <span className="font-semibold text-white truncate max-w-[140px]">
                {selectedDrug?.name || "Medicine"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Horizon:
              </span>
              <span className="font-semibold text-white">{horizonDays} Days</span>
            </div>
          </div>
        </div>

        {/* Section Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
            Data &amp; Intelligence Pages
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSideNavOpen(false)}
                className={`group w-full block p-3 rounded-lg border transition-all ${isActive
                  ? "bg-[#181818] text-white border-[#383838] shadow-md ring-1 ring-white/10"
                  : "text-neutral-400 hover:text-white hover:bg-[#111111] border-transparent hover:border-[#222222]"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md ${isActive ? "bg-black text-white" : "bg-[#141414] text-neutral-400 group-hover:text-white"}`}>
                    <Icon className={`w-4 h-4 ${isActive ? item.color : "text-neutral-400 group-hover:text-white"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-xs font-semibold font-mono ${isActive ? "text-white" : "text-neutral-200 group-hover:text-white"}`}>
                        {item.label}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? "text-white translate-x-0.5" : "text-neutral-600 group-hover:text-neutral-400"}`} />
                    </div>

                    <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                      {item.description}
                    </p>

                    {item.badge && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded border ${item.badgeColor || "bg-[#161616] text-neutral-300 border-[#2b2b2b]"
                          }`}>
                          {item.badge}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
