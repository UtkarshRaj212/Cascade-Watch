import { Facility, Drug, FacilityInventory } from "./db/schema";

export const REORDER_BUFFER_DAYS = 2;
export const NEARBY_RADIUS_KM = 10;

export interface ReorderAdvice {
  daysCover: number;
  daysUntilStockout: number;
  daysUntilSafetyStock: number;
  leadTimeDays: number;
  bufferDays: number;
  orderByInDays: number;
  isUrgent: boolean;
  recommendedOrderDate: Date;
  suggestedOrderQty: number;
  belowSafetyStock: boolean;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearbyFacilities(
  facility: Facility,
  facilities: Facility[],
  radiusKm: number = NEARBY_RADIUS_KM
): { facility: Facility; distanceKm: number }[] {
  return facilities
    .filter((f) => f.id !== facility.id)
    .map((f) => ({
      facility: f,
      distanceKm: haversineKm(
        facility.latitude,
        facility.longitude,
        f.latitude,
        f.longitude
      ),
    }))
    .filter((entry) => entry.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getNearbyFacilityStocks(
  facility: Facility,
  facilities: Facility[],
  inventories: FacilityInventory[],
  drugId: string,
  radiusKm: number = NEARBY_RADIUS_KM
): { facility: Facility; distanceKm: number; currentStock: number }[] {
  const nearby = getNearbyFacilities(facility, facilities, radiusKm);
  return nearby
    .map((entry) => {
      const inv = inventories.find(
        (i) => i.facilityId === entry.facility.id && i.drugId === drugId
      );
      return {
        facility: entry.facility,
        distanceKm: Math.round(entry.distanceKm * 10) / 10,
        currentStock: inv?.currentStock ?? 0,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function computeReorderAdvice(
  inventory: FacilityInventory,
  drug: Drug | undefined
): ReorderAdvice {
  const consumption = inventory.avgDailyConsumption;
  const leadTimeDays = drug?.leadTimeDays ?? 7;
  const bufferDays = REORDER_BUFFER_DAYS;

  const daysCover = consumption > 0 ? inventory.currentStock / consumption : 0;
  const daysUntilStockout = consumption > 0 ? Math.floor(daysCover) : Infinity;
  const daysUntilSafetyStock =
    consumption > 0
      ? (inventory.currentStock - inventory.safetyStock) / consumption
      : Infinity;
  const belowSafetyStock = inventory.currentStock < inventory.safetyStock;

  const orderByInDays = Math.ceil(daysUntilSafetyStock - leadTimeDays - bufferDays);
  const isUrgent = orderByInDays <= 0;
  const recommendedOrderDate = new Date();
  recommendedOrderDate.setDate(recommendedOrderDate.getDate() + orderByInDays);

  const suggestedOrderQty =
    consumption > 0
      ? Math.max(
          0,
          Math.ceil((leadTimeDays + bufferDays) * consumption) +
            Math.max(0, inventory.safetyStock - inventory.currentStock)
        )
      : 0;

  return {
    daysCover: Number(daysCover.toFixed(1)),
    daysUntilStockout: Number.isFinite(daysUntilStockout)
      ? daysUntilStockout
      : 0,
    daysUntilSafetyStock: Number(daysUntilSafetyStock.toFixed(1)),
    leadTimeDays,
    bufferDays,
    orderByInDays,
    isUrgent,
    recommendedOrderDate,
    suggestedOrderQty,
    belowSafetyStock,
  };
}

export interface DerivedInventoryFields {
  daysCover: number;
  daysCoverPipeline: number;
  riskStatus: "critical" | "warning" | "low";
  riskProbability: number;
  riskDriver: string;
  replenishmentStatus: "On Track" | "Delayed" | "Critical Delay" | "In Transit";
}

export function deriveInventoryFields(
  currentStock: number,
  avgDailyConsumption: number,
  pipelineUnits: number,
  replenishmentStatus: DerivedInventoryFields["replenishmentStatus"],
  nextDeliveryDays: number | null
): DerivedInventoryFields {
  const daysCover =
    avgDailyConsumption > 0
      ? Number((currentStock / avgDailyConsumption).toFixed(1))
      : 0;
  const daysCoverPipeline =
    avgDailyConsumption > 0
      ? Number(((currentStock + pipelineUnits) / avgDailyConsumption).toFixed(1))
      : 0;

  let riskStatus: DerivedInventoryFields["riskStatus"];
  if (currentStock <= 0 || daysCover <= 5.5) {
    riskStatus = "critical";
  } else if (daysCover <= 14) {
    riskStatus = "warning";
  } else {
    riskStatus = "low";
  }

  const riskProbability =
    riskStatus === "critical" ? 0.88 : riskStatus === "warning" ? 0.5 : 0.1;

  let riskDriver = `Stock at ${daysCover} days cover (${currentStock} ${avgDailyConsumption > 0 ? "units" : "unknown"});`;
  if (replenishmentStatus === "Critical Delay") {
    riskDriver += " critical replenishment delay flagged";
  } else if (replenishmentStatus === "Delayed") {
    riskDriver += " replenishment delayed; reorder recommended";
  } else if (nextDeliveryDays !== null) {
    riskDriver += ` next delivery expected in ${nextDeliveryDays} day(s)`;
  } else {
    riskDriver += " no scheduled delivery; monitor closely";
  }

  return {
    daysCover,
    daysCoverPipeline,
    riskStatus,
    riskProbability,
    riskDriver,
    replenishmentStatus,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}