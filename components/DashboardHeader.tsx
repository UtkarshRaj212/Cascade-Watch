"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  RefreshCw,
  Calendar,
  MapPin,
  Pill,
  Network,
  Waves,
  TrendingDown,
  ShieldAlert,
  Building2,
  ChevronRight,
  ArrowRightLeft,
  User,
  LogOut,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";
import { authClient } from "@/lib/auth-client";

export function DashboardHeader() {
  const pathname = usePathname();
  const {
    districts,
    selectedDistrict,
    setSelectedDistrict,
    drugs,
    selectedDrugId,
    setSelectedDrugId,
    horizonDays,
    setHorizonDays,
    runAnalysis,
    isAnalyzing,
    toggleSideNav,
  } = useDashboard();

  const { data: session } = authClient.useSession();

  const getPageTitle = () => {
    switch (pathname) {
      case "/cascade":
        return { label: "Cascade & Spillover Intel", icon: Waves, color: "text-rose-400" };
      case "/trajectory":
        return { label: "Stock Trajectory & Depletion", icon: TrendingDown, color: "text-sky-400" };
      case "/alerts":
        return { label: "Ranked Risk Alerts", icon: ShieldAlert, color: "text-rose-500" };
      case "/facilities":
        return { label: "Facility Diagnostic Audit", icon: Building2, color: "text-amber-400" };
      case "/redistribute":
        return { label: "Redistribution Actions", icon: ArrowRightLeft, color: "text-emerald-400" };
      case "/inventory":
        return { label: "Medicine & Stock Advisor", icon: Pill, color: "text-amber-400" };
      default:
        return { label: "Network & Referral Map", icon: Network, color: "text-emerald-400" };
    }
  };

  const pageInfo = getPageTitle();
  const PageIcon = pageInfo.icon;

  return (
    <header className="border-b border-[#222222] bg-black/95 backdrop-blur-md px-4 sm:px-6 py-2 xl:py-2.5 sticky top-0 z-40 shrink-0">
      <div className="max-w-[1750px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5 sm:gap-3">
        {/* Left: Hamburger Button + Branding + Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            id="hamburger-menu-btn"
            onClick={toggleSideNav}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0e0e0e] border border-[#262626] hover:border-[#444444] hover:bg-[#161616] text-neutral-200 hover:text-white transition-all shadow-sm shrink-0 group"
            title="Open Navigation Menu"
            aria-label="Toggle Side Menu"
          >
            <Menu className="w-5 h-5 text-neutral-300 group-hover:text-white" />

          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm shrink-0 select-none group-hover:bg-neutral-200 transition-colors">
              ▲
            </div>
            <div className="min-w-0">
              <span className="font-bold text-lg tracking-tight text-white font-mono block leading-none">
                MediRipple
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#222222]">
            <ChevronRight className="w-4 h-4 text-neutral-600" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0f0f0f] border border-[#222222]">
              <PageIcon className={`w-3.5 h-3.5 ${pageInfo.color}`} />
              <span className="text-xs font-mono font-medium text-neutral-200">
                {pageInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Operational Controls with shared context */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* District Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs whitespace-nowrap shrink-0">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 shrink-0" />
            <label htmlFor="district-select" className="text-neutral-400 text-xs font-medium uppercase tracking-wider hidden xs:inline">
              District:
            </label>
            <select
              id="district-select"
              aria-label="Filter by district"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
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
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs whitespace-nowrap shrink-0">
            <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 shrink-0" />
            <label htmlFor="drug-select" className="text-neutral-400 text-xs font-medium uppercase tracking-wider hidden xs:inline">
              Drug:
            </label>
            <select
              id="drug-select"
              aria-label="Select target drug"
              value={selectedDrugId}
              onChange={(e) => setSelectedDrugId(e.target.value)}
              className="bg-transparent text-neutral-100 font-semibold focus:outline-none cursor-pointer text-xs pr-1 max-w-[140px] sm:max-w-[190px] truncate"
            >
              {drugs.map((med) => (
                <option key={med.id} value={med.id} className="bg-[#0a0a0a] text-neutral-200">
                  {med.name} ({med.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#222222] hover:border-[#333333] transition-colors rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs whitespace-nowrap shrink-0">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 shrink-0" />
            <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider hidden xs:inline">Horizon:</span>
            <div className="flex items-center gap-2">
              <input
                id="horizon-slider"
                type="range"
                min="7"
                max="45"
                step="1"
                value={horizonDays}
                onChange={(e) => setHorizonDays(parseInt(e.target.value, 10))}
                className="w-16 sm:w-20 accent-white cursor-pointer h-2 bg-[#222222] rounded-lg appearance-none"
                aria-label="Analysis Horizon Slider"
              />
              <span className="font-mono font-bold text-white text-xs min-w-[26px] sm:min-w-[30px] text-right">
                {horizonDays}d
              </span>
            </div>
          </div>

          {/* Run Analysis Button */}
          <button
            id="run-analysis-btn"
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm whitespace-nowrap shrink-0 ${isAnalyzing
              ? "bg-[#1f1f1f] text-neutral-400 border border-[#333333] cursor-wait"
              : "bg-white text-black hover:bg-neutral-200 active:scale-[0.98]"
              }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-neutral-400" : "text-black"}`} />
            <span>{isAnalyzing ? "Computing..." : "Run Analysis"}</span>
          </button>

          {/* Auth Profile / Sign In */}
          {session?.user ? (
            <div className="flex items-center gap-2 bg-[#0e0e0e] border border-[#262626] rounded-lg px-2.5 py-1 text-xs whitespace-nowrap shrink-0">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-[10px]">
                {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="font-mono text-neutral-200 text-xs hidden md:inline truncate max-w-[110px]">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
                className="text-neutral-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/signin"
              className="flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-lg bg-[#111111] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#383838] text-xs font-mono text-neutral-300 hover:text-white transition-all whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
