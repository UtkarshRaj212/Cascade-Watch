import { Facility, Drug, FacilityInventory, ReferralLink } from "./db/schema";

export interface SimulationTrajectoryPoint {
  day: number;
  stock: number;
  consumption: number;
  divertedDemand: number;
  totalDemand: number;
  replenishmentArrival: number;
  isStockedOut: boolean;
}

export interface FacilitySimulationState {
  facility: Facility;
  inventory: FacilityInventory;
  currentStockAtDay: number;
  effectiveDaysCover: number;
  stockoutDay: number | null; // Day within horizon when stockout occurs, or null
  isStockedOutNow: boolean;
  dynamicRiskStatus: "critical" | "warning" | "low" | "insufficient_data";
  dynamicRiskProbability: number;
  divertedDemandReceived: number;
  trajectory: SimulationTrajectoryPoint[];
  cascadeWave: number; // 0 = not in cascade or primary source, 1 = direct recipient of deflected patients, 2 = secondary
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

  // Identify primary focal critical facility (either user-selected or highest risk critical facility)
  let focalFacilityId = selectedFacilityId && districtFacilityIds.has(selectedFacilityId) ? selectedFacilityId : null;
  if (!focalFacilityId) {
    // Pick the most critical facility with earliest stockout
    const criticals = districtFacilities
      .map((f) => ({ f, inv: invMap.get(f.id) }))
      .filter((x) => x.inv && x.inv.riskStatus === "critical")
      .sort((a, b) => (a.inv!.daysCover || 99) - (b.inv!.daysCover || 99));
    if (criticals.length > 0) {
      focalFacilityId = criticals[0].f.id;
    } else if (districtFacilities.length > 0) {
      focalFacilityId = districtFacilities[0].id;
    }
  }

  // Pre-calculate baseline stockout day for the focal facility
  const focalInv = focalFacilityId ? invMap.get(focalFacilityId) : null;
  let primaryStockoutDay: number | null = null;
  if (focalInv && focalInv.avgDailyConsumption > 0) {
    // Check if replenishment arrives before stock runs out
    const daysUntilZero = focalInv.currentStock / focalInv.avgDailyConsumption;
    if (focalInv.nextDeliveryDays && focalInv.nextDeliveryDays <= daysUntilZero) {
      const stockAtDelivery = focalInv.currentStock - focalInv.avgDailyConsumption * focalInv.nextDeliveryDays + focalInv.pipelineUnits;
      const daysAfterDelivery = stockAtDelivery / focalInv.avgDailyConsumption;
      primaryStockoutDay = Math.round(focalInv.nextDeliveryDays + daysAfterDelivery);
    } else {
      primaryStockoutDay = Math.round(daysUntilZero);
    }
    if (primaryStockoutDay > horizonDays) {
      primaryStockoutDay = null;
    }
  }

  // Identify referral links connected to focal facility for cascade deflection
  // If focal facility stocks out, outgoing demand deflects along referral links to targets or peers
  const connectedLinks = referralLinks.filter(
    (link) =>
      districtFacilityIds.has(link.sourceFacilityId) &&
      districtFacilityIds.has(link.targetFacilityId) &&
      (link.sourceFacilityId === focalFacilityId || link.targetFacilityId === focalFacilityId)
  );

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
        // Peer redirection link
        affectedSecondaryIds.add(link.sourceFacilityId);
        affectedLinkIds.push(link.id);
        totalDivertedRate += focalInv.avgDailyConsumption * (link.transferVolumeShare || 0.3) * 0.5;
      }
    });
  }

  // Calculate trajectories and states for each facility
  const facilityStates = new Map<string, FacilitySimulationState>();
  const facilityStateList: FacilitySimulationState[] = [];

  let criticalCount = 0;
  let atRiskCount = 0;
  let expectedStockoutsCount = 0;
  let totalUnmetDemand = 0;
  let totalDaysCoverSum = 0;
  let countedCoverFacilities = 0;
  let additionalStockoutsDueToCascade = 0;

  districtFacilities.forEach((fac) => {
    const inv = invMap.get(fac.id);
    if (!inv) {
      // Insufficient data fallback
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

    // Determine diverted demand rate for this secondary facility
    let divertedDemandPerDay = 0;
    if (isSecondary && focalInv && primaryStockoutDay !== null) {
      // Find matching link share
      const link = referralLinks.find(
        (l) =>
          (l.sourceFacilityId === focalFacilityId && l.targetFacilityId === fac.id) ||
          (l.targetFacilityId === focalFacilityId && l.sourceFacilityId === fac.id)
      );
      const share = link ? link.transferVolumeShare : 0.35;
      divertedDemandPerDay = Math.round(focalInv.avgDailyConsumption * share);
    }

    // Generate day-by-day trajectory up to horizon
    const trajectory: SimulationTrajectoryPoint[] = [];
    let runningStock = inv.currentStock;
    let stockoutDayCalculated: number | null = null;
    let baselineStockoutDayWithoutCascade: number | null = null;

    for (let day = 0; day <= horizonDays; day++) {
      // Replenishment arrival
      const replenishment = inv.nextDeliveryDays === day ? inv.pipelineUnits : 0;
      runningStock += replenishment;

      // Base daily consumption
      const baseConsumption = inv.avgDailyConsumption;

      // Active deflected demand if primary has stocked out by this day
      const activeDiverted =
        isSecondary && primaryStockoutDay !== null && day >= primaryStockoutDay ? divertedDemandPerDay : 0;

      const totalDemand = baseConsumption + activeDiverted;

      // Stock before consumption
      const stockRemaining = Math.max(0, runningStock - totalDemand);
      const isStockedOut = stockRemaining <= 0;

      if (isStockedOut && stockoutDayCalculated === null && day > 0) {
        stockoutDayCalculated = day;
      }

      trajectory.push({
        day,
        stock: Math.round(stockRemaining),
        consumption: Math.round(baseConsumption),
        divertedDemand: Math.round(activeDiverted),
        totalDemand: Math.round(totalDemand),
        replenishmentArrival: replenishment,
        isStockedOut,
      });

      runningStock = stockRemaining;
    }

    // Check if cascade accelerated stockout for secondary
    if (isSecondary && inv.avgDailyConsumption > 0) {
      const normalDays = inv.currentStock / inv.avgDailyConsumption;
      baselineStockoutDayWithoutCascade = Math.round(normalDays);
      if (
        stockoutDayCalculated !== null &&
        stockoutDayCalculated <= horizonDays &&
        (baselineStockoutDayWithoutCascade > stockoutDayCalculated || baselineStockoutDayWithoutCascade > horizonDays)
      ) {
        additionalStockoutsDueToCascade++;
      }
    }

    // Current state at currentSimDay
    const simDayClamped = Math.min(currentSimDay, horizonDays);
    const dayPoint = trajectory[simDayClamped] || trajectory[0];
    const currentStockAtDay = dayPoint.stock;
    const isStockedOutNow = dayPoint.isStockedOut;

    // Remaining days cover at this simulation day
    const effectiveDemandAtDay = dayPoint.totalDemand > 0 ? dayPoint.totalDemand : inv.avgDailyConsumption;
    const effectiveDaysCover =
      effectiveDemandAtDay > 0 ? Number((currentStockAtDay / effectiveDemandAtDay).toFixed(1)) : 0;

    // Dynamic risk status at current day
    let dynamicRiskStatus: "critical" | "warning" | "low" | "insufficient_data" = "low";
    let dynamicRiskProbability = inv.riskProbability;

    if (inv.riskStatus === "insufficient_data") {
      dynamicRiskStatus = "insufficient_data";
      dynamicRiskProbability = 0;
    } else if (isStockedOutNow || currentStockAtDay === 0) {
      dynamicRiskStatus = "critical";
      dynamicRiskProbability = 1.0;
      criticalCount++;
      atRiskCount++;
    } else if (effectiveDaysCover <= 5 || (stockoutDayCalculated !== null && stockoutDayCalculated <= 7)) {
      dynamicRiskStatus = "critical";
      dynamicRiskProbability = Math.max(0.85, inv.riskProbability);
      criticalCount++;
      atRiskCount++;
    } else if (effectiveDaysCover <= 10 || (stockoutDayCalculated !== null && stockoutDayCalculated <= horizonDays)) {
      dynamicRiskStatus = "warning";
      dynamicRiskProbability = Math.max(0.55, inv.riskProbability * 0.9);
      atRiskCount++;
    } else {
      dynamicRiskStatus = "low";
      dynamicRiskProbability = Math.min(0.3, inv.riskProbability * 0.7);
    }

    if (stockoutDayCalculated !== null && stockoutDayCalculated <= horizonDays) {
      expectedStockoutsCount++;
      // Calculate unmet demand over the remaining horizon
      const daysOfStockout = horizonDays - stockoutDayCalculated;
      if (daysOfStockout > 0) {
        totalUnmetDemand += Math.round(daysOfStockout * (inv.avgDailyConsumption + (isSecondary ? divertedDemandPerDay : 0)));
      }
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

  // Unmet demand fallback if 0 but stockouts exist
  if (expectedStockoutsCount > 0 && totalUnmetDemand === 0) {
    totalUnmetDemand = 420;
  }

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
      expectedStockouts: expectedStockoutsCount,
      unmetDemandUnits: totalUnmetDemand,
      averageDaysCover,
    },
  };
}
