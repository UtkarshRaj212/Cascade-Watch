import { Facility, Drug, FacilityInventory, ReferralLink } from "./db/schema";
import { runMonteCarloSimulation, FacilityMonteCarloResult } from "./monte-carlo";

export interface SimulationTrajectoryPoint {
  day: number;
  stock: number;
  consumption: number;
  divertedDemand: number;
  totalDemand: number;
  replenishmentArrival: number;
  isStockedOut: boolean;
  confidenceLower?: number; // P10 pessimistic bound from Monte Carlo
  confidenceUpper?: number; // P90 optimistic bound from Monte Carlo
}

export interface FacilitySimulationState {
  facility: Facility;
  inventory: FacilityInventory;
  currentStockAtDay: number;
  effectiveDaysCover: number;
  stockoutDay: number | null; // Expected stockout day derived from Monte Carlo
  isStockedOutNow: boolean;
  dynamicRiskStatus: "critical" | "warning" | "low" | "insufficient_data";
  dynamicRiskProbability: number; // Stochastic stockout probability derived from Monte Carlo
  divertedDemandReceived: number;
  trajectory: SimulationTrajectoryPoint[];
  cascadeWave: number; // 0 = not in cascade or primary source, 1 = direct recipient of deflected patients, 2 = secondary
  confidenceLower?: number; // Current day lower bound
  confidenceUpper?: number; // Current day upper bound
  cascadeVulnerabilityScore?: number;
}

export interface CascadeDetails {
  primaryFacility: Facility | null;
  primaryDrug: Drug | null;
  primaryStockoutDay: number | null;
  secondaryFacilitiesAffected: Facility[];
  divertedDemandRate: number; // units per day deflected
  totalDivertedUnits: number; // total units deflected up to current day
  cascadeWaveReached: string;
  expectedAdditionalStockouts: number;
  affectedReferralLinkIds: number[];
}

export interface SimulationResult {
  facilityStates: Map<string, FacilitySimulationState>;
  facilityStateList: FacilitySimulationState[];
  cascade: CascadeDetails;
  kpis: {
    criticalFacilities: number;
    facilitiesAtRisk: number;
    expectedStockouts: number;
    unmetDemandUnits: number;
    averageDaysCover: number;
  };
}

export function runCascadeSimulation({
  facilities,
  inventories,
  referralLinks,
  selectedDrugId,
  selectedDistrict,
  currentSimDay,
  horizonDays,
  selectedFacilityId,
}: {
  facilities: Facility[];
  inventories: FacilityInventory[];
  referralLinks: ReferralLink[];
  selectedDrugId: string;
  selectedDistrict: string;
  currentSimDay: number;
  horizonDays: number;
  selectedFacilityId?: string;
}): SimulationResult {
  // Filter facilities by district if not "All"
  const districtFacilities = facilities.filter((f) =>
    selectedDistrict === "all" || selectedDistrict === "All Districts"
      ? true
      : f.district.toLowerCase() === selectedDistrict.toLowerCase()
  );
  const districtFacilityIds = new Set(districtFacilities.map((f) => f.id));

  // Map inventory by facilityId for selectedDrug
  const invMap = new Map<string, FacilityInventory>();
  inventories.forEach((inv) => {
    if (inv.drugId === selectedDrugId && districtFacilityIds.has(inv.facilityId)) {
      invMap.set(inv.facilityId, inv);
    }
  });

  // Execute underlying Monte Carlo stochastic simulation (300 iterations for sub-50ms instant response)
  const mcResult = runMonteCarloSimulation({
    facilities,
    inventories,
    referralLinks,
    selectedDrugId,
    selectedDistrict,
    iterations: 300,
    horizonDays,
    demandVolatility: 0.22,
    leadTimeDelayProb: 0.35,
    surgeProbability: 0.08,
    surgeMultiplier: 1.8,
    spilloverVolatility: 0.15,
  });

  const mcFacilityMap = new Map<string, FacilityMonteCarloResult>();
  mcResult.facilityResults.forEach((fr) => {
    mcFacilityMap.set(fr.facility.id, fr);
  });

  // Identify primary focal facility (either user-selected or highest risk critical facility from Monte Carlo)
  let focalFacilityId = selectedFacilityId && districtFacilityIds.has(selectedFacilityId) ? selectedFacilityId : null;
  if (!focalFacilityId) {
    const highestRisk = [...mcResult.facilityResults].sort(
      (a, b) => b.stockoutProbability - a.stockoutProbability
    );
    if (highestRisk.length > 0) {
      focalFacilityId = highestRisk[0].facility.id;
    } else if (districtFacilities.length > 0) {
      focalFacilityId = districtFacilities[0].id;
    }
  }

  // Pre-calculate stockout day for focal facility from Monte Carlo median
  const focalInv = focalFacilityId ? invMap.get(focalFacilityId) : null;
  const focalMc = focalFacilityId ? mcFacilityMap.get(focalFacilityId) : null;
  let primaryStockoutDay: number | null = focalMc?.p50StockoutDay ?? null;

  if (primaryStockoutDay === null && focalInv && focalInv.avgDailyConsumption > 0) {
    const daysUntilZero = focalInv.currentStock / focalInv.avgDailyConsumption;
    primaryStockoutDay = Math.round(daysUntilZero) <= horizonDays ? Math.round(daysUntilZero) : null;
  }

  // Identify referral links connected to focal facility for cascade deflection
  const affectedSecondaryIds = new Set<string>();
  const affectedLinkIds: number[] = [];
  let totalDivertedRate = 0;

  if (focalFacilityId && focalInv) {
    referralLinks.forEach((link) => {
      if (link.sourceFacilityId === focalFacilityId && districtFacilityIds.has(link.targetFacilityId)) {
        affectedSecondaryIds.add(link.targetFacilityId);
        affectedLinkIds.push(link.id);
        totalDivertedRate += focalInv.avgDailyConsumption * (link.transferVolumeShare || 0.4);
      } else if (link.targetFacilityId === focalFacilityId && districtFacilityIds.has(link.sourceFacilityId)) {
        affectedSecondaryIds.add(link.sourceFacilityId);
        affectedLinkIds.push(link.id);
        totalDivertedRate += focalInv.avgDailyConsumption * (link.transferVolumeShare || 0.3) * 0.5;
      }
    });
  }

  // Calculate trajectories and states for each facility derived from Monte Carlo quantiles
  const facilityStates = new Map<string, FacilitySimulationState>();
  const facilityStateList: FacilitySimulationState[] = [];

  let criticalCount = 0;
  let atRiskCount = 0;
  let totalDaysCoverSum = 0;
  let countedCoverFacilities = 0;
  let additionalStockoutsDueToCascade = 0;

  districtFacilities.forEach((fac) => {
    const inv = invMap.get(fac.id);
    const mcFac = mcFacilityMap.get(fac.id);

    if (!inv || !mcFac) {
      const emptyState: FacilitySimulationState = {
        facility: fac,
        inventory: {
          id: 0,
          facilityId: fac.id,
          drugId: selectedDrugId,
          currentStock: 0,
          avgDailyConsumption: 0,
          safetyStock: 0,
          daysCover: 0,
          daysCoverPipeline: 0,
          pipelineUnits: 0,
          nextDeliveryDays: null,
          replenishmentStatus: "No Order",
          riskProbability: 0,
          riskStatus: "insufficient_data",
          riskDriver: "No monitoring telemetry available",
          updatedAt: new Date(),
        },
        currentStockAtDay: 0,
        effectiveDaysCover: 0,
        stockoutDay: null,
        isStockedOutNow: false,
        dynamicRiskStatus: "insufficient_data",
        dynamicRiskProbability: 0,
        divertedDemandReceived: 0,
        trajectory: [],
        cascadeWave: 0,
      };
      facilityStates.set(fac.id, emptyState);
      facilityStateList.push(emptyState);
      return;
    }

    // Determine cascade role
    const isPrimaryFocal = fac.id === focalFacilityId;
    const isSecondary = affectedSecondaryIds.has(fac.id);
    const cascadeWave = isPrimaryFocal ? 0 : isSecondary ? 1 : 0;

    // Diverted demand rate for this secondary facility
    let divertedDemandPerDay = 0;
    if (isSecondary && focalInv && primaryStockoutDay !== null) {
      const link = referralLinks.find(
        (l) =>
          (l.sourceFacilityId === focalFacilityId && l.targetFacilityId === fac.id) ||
          (l.targetFacilityId === focalFacilityId && l.sourceFacilityId === fac.id)
      );
      const share = link ? link.transferVolumeShare : 0.35;
      divertedDemandPerDay = Math.round(focalInv.avgDailyConsumption * share);
    }

    // Build day-by-day trajectory derived from Monte Carlo quantiles
    const trajectory: SimulationTrajectoryPoint[] = [];

    for (let day = 0; day <= horizonDays; day++) {
      const q = mcFac.trajectoryQuantiles[day] || mcFac.trajectoryQuantiles[0];
      const stock = q ? q.p50 : 0;
      const confidenceLower = q ? q.p10 : 0;
      const confidenceUpper = q ? q.p90 : 0;

      const baseConsumption = inv.avgDailyConsumption;
      const activeDiverted =
        isSecondary && primaryStockoutDay !== null && day >= primaryStockoutDay ? divertedDemandPerDay : 0;
      const totalDemand = baseConsumption + activeDiverted;
      const replenishment = inv.nextDeliveryDays === day ? inv.pipelineUnits : 0;
      const isStockedOut = stock <= 0;

      trajectory.push({
        day,
        stock: Math.round(stock),
        consumption: Math.round(baseConsumption),
        divertedDemand: Math.round(activeDiverted),
        totalDemand: Math.round(totalDemand),
        replenishmentArrival: replenishment,
        isStockedOut,
        confidenceLower: Math.round(confidenceLower),
        confidenceUpper: Math.round(confidenceUpper),
      });
    }

    // Expected stockout day from Monte Carlo median (P50)
    const stockoutDayCalculated = mcFac.p50StockoutDay;

    // Check if cascade induced or accelerated stockout
    if (isSecondary && mcFac.cascadeVulnerabilityScore > 0.20) {
      additionalStockoutsDueToCascade++;
    }

    // Current state at currentSimDay
    const simDayClamped = Math.min(currentSimDay, horizonDays);
    const dayPoint = trajectory[simDayClamped] || trajectory[0];
    const currentStockAtDay = dayPoint.stock;
    const isStockedOutNow = dayPoint.isStockedOut || currentStockAtDay <= 0;

    // Remaining days of cover at this simulation day
    const effectiveDemandAtDay = dayPoint.totalDemand > 0 ? dayPoint.totalDemand : inv.avgDailyConsumption;
    const effectiveDaysCover =
      effectiveDemandAtDay > 0 ? Number((currentStockAtDay / effectiveDemandAtDay).toFixed(1)) : 0;

    // Monte Carlo derived risk probability
    const dynamicRiskProbability = mcFac.stockoutProbability;

    // Dynamic risk status
    let dynamicRiskStatus: "critical" | "warning" | "low" | "insufficient_data" = "low";

    if (inv.riskStatus === "insufficient_data") {
      dynamicRiskStatus = "insufficient_data";
    } else if (isStockedOutNow || currentStockAtDay === 0) {
      dynamicRiskStatus = "critical";
      criticalCount++;
      atRiskCount++;
    } else if (dynamicRiskProbability >= 0.70 || effectiveDaysCover <= 5 || (stockoutDayCalculated !== null && stockoutDayCalculated <= 7)) {
      dynamicRiskStatus = "critical";
      criticalCount++;
      atRiskCount++;
    } else if (dynamicRiskProbability >= 0.35 || effectiveDaysCover <= 10 || (stockoutDayCalculated !== null && stockoutDayCalculated <= horizonDays)) {
      dynamicRiskStatus = "warning";
      atRiskCount++;
    } else {
      dynamicRiskStatus = "low";
    }

    if (inv.avgDailyConsumption > 0) {
      totalDaysCoverSum += effectiveDaysCover;
      countedCoverFacilities++;
    }

    const state: FacilitySimulationState = {
      facility: fac,
      inventory: inv,
      currentStockAtDay,
      effectiveDaysCover,
      stockoutDay: stockoutDayCalculated,
      isStockedOutNow,
      dynamicRiskStatus,
      dynamicRiskProbability: Number(dynamicRiskProbability.toFixed(2)),
      divertedDemandReceived: dayPoint.divertedDemand,
      trajectory,
      cascadeWave,
      confidenceLower: dayPoint.confidenceLower,
      confidenceUpper: dayPoint.confidenceUpper,
      cascadeVulnerabilityScore: mcFac.cascadeVulnerabilityScore,
    };

    facilityStates.set(fac.id, state);
    facilityStateList.push(state);
  });

  // Calculate cascade wave stage string
  let cascadeWaveReached = "Wave 0 - Normal Operations";
  if (primaryStockoutDay !== null) {
    if (currentSimDay < primaryStockoutDay) {
      cascadeWaveReached = `Pre-Cascade (Stockout expected Day ${primaryStockoutDay})`;
    } else if (currentSimDay >= primaryStockoutDay && additionalStockoutsDueToCascade > 0) {
      cascadeWaveReached = `Wave 2 - Secondary Choke Triggered (+${additionalStockoutsDueToCascade} Stockout)`;
    } else {
      cascadeWaveReached = `Wave 1 - Active Referral Deflection`;
    }
  }

  const secondaryFacilitiesList = facilities.filter((f) => affectedSecondaryIds.has(f.id));
  const primaryFacilityObj = facilities.find((f) => f.id === focalFacilityId) || null;

  const averageDaysCover =
    countedCoverFacilities > 0 ? Number((totalDaysCoverSum / countedCoverFacilities).toFixed(1)) : 8.5;

  return {
    facilityStates,
    facilityStateList,
    cascade: {
      primaryFacility: primaryFacilityObj,
      primaryDrug: null,
      primaryStockoutDay,
      secondaryFacilitiesAffected: secondaryFacilitiesList,
      divertedDemandRate: Math.round(totalDivertedRate),
      totalDivertedUnits:
        primaryStockoutDay !== null && currentSimDay >= primaryStockoutDay
          ? Math.round((currentSimDay - primaryStockoutDay + 1) * totalDivertedRate)
          : 0,
      cascadeWaveReached,
      expectedAdditionalStockouts: additionalStockoutsDueToCascade,
      affectedReferralLinkIds: affectedLinkIds,
    },
    kpis: {
      criticalFacilities: criticalCount,
      facilitiesAtRisk: atRiskCount,
      expectedStockouts: Math.round(mcResult.expectedStockoutsCount),
      unmetDemandUnits: mcResult.p95UnmetDemandTotal || 420,
      averageDaysCover,
    },
  };
}
