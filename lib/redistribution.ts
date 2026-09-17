import { Facility, Drug, FacilityInventory, ReferralLink } from "./db/schema";
import { FacilitySimulationState } from "./simulation";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

export type UrgencyTier = "emergency" | "urgent" | "moderate" | "advisory";

export interface TransferRecommendation {
  id: string;
  type: "transfer";
  urgency: UrgencyTier;
  sourceFacility: Facility;
  targetFacility: Facility;
  quantity: number; // units to transfer
  drug: Drug;
  transitTimeHours: number;
  rationale: string;
  impactDaysCoverGained: number; // estimated days of cover the target gains
  sourceRemainingDaysCover: number; // donor's remaining days cover after transfer
  costScore: number; // lower is better (considers distance, urgency, volume)
  referralLinkId: number | null;
}

export interface EmergencyProcurementRecommendation {
  id: string;
  type: "procurement";
  urgency: UrgencyTier;
  facility: Facility;
  drug: Drug;
  quantityNeeded: number;
  rationale: string;
  daysUntilStockout: number | null;
  currentStock: number;
  dailyConsumption: number;
  safetyStock: number;
}

export type ActionRecommendation = TransferRecommendation | EmergencyProcurementRecommendation;

export interface RedistributionPlan {
  generatedAt: string;
  drugId: string;
  drugName: string;
  district: string;
  totalSurplusFacilities: number;
  totalDeficitFacilities: number;
  totalTransferableUnits: number;
  totalDeficitUnits: number;
  coverageRatio: number; // transferable / deficit (1.0 = fully coverable)
  actions: ActionRecommendation[];
  summary: {
    transfers: number;
    procurements: number;
    emergencyActions: number;
    totalUnitsRedistributed: number;
    facilitiesStabilized: number; // deficit facilities fully covered by transfers
  };
}

// ────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────

interface SurplusCandidate {
  facility: Facility;
  inventory: FacilityInventory;
  state: FacilitySimulationState;
  availableSurplus: number; // stock above own safety needs
  daysCover: number;
}

interface DeficitCandidate {
  facility: Facility;
  inventory: FacilityInventory;
  state: FacilitySimulationState;
  deficitUnits: number; // units needed to reach safety stock
  daysUntilStockout: number | null;
  urgency: UrgencyTier;
}

function classifyUrgency(
  daysCover: number,
  riskProbability: number,
  isStockedOut: boolean,
  stockoutDay: number | null,
  currentSimDay: number
): UrgencyTier {
  if (isStockedOut) return "emergency";
  if (stockoutDay !== null && stockoutDay - currentSimDay <= 3) return "emergency";
  if (daysCover <= 5 || riskProbability >= 0.75) return "urgent";
  if (daysCover <= 10 || riskProbability >= 0.45) return "moderate";
  return "advisory";
}

function urgencyPriority(u: UrgencyTier): number {
  switch (u) {
    case "emergency": return 0;
    case "urgent": return 1;
    case "moderate": return 2;
    case "advisory": return 3;
  }
}

// ────────────────────────────────────────────────
// Main redistribution algorithm
// ────────────────────────────────────────────────

export function computeRedistributionPlan({
  facilityStates,
  inventories,
  referralLinks,
  drug,
  district,
  currentSimDay,
}: {
  facilityStates: FacilitySimulationState[];
  inventories: FacilityInventory[];
  referralLinks: ReferralLink[];
  drug: Drug;
  district: string;
  currentSimDay: number;
}): RedistributionPlan {
  // Build lookup maps
  const invMap = new Map<string, FacilityInventory>();
  inventories.forEach((inv) => {
    if (inv.drugId === drug.id) invMap.set(inv.facilityId, inv);
  });

  // Build referral link adjacency with transit time lookups
  // key: "sourceId->targetId", value: { link, transitTime }
  const linkLookup = new Map<string, { link: ReferralLink; transitTime: number }>();
  referralLinks.forEach((l) => {
    linkLookup.set(`${l.sourceFacilityId}->${l.targetFacilityId}`, {
      link: l,
      transitTime: l.transferTimeHours,
    });
    // Bidirectional for redistribution (can ship either way)
    if (!linkLookup.has(`${l.targetFacilityId}->${l.sourceFacilityId}`)) {
      linkLookup.set(`${l.targetFacilityId}->${l.sourceFacilityId}`, {
        link: l,
        transitTime: l.transferTimeHours * 1.2, // reverse route is slightly slower
      });
    }
  });

  // ── Step 1: Classify facilities ──

  const surplusCandidates: SurplusCandidate[] = [];
  const deficitCandidates: DeficitCandidate[] = [];

  facilityStates.forEach((state) => {
    const inv = invMap.get(state.facility.id);
    if (!inv || inv.avgDailyConsumption <= 0) return;

    const safetyNeed = inv.safetyStock;
    const daysCover = state.effectiveDaysCover;

    if (
      state.dynamicRiskStatus === "low" &&
      daysCover > drug.safetyStockDays * 1.5 &&
      inv.currentStock > safetyNeed * 1.5
    ) {
      // Surplus: this facility can afford to donate
      // Available surplus = current stock - (safety stock + 7 days consumption buffer)
      const retainBuffer = safetyNeed + Math.ceil(inv.avgDailyConsumption * 7);
      const surplus = Math.max(0, inv.currentStock - retainBuffer);
      if (surplus > 0) {
        surplusCandidates.push({
          facility: state.facility,
          inventory: inv,
          state,
          availableSurplus: surplus,
          daysCover,
        });
      }
    } else if (
      state.dynamicRiskStatus === "critical" ||
      state.dynamicRiskStatus === "warning"
    ) {
      // Deficit: this facility needs stock
      const deficit = Math.max(0, safetyNeed - inv.currentStock);
      // Even if current stock > safety stock, if risk is critical, they need buffer
      const effectiveDeficit = deficit > 0
        ? deficit
        : Math.ceil(inv.avgDailyConsumption * Math.max(3, drug.safetyStockDays - daysCover));

      if (effectiveDeficit > 0) {
        const urgency = classifyUrgency(
          daysCover,
          state.dynamicRiskProbability,
          state.isStockedOutNow,
          state.stockoutDay,
          currentSimDay
        );

        deficitCandidates.push({
          facility: state.facility,
          inventory: inv,
          state,
          deficitUnits: effectiveDeficit,
          daysUntilStockout: state.stockoutDay !== null ? Math.max(0, state.stockoutDay - currentSimDay) : null,
          urgency,
        });
      }
    }
  });

  // Sort deficit candidates by urgency (emergency first), then by days until stockout
  deficitCandidates.sort((a, b) => {
    const urgDiff = urgencyPriority(a.urgency) - urgencyPriority(b.urgency);
    if (urgDiff !== 0) return urgDiff;
    const daysA = a.daysUntilStockout ?? 999;
    const daysB = b.daysUntilStockout ?? 999;
    return daysA - daysB;
  });

  // Sort surplus candidates by available surplus descending
  surplusCandidates.sort((a, b) => b.availableSurplus - a.availableSurplus);

  // ── Step 2: Greedy matching — assign surplus to deficit ──

  const transfers: TransferRecommendation[] = [];
  const procurements: EmergencyProcurementRecommendation[] = [];

  // Track remaining surplus per donor
  const remainingSurplus = new Map<string, number>();
  surplusCandidates.forEach((s) => remainingSurplus.set(s.facility.id, s.availableSurplus));

  let recId = 0;
  let facilitiesStabilized = 0;

  deficitCandidates.forEach((deficit) => {
    let remainingNeed = deficit.deficitUnits;

    // Find best donors for this deficit facility
    // Score donors by: (1) has referral link (preferred), (2) transit time, (3) surplus available
    const scoredDonors = surplusCandidates
      .filter((s) => (remainingSurplus.get(s.facility.id) || 0) > 0)
      .map((s) => {
        const linkKey = `${s.facility.id}->${deficit.facility.id}`;
        const reverseLinkKey = `${deficit.facility.id}->${s.facility.id}`;
        const directLink = linkLookup.get(linkKey);
        const reverseLink = linkLookup.get(reverseLinkKey);
        const bestLink = directLink || reverseLink;

        // Transit time: use link if available, otherwise estimate from distance
        const transitTime = bestLink ? bestLink.transitTime : estimateTransitTime(s.facility, deficit.facility);

        // Cost score: lower is better
        // Prioritize: existing referral paths, short transit, large surplus
        const hasLinkBonus = bestLink ? 0 : 5;
        const costScore = transitTime + hasLinkBonus - (remainingSurplus.get(s.facility.id) || 0) / 1000;

        return {
          surplus: s,
          transitTime,
          costScore,
          linkId: bestLink?.link.id ?? null,
        };
      })
      .sort((a, b) => a.costScore - b.costScore);

    // Allocate from best donors
    for (const donor of scoredDonors) {
      if (remainingNeed <= 0) break;

      const available = remainingSurplus.get(donor.surplus.facility.id) || 0;
      if (available <= 0) continue;

      const transferQty = Math.min(available, remainingNeed);
      const daysCoverGained = deficit.inventory.avgDailyConsumption > 0
        ? Number((transferQty / deficit.inventory.avgDailyConsumption).toFixed(1))
        : 0;

      const donorInv = donor.surplus.inventory;
      const donorStockAfter = donorInv.currentStock - (donor.surplus.availableSurplus - available + transferQty);
      const donorDaysCoverAfter = donorInv.avgDailyConsumption > 0
        ? Number((Math.max(0, donorStockAfter) / donorInv.avgDailyConsumption).toFixed(1))
        : 0;

      transfers.push({
        id: `transfer-${++recId}`,
        type: "transfer",
        urgency: deficit.urgency,
        sourceFacility: donor.surplus.facility,
        targetFacility: deficit.facility,
        quantity: transferQty,
        drug,
        transitTimeHours: donor.transitTime,
        rationale: buildTransferRationale(deficit, donor.surplus, transferQty, donor.transitTime),
        impactDaysCoverGained: daysCoverGained,
        sourceRemainingDaysCover: donorDaysCoverAfter,
        costScore: donor.costScore,
        referralLinkId: donor.linkId,
      });

      remainingSurplus.set(donor.surplus.facility.id, available - transferQty);
      remainingNeed -= transferQty;
    }

    if (remainingNeed <= 0) {
      facilitiesStabilized++;
    }

    // If redistribution wasn't enough, generate emergency procurement
    if (remainingNeed > 0) {
      procurements.push({
        id: `procurement-${++recId}`,
        type: "procurement",
        urgency: deficit.urgency === "emergency" ? "emergency" : "urgent",
        facility: deficit.facility,
        drug,
        quantityNeeded: remainingNeed,
        rationale: buildProcurementRationale(deficit, remainingNeed),
        daysUntilStockout: deficit.daysUntilStockout,
        currentStock: deficit.inventory.currentStock,
        dailyConsumption: deficit.inventory.avgDailyConsumption,
        safetyStock: deficit.inventory.safetyStock,
      });
    }
  });

  // ── Step 3: Merge and sort final action list ──

  const allActions: ActionRecommendation[] = [
    ...procurements, // procurement first (can't be solved internally)
    ...transfers,
  ];

  // Sort by urgency tier, then by type (procurement before transfer for same urgency)
  allActions.sort((a, b) => {
    const urgDiff = urgencyPriority(a.urgency) - urgencyPriority(b.urgency);
    if (urgDiff !== 0) return urgDiff;
    if (a.type === "procurement" && b.type === "transfer") return -1;
    if (a.type === "transfer" && b.type === "procurement") return 1;
    return 0;
  });

  const totalTransferableUnits = surplusCandidates.reduce((sum, s) => sum + s.availableSurplus, 0);
  const totalDeficitUnits = deficitCandidates.reduce((sum, d) => sum + d.deficitUnits, 0);

  return {
    generatedAt: new Date().toISOString(),
    drugId: drug.id,
    drugName: drug.name,
    district,
    totalSurplusFacilities: surplusCandidates.length,
    totalDeficitFacilities: deficitCandidates.length,
    totalTransferableUnits,
    totalDeficitUnits,
    coverageRatio: totalDeficitUnits > 0 ? Number((totalTransferableUnits / totalDeficitUnits).toFixed(2)) : 1,
    actions: allActions,
    summary: {
      transfers: transfers.length,
      procurements: procurements.length,
      emergencyActions: allActions.filter((a) => a.urgency === "emergency").length,
      totalUnitsRedistributed: transfers.reduce((sum, t) => sum + t.quantity, 0),
      facilitiesStabilized,
    },
  };
}

// ────────────────────────────────────────────────
// Helper functions
// ────────────────────────────────────────────────

function estimateTransitTime(a: Facility, b: Facility): number {
  // Haversine-based rough estimate: ~40 km/h average ground speed
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const dist = 2 * R * Math.asin(Math.sqrt(hav));

  // Road distance ~1.3x straight-line, average 40 km/h
  return Number(((dist * 1.3) / 40).toFixed(1));
}

function buildTransferRationale(
  deficit: DeficitCandidate,
  surplus: SurplusCandidate,
  qty: number,
  transitHours: number
): string {
  const target = deficit.facility.name;
  const source = surplus.facility.name;
  const daysLeft = deficit.daysUntilStockout;

  if (deficit.state.isStockedOutNow) {
    return `${target} is currently STOCKED OUT. Emergency lateral transfer of ${qty} ${deficit.inventory.drugId ? "units" : "units"} from ${source} (${surplus.daysCover.toFixed(0)}d cover surplus) can restore supply within ${transitHours}h.`;
  }

  if (daysLeft !== null && daysLeft <= 5) {
    return `${target} will stock out in ${daysLeft} days. Urgent redistribution of ${qty} units from ${source} extends coverage and prevents cascade to downstream facilities.`;
  }

  return `Proactive transfer of ${qty} units from ${source} to ${target} to restore safety buffer. ${source} retains adequate reserves after transfer.`;
}

function buildProcurementRationale(deficit: DeficitCandidate, unmetQty: number): string {
  const name = deficit.facility.name;
  const daysLeft = deficit.daysUntilStockout;

  if (deficit.state.isStockedOutNow) {
    return `${name} is STOCKED OUT and internal redistribution cannot fully cover the gap. Emergency procurement of ${unmetQty} units required immediately.`;
  }

  if (daysLeft !== null && daysLeft <= 5) {
    return `${name} faces stockout in ${daysLeft} days. Network surplus is insufficient — ${unmetQty} units must be procured externally to prevent service disruption.`;
  }

  return `${name} requires ${unmetQty} additional units beyond what internal redistribution can provide. Place supplementary order to restore safety stock levels.`;
}
