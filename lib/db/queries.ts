import { eq } from "drizzle-orm";
import {
  db,
  facilities,
  drugs,
  facilityInventories,
  referralLinks,
  monteCarloSimulations,
  monteCarloFacilityMetrics,
  monteCarloCascadeEdges,
} from "./index";

export interface DashboardDataPayload {
  facilities: (typeof facilities.$inferSelect)[];
  drugs: (typeof drugs.$inferSelect)[];
  inventories: (typeof facilityInventories.$inferSelect)[];
  referralLinks: (typeof referralLinks.$inferSelect)[];
  monteCarloScenarios: (typeof monteCarloSimulations.$inferSelect)[];
}

export async function getDashboardData(): Promise<DashboardDataPayload> {
  try {
    const [allFacilities, allDrugs, allInventories, allReferrals, allScenarios] = await Promise.all([
      db.select().from(facilities),
      db.select().from(drugs),
      db.select().from(facilityInventories),
      db.select().from(referralLinks),
      db.select().from(monteCarloSimulations),
    ]);

    if (allFacilities.length > 0 && allDrugs.length > 0) {
      return {
        facilities: allFacilities,
        drugs: allDrugs,
        inventories: allInventories,
        referralLinks: allReferrals,
        monteCarloScenarios: allScenarios,
      };
    }
  } catch (error) {
    console.error("Error fetching from Postgres/Drizzle, falling back to static cache:", error);
  }

  // Guaranteed fallback data matching seeded structure if DB connection times out
  return {
    facilities: [
      { id: "fac-pune-dh", code: "DH-PUN-01", name: "Aundh District Hospital", district: "Pune", facilityType: "District Hospital", tier: "Tertiary", latitude: 18.5793, longitude: 73.8055, bedCapacity: 450, catchmentPopulation: 850000, createdAt: new Date() },
      { id: "fac-pune-sdh-1", code: "SDH-BAR-02", name: "Baramati Sub-District Hospital", district: "Pune", facilityType: "Sub-District Hospital", tier: "Secondary", latitude: 18.1517, longitude: 74.5772, bedCapacity: 150, catchmentPopulation: 290000, createdAt: new Date() },
      { id: "fac-pune-sdh-2", code: "SDH-SHI-03", name: "Shirur Sub-District Hospital", district: "Pune", facilityType: "Sub-District Hospital", tier: "Secondary", latitude: 18.8274, longitude: 74.3776, bedCapacity: 100, catchmentPopulation: 210000, createdAt: new Date() },
      { id: "fac-pune-chc-1", code: "CHC-HAV-04", name: "Haveli Community Health Center", district: "Pune", facilityType: "Community Health Center", tier: "Secondary", latitude: 18.5204, longitude: 73.8567, bedCapacity: 50, catchmentPopulation: 140000, createdAt: new Date() },
      { id: "fac-pune-chc-2", code: "CHC-JUN-05", name: "Junnar Community Health Center", district: "Pune", facilityType: "Community Health Center", tier: "Secondary", latitude: 19.2081, longitude: 73.8765, bedCapacity: 45, catchmentPopulation: 125000, createdAt: new Date() },
      { id: "fac-pune-chc-3", code: "CHC-IND-06", name: "Indapur Rural Health Center", district: "Pune", facilityType: "Community Health Center", tier: "Secondary", latitude: 18.1158, longitude: 75.0343, bedCapacity: 40, catchmentPopulation: 110000, createdAt: new Date() },
      { id: "fac-pune-phc-1", code: "PHC-PAU-07", name: "Paud Primary Health Center", district: "Pune", facilityType: "Primary Health Center", tier: "Primary", latitude: 18.5324, longitude: 73.6144, bedCapacity: 16, catchmentPopulation: 38000, createdAt: new Date() },
      { id: "fac-pune-phc-2", code: "PHC-WAG-08", name: "Wagholi Primary Health Center", district: "Pune", facilityType: "Primary Health Center", tier: "Primary", latitude: 18.5808, longitude: 73.9787, bedCapacity: 12, catchmentPopulation: 45000, createdAt: new Date() },
      { id: "fac-pune-phc-3", code: "PHC-KHA-09", name: "Khadakwasla Health Center", district: "Pune", facilityType: "Primary Health Center", tier: "Primary", latitude: 18.4354, longitude: 73.7667, bedCapacity: 14, catchmentPopulation: 32000, createdAt: new Date() },
      { id: "fac-thane-dh", code: "DH-THA-10", name: "Thane Civil Hospital", district: "Thane", facilityType: "District Hospital", tier: "Tertiary", latitude: 19.1973, longitude: 72.9734, bedCapacity: 400, catchmentPopulation: 950000, createdAt: new Date() },
      { id: "fac-thane-sdh-1", code: "SDH-KAL-11", name: "Kalyan Sub-District Hospital", district: "Thane", facilityType: "Sub-District Hospital", tier: "Secondary", latitude: 19.2403, longitude: 73.1305, bedCapacity: 160, catchmentPopulation: 340000, createdAt: new Date() },
      { id: "fac-thane-chc-1", code: "CHC-BHI-12", name: "Bhiwandi Community Health Center", district: "Thane", facilityType: "Community Health Center", tier: "Secondary", latitude: 19.2967, longitude: 73.0631, bedCapacity: 60, catchmentPopulation: 220000, createdAt: new Date() },
      { id: "fac-thane-phc-1", code: "PHC-SHA-13", name: "Shahapur Primary Health Post", district: "Thane", facilityType: "Primary Health Center", tier: "Primary", latitude: 19.4539, longitude: 73.3283, bedCapacity: 18, catchmentPopulation: 42000, createdAt: new Date() },
    ],
    drugs: [
      { id: "drug-ceftriaxone", code: "MED-CEF-1G", name: "Ceftriaxone 1g Inj", category: "Critical Antibiotic", unit: "vials", leadTimeDays: 7, safetyStockDays: 10, createdAt: new Date() },
      { id: "drug-oxytocin", code: "MED-OXY-10IU", name: "Oxytocin 10 IU/ml", category: "Maternal Health", unit: "ampoules", leadTimeDays: 5, safetyStockDays: 12, createdAt: new Date() },
      { id: "drug-artesunate", code: "MED-ART-60MG", name: "Artesunate 60mg Inj", category: "Antimalarial Care", unit: "vials", leadTimeDays: 9, safetyStockDays: 14, createdAt: new Date() },
      { id: "drug-insulin", code: "MED-INS-40IU", name: "Insulin Regular 40 IU/ml", category: "Endocrine Critical", unit: "vials", leadTimeDays: 8, safetyStockDays: 15, createdAt: new Date() },
    ],
    inventories: [
      { id: 1, facilityId: "fac-pune-dh", drugId: "drug-ceftriaxone", currentStock: 384, avgDailyConsumption: 80, safetyStock: 800, daysCover: 4.8, daysCoverPipeline: 7.2, pipelineUnits: 200, nextDeliveryDays: 9, replenishmentStatus: "Delayed", riskProbability: 0.88, riskStatus: "critical", riskDriver: "Replenishment delay (6d overdue) + 38% patient surge", updatedAt: new Date() },
      { id: 2, facilityId: "fac-pune-chc-1", drugId: "drug-ceftriaxone", currentStock: 140, avgDailyConsumption: 22, safetyStock: 220, daysCover: 6.4, daysCoverPipeline: 10.5, pipelineUnits: 90, nextDeliveryDays: 5, replenishmentStatus: "Delayed", riskProbability: 0.74, riskStatus: "warning", riskDriver: "High vulnerability to Aundh DH deflection spillover", updatedAt: new Date() },
      { id: 3, facilityId: "fac-pune-sdh-1", drugId: "drug-ceftriaxone", currentStock: 480, avgDailyConsumption: 35, safetyStock: 350, daysCover: 13.7, daysCoverPipeline: 18.0, pipelineUnits: 150, nextDeliveryDays: 4, replenishmentStatus: "On Track", riskProbability: 0.42, riskStatus: "warning", riskDriver: "Secondary buffer under indirect referral pressure", updatedAt: new Date() },
      { id: 4, facilityId: "fac-pune-sdh-2", drugId: "drug-ceftriaxone", currentStock: 520, avgDailyConsumption: 28, safetyStock: 280, daysCover: 18.5, daysCoverPipeline: 24.2, pipelineUnits: 160, nextDeliveryDays: 6, replenishmentStatus: "On Track", riskProbability: 0.18, riskStatus: "low", riskDriver: "Normal burn rate with healthy reserve", updatedAt: new Date() },
      { id: 5, facilityId: "fac-pune-chc-2", drugId: "drug-ceftriaxone", currentStock: 75, avgDailyConsumption: 16, safetyStock: 160, daysCover: 4.7, daysCoverPipeline: 5.9, pipelineUnits: 20, nextDeliveryDays: 11, replenishmentStatus: "Delayed", riskProbability: 0.81, riskStatus: "critical", riskDriver: "Late procurement dispatch + regional transport choke", updatedAt: new Date() },
      { id: 6, facilityId: "fac-pune-chc-3", drugId: "drug-ceftriaxone", currentStock: 210, avgDailyConsumption: 14, safetyStock: 140, daysCover: 15.0, daysCoverPipeline: 20.0, pipelineUnits: 70, nextDeliveryDays: 8, replenishmentStatus: "On Track", riskProbability: 0.22, riskStatus: "low", riskDriver: "Balanced stock levels", updatedAt: new Date() },
      { id: 7, facilityId: "fac-pune-phc-1", drugId: "drug-ceftriaxone", currentStock: 24, avgDailyConsumption: 5, safetyStock: 50, daysCover: 4.8, daysCoverPipeline: 8.8, pipelineUnits: 20, nextDeliveryDays: 3, replenishmentStatus: "On Track", riskProbability: 0.65, riskStatus: "warning", riskDriver: "Low local buffer, dependent on Haveli CHC", updatedAt: new Date() },
      { id: 8, facilityId: "fac-pune-phc-2", drugId: "drug-ceftriaxone", currentStock: 68, avgDailyConsumption: 6, safetyStock: 60, daysCover: 11.3, daysCoverPipeline: 16.3, pipelineUnits: 30, nextDeliveryDays: 5, replenishmentStatus: "On Track", riskProbability: 0.25, riskStatus: "low", riskDriver: "Stable inventory profile", updatedAt: new Date() },
      { id: 9, facilityId: "fac-pune-phc-3", drugId: "drug-ceftriaxone", currentStock: 0, avgDailyConsumption: 0, safetyStock: 40, daysCover: 0, daysCoverPipeline: 0, pipelineUnits: 0, nextDeliveryDays: null, replenishmentStatus: "No Order", riskProbability: 0.0, riskStatus: "insufficient_data", riskDriver: "Electronic reporting feed offline (3 days)", updatedAt: new Date() },
      { id: 10, facilityId: "fac-thane-dh", drugId: "drug-ceftriaxone", currentStock: 290, avgDailyConsumption: 70, safetyStock: 700, daysCover: 4.1, daysCoverPipeline: 5.5, pipelineUnits: 100, nextDeliveryDays: 9, replenishmentStatus: "Critical Delay", riskProbability: 0.91, riskStatus: "critical", riskDriver: "Port logistics bottleneck + vendor manufacturing halt", updatedAt: new Date() },
      { id: 11, facilityId: "fac-thane-sdh-1", drugId: "drug-ceftriaxone", currentStock: 180, avgDailyConsumption: 28, safetyStock: 280, daysCover: 6.4, daysCoverPipeline: 10.0, pipelineUnits: 100, nextDeliveryDays: 4, replenishmentStatus: "Delayed", riskProbability: 0.72, riskStatus: "warning", riskDriver: "Secondary catchment spillover expected", updatedAt: new Date() },
      { id: 12, facilityId: "fac-thane-chc-1", drugId: "drug-ceftriaxone", currentStock: 110, avgDailyConsumption: 18, safetyStock: 180, daysCover: 6.1, daysCoverPipeline: 9.4, pipelineUnits: 60, nextDeliveryDays: 6, replenishmentStatus: "On Track", riskProbability: 0.61, riskStatus: "warning", riskDriver: "Rapid depletion on emergency trauma shift", updatedAt: new Date() },
      { id: 13, facilityId: "fac-thane-phc-1", drugId: "drug-ceftriaxone", currentStock: 45, avgDailyConsumption: 4, safetyStock: 40, daysCover: 11.2, daysCoverPipeline: 16.2, pipelineUnits: 20, nextDeliveryDays: 7, replenishmentStatus: "On Track", riskProbability: 0.28, riskStatus: "low", riskDriver: "Normal local dispensary buffer", updatedAt: new Date() },
      { id: 14, facilityId: "fac-pune-dh", drugId: "drug-oxytocin", currentStock: 820, avgDailyConsumption: 65, safetyStock: 650, daysCover: 12.6, daysCoverPipeline: 18.7, pipelineUnits: 400, nextDeliveryDays: 4, replenishmentStatus: "On Track", riskProbability: 0.29, riskStatus: "low", riskDriver: "Adequate cold-chain storage and regular replenishment", updatedAt: new Date() },
      { id: 15, facilityId: "fac-pune-chc-1", drugId: "drug-oxytocin", currentStock: 62, avgDailyConsumption: 20, safetyStock: 200, daysCover: 3.1, daysCoverPipeline: 4.6, pipelineUnits: 30, nextDeliveryDays: 8, replenishmentStatus: "Delayed", riskProbability: 0.89, riskStatus: "critical", riskDriver: "Cold-chain vehicle breakdown during inter-facility transit", updatedAt: new Date() },
      { id: 16, facilityId: "fac-pune-sdh-1", drugId: "drug-oxytocin", currentStock: 210, avgDailyConsumption: 25, safetyStock: 250, daysCover: 8.4, daysCoverPipeline: 12.0, pipelineUnits: 90, nextDeliveryDays: 6, replenishmentStatus: "On Track", riskProbability: 0.48, riskStatus: "warning", riskDriver: "Maternity ward admissions surge +19%", updatedAt: new Date() },
      { id: 17, facilityId: "fac-pune-dh", drugId: "drug-artesunate", currentStock: 95, avgDailyConsumption: 18, safetyStock: 180, daysCover: 5.2, daysCoverPipeline: 6.8, pipelineUnits: 30, nextDeliveryDays: 10, replenishmentStatus: "Delayed", riskProbability: 0.82, riskStatus: "critical", riskDriver: "Monsoon post-rainfall malaria cluster admissions", updatedAt: new Date() },
      { id: 18, facilityId: "fac-pune-chc-2", drugId: "drug-artesunate", currentStock: 120, avgDailyConsumption: 8, safetyStock: 80, daysCover: 15.0, daysCoverPipeline: 21.2, pipelineUnits: 50, nextDeliveryDays: 5, replenishmentStatus: "On Track", riskProbability: 0.21, riskStatus: "low", riskDriver: "Stable seasonal stock", updatedAt: new Date() },
      { id: 19, facilityId: "fac-pune-dh", drugId: "drug-insulin", currentStock: 310, avgDailyConsumption: 30, safetyStock: 300, daysCover: 10.3, daysCoverPipeline: 15.3, pipelineUnits: 150, nextDeliveryDays: 5, replenishmentStatus: "On Track", riskProbability: 0.35, riskStatus: "low", riskDriver: "Central warehouse dispatch scheduled", updatedAt: new Date() },
    ],
    referralLinks: [
      { id: 1, sourceFacilityId: "fac-pune-phc-1", targetFacilityId: "fac-pune-chc-1", transferTimeHours: 0.8, transferVolumeShare: 0.45, referralType: "primary_referral" },
      { id: 2, sourceFacilityId: "fac-pune-phc-1", targetFacilityId: "fac-pune-dh", transferTimeHours: 1.4, transferVolumeShare: 0.35, referralType: "tertiary_escalation" },
      { id: 3, sourceFacilityId: "fac-pune-phc-2", targetFacilityId: "fac-pune-chc-1", transferTimeHours: 0.6, transferVolumeShare: 0.50, referralType: "primary_referral" },
      { id: 4, sourceFacilityId: "fac-pune-phc-2", targetFacilityId: "fac-pune-dh", transferTimeHours: 1.1, transferVolumeShare: 0.40, referralType: "tertiary_escalation" },
      { id: 5, sourceFacilityId: "fac-pune-phc-3", targetFacilityId: "fac-pune-chc-1", transferTimeHours: 0.7, transferVolumeShare: 0.60, referralType: "primary_referral" },
      { id: 6, sourceFacilityId: "fac-pune-chc-1", targetFacilityId: "fac-pune-dh", transferTimeHours: 0.5, transferVolumeShare: 0.65, referralType: "tertiary_escalation" },
      { id: 7, sourceFacilityId: "fac-pune-chc-1", targetFacilityId: "fac-pune-sdh-1", transferTimeHours: 1.8, transferVolumeShare: 0.25, referralType: "peer_redirection" },
      { id: 8, sourceFacilityId: "fac-pune-chc-2", targetFacilityId: "fac-pune-sdh-2", transferTimeHours: 1.2, transferVolumeShare: 0.55, referralType: "secondary_escalation" },
      { id: 9, sourceFacilityId: "fac-pune-chc-2", targetFacilityId: "fac-pune-dh", transferTimeHours: 2.2, transferVolumeShare: 0.30, referralType: "tertiary_escalation" },
      { id: 10, sourceFacilityId: "fac-pune-chc-3", targetFacilityId: "fac-pune-sdh-1", transferTimeHours: 1.1, transferVolumeShare: 0.70, referralType: "secondary_escalation" },
      { id: 11, sourceFacilityId: "fac-pune-sdh-2", targetFacilityId: "fac-pune-dh", transferTimeHours: 1.6, transferVolumeShare: 0.50, referralType: "tertiary_escalation" },
      { id: 12, sourceFacilityId: "fac-pune-sdh-1", targetFacilityId: "fac-pune-dh", transferTimeHours: 2.0, transferVolumeShare: 0.45, referralType: "tertiary_escalation" },
      { id: 13, sourceFacilityId: "fac-thane-phc-1", targetFacilityId: "fac-thane-chc-1", transferTimeHours: 0.9, transferVolumeShare: 0.60, referralType: "primary_referral" },
      { id: 14, sourceFacilityId: "fac-thane-chc-1", targetFacilityId: "fac-thane-sdh-1", transferTimeHours: 0.8, transferVolumeShare: 0.50, referralType: "secondary_escalation" },
      { id: 15, sourceFacilityId: "fac-thane-chc-1", targetFacilityId: "fac-thane-dh", transferTimeHours: 1.1, transferVolumeShare: 0.40, referralType: "tertiary_escalation" },
      { id: 16, sourceFacilityId: "fac-thane-sdh-1", targetFacilityId: "fac-thane-dh", transferTimeHours: 0.7, transferVolumeShare: 0.65, referralType: "tertiary_escalation" },
    ],
    monteCarloScenarios: [
      { id: "mc-baseline-pune", scenarioName: "Baseline Operational Drift", district: "Pune", drugId: "drug-ceftriaxone", iterations: 500, horizonDays: 30, demandVolatility: 0.20, leadTimeDelayProb: 0.35, surgeProbability: 0.08, networkStockoutProbability: 0.88, expectedStockoutsCount: 3.4, p95UnmetDemand: 1850, createdAt: new Date() },
      { id: "mc-surge-pune", scenarioName: "Monsoon Epidemic & Surge Shock", district: "Pune", drugId: "drug-ceftriaxone", iterations: 500, horizonDays: 30, demandVolatility: 0.35, leadTimeDelayProb: 0.40, surgeProbability: 0.22, networkStockoutProbability: 0.98, expectedStockoutsCount: 5.2, p95UnmetDemand: 3400, createdAt: new Date() },
      { id: "mc-choke-thane", scenarioName: "Port Logistics & Supply Disruption", district: "Thane", drugId: "drug-ceftriaxone", iterations: 500, horizonDays: 30, demandVolatility: 0.18, leadTimeDelayProb: 0.70, surgeProbability: 0.06, networkStockoutProbability: 0.95, expectedStockoutsCount: 2.8, p95UnmetDemand: 1620, createdAt: new Date() },
      { id: "mc-all-ceftriaxone", scenarioName: "State-Wide Referral Cascade Stress Test", district: "all", drugId: "drug-ceftriaxone", iterations: 500, horizonDays: 30, demandVolatility: 0.25, leadTimeDelayProb: 0.45, surgeProbability: 0.12, networkStockoutProbability: 0.99, expectedStockoutsCount: 6.8, p95UnmetDemand: 4600, createdAt: new Date() },
    ],
  };
}

export async function getMonteCarloDetailsFromDb(simulationId?: string) {
  try {
    const allSims = await db.select().from(monteCarloSimulations);
    const targetSim = simulationId
      ? allSims.find((s) => s.id === simulationId)
      : allSims[0];

    if (targetSim) {
      const [facMetrics, edges] = await Promise.all([
        db.select().from(monteCarloFacilityMetrics).where(eq(monteCarloFacilityMetrics.simulationId, targetSim.id)),
        db.select().from(monteCarloCascadeEdges).where(eq(monteCarloCascadeEdges.simulationId, targetSim.id)),
      ]);

      return {
        simulation: targetSim,
        allSimulations: allSims,
        facilityMetrics: facMetrics,
        cascadeEdges: edges,
      };
    }
  } catch (err) {
    console.error("Error querying monte carlo details from DB:", err);
  }
  return null;
}

export async function getMonteCarloSimulationsFromDb(district: string = "all", drugId: string = "drug-ceftriaxone") {
  try {
    const runs = await db.select().from(monteCarloSimulations);
    if (runs.length > 0) {
      const filtered = runs.filter(
        (r) => (district === "all" || r.district.toLowerCase() === district.toLowerCase()) && r.drugId === drugId
      );
      return filtered;
    }
  } catch (err) {
    console.error("Error querying monte_carlo_simulations from Postgres:", err);
  }
  return [];
}

export async function saveMonteCarloRunToDb(result: {
  id: string;
  scenarioName: string;
  district: string;
  drugId: string;
  iterations: number;
  horizonDays: number;
  demandVolatility: number;
  leadTimeDelayProb: number;
  surgeProbability: number;
  networkStockoutProbability: number;
  expectedStockoutsCount: number;
  p95UnmetDemand: number;
  facilities: {
    facilityId: string;
    drugId: string;
    stockoutProbability: number;
    meanStockoutDay: number | null;
    p10StockoutDay: number | null;
    p50StockoutDay: number | null;
    p90StockoutDay: number | null;
    cascadeVulnerabilityScore: number;
    cascadeContagionScore: number;
    meanUnmetDemand: number;
    trajectoryQuantiles: string;
  }[];
  edges: {
    sourceFacilityId: string;
    targetFacilityId: string;
    drugId: string;
    cascadeProbability: number;
    meanDeflectedUnits: number;
    daysAccelerated: number;
    riskTier: "critical" | "high" | "moderate" | "low";
  }[];
}) {
  try {
    await db.insert(monteCarloSimulations).values({
      id: result.id,
      scenarioName: result.scenarioName,
      district: result.district,
      drugId: result.drugId,
      iterations: result.iterations,
      horizonDays: result.horizonDays,
      demandVolatility: result.demandVolatility,
      leadTimeDelayProb: result.leadTimeDelayProb,
      surgeProbability: result.surgeProbability,
      networkStockoutProbability: result.networkStockoutProbability,
      expectedStockoutsCount: result.expectedStockoutsCount,
      p95UnmetDemand: result.p95UnmetDemand,
      createdAt: new Date(),
    });

    if (result.facilities.length > 0) {
      await db.insert(monteCarloFacilityMetrics).values(
        result.facilities.map((f) => ({
          simulationId: result.id,
          facilityId: f.facilityId,
          drugId: f.drugId,
          stockoutProbability: f.stockoutProbability,
          meanStockoutDay: f.meanStockoutDay,
          p10StockoutDay: f.p10StockoutDay,
          p50StockoutDay: f.p50StockoutDay,
          p90StockoutDay: f.p90StockoutDay,
          cascadeVulnerabilityScore: f.cascadeVulnerabilityScore,
          cascadeContagionScore: f.cascadeContagionScore,
          meanUnmetDemand: f.meanUnmetDemand,
          trajectoryQuantiles: f.trajectoryQuantiles,
          createdAt: new Date(),
        }))
      );
    }

    if (result.edges.length > 0) {
      await db.insert(monteCarloCascadeEdges).values(
        result.edges.map((e) => ({
          simulationId: result.id,
          sourceFacilityId: e.sourceFacilityId,
          targetFacilityId: e.targetFacilityId,
          drugId: e.drugId,
          cascadeProbability: e.cascadeProbability,
          meanDeflectedUnits: e.meanDeflectedUnits,
          daysAccelerated: e.daysAccelerated,
          riskTier: e.riskTier,
          createdAt: new Date(),
        }))
      );
    }
    return { success: true, id: result.id };
  } catch (error) {
    console.error("Failed to save Monte Carlo run to database:", error);
    return { success: false, error: String(error) };
  }
}

