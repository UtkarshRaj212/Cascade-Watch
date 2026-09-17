import {
  pool,
  db,
  facilities,
  drugs,
  facilityInventories,
  referralLinks,
  monteCarloSimulations,
  monteCarloFacilityMetrics,
  monteCarloCascadeEdges,
} from "../lib/db";
import { runMonteCarloSimulation } from "../lib/monte-carlo";

async function seed() {
  console.log("Seeding MediRipple database...");

  // Create Monte Carlo tables if they do not exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS monte_carlo_simulations (
      id TEXT PRIMARY KEY,
      scenario_name TEXT NOT NULL,
      district TEXT NOT NULL DEFAULT 'all',
      drug_id TEXT NOT NULL REFERENCES drugs(id),
      iterations INTEGER NOT NULL DEFAULT 500,
      horizon_days INTEGER NOT NULL DEFAULT 30,
      demand_volatility DOUBLE PRECISION NOT NULL DEFAULT 0.20,
      lead_time_delay_prob DOUBLE PRECISION NOT NULL DEFAULT 0.35,
      surge_probability DOUBLE PRECISION NOT NULL DEFAULT 0.10,
      network_stockout_probability DOUBLE PRECISION NOT NULL,
      expected_stockouts_count DOUBLE PRECISION NOT NULL,
      p95_unmet_demand INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monte_carlo_facility_metrics (
      id SERIAL PRIMARY KEY,
      simulation_id TEXT NOT NULL REFERENCES monte_carlo_simulations(id) ON DELETE CASCADE,
      facility_id TEXT NOT NULL REFERENCES facilities(id),
      drug_id TEXT NOT NULL REFERENCES drugs(id),
      stockout_probability DOUBLE PRECISION NOT NULL,
      mean_stockout_day DOUBLE PRECISION,
      p10_stockout_day DOUBLE PRECISION,
      p50_stockout_day DOUBLE PRECISION,
      p90_stockout_day DOUBLE PRECISION,
      cascade_vulnerability_score DOUBLE PRECISION NOT NULL DEFAULT 0,
      cascade_contagion_score DOUBLE PRECISION NOT NULL DEFAULT 0,
      mean_unmet_demand INTEGER NOT NULL DEFAULT 0,
      trajectory_quantiles TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monte_carlo_cascade_edges (
      id SERIAL PRIMARY KEY,
      simulation_id TEXT NOT NULL REFERENCES monte_carlo_simulations(id) ON DELETE CASCADE,
      source_facility_id TEXT NOT NULL REFERENCES facilities(id),
      target_facility_id TEXT NOT NULL REFERENCES facilities(id),
      drug_id TEXT NOT NULL REFERENCES drugs(id),
      cascade_probability DOUBLE PRECISION NOT NULL,
      mean_deflected_units DOUBLE PRECISION NOT NULL,
      days_accelerated DOUBLE PRECISION NOT NULL DEFAULT 0,
      risk_tier TEXT NOT NULL DEFAULT 'moderate',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  // Clean existing tables
  await pool.query(`
    TRUNCATE TABLE
      monte_carlo_cascade_edges,
      monte_carlo_facility_metrics,
      monte_carlo_simulations,
      referral_links,
      facility_inventories,
      drugs,
      facilities
    CASCADE;
  `);

  const facilityData = [
    // Pune District
    {
      id: "fac-pune-dh",
      code: "DH-PUN-01",
      name: "Aundh District Hospital",
      district: "Pune",
      facilityType: "District Hospital",
      tier: "Tertiary",
      latitude: 18.5793,
      longitude: 73.8055,
      bedCapacity: 450,
      catchmentPopulation: 850000,
    },
    {
      id: "fac-pune-sdh-1",
      code: "SDH-BAR-02",
      name: "Baramati Sub-District Hospital",
      district: "Pune",
      facilityType: "Sub-District Hospital",
      tier: "Secondary",
      latitude: 18.1517,
      longitude: 74.5772,
      bedCapacity: 150,
      catchmentPopulation: 290000,
    },
    {
      id: "fac-pune-sdh-2",
      code: "SDH-SHI-03",
      name: "Shirur Sub-District Hospital",
      district: "Pune",
      facilityType: "Sub-District Hospital",
      tier: "Secondary",
      latitude: 18.8274,
      longitude: 74.3776,
      bedCapacity: 100,
      catchmentPopulation: 210000,
    },
    {
      id: "fac-pune-chc-1",
      code: "CHC-HAV-04",
      name: "Haveli Community Health Center",
      district: "Pune",
      facilityType: "Community Health Center",
      tier: "Secondary",
      latitude: 18.5204,
      longitude: 73.8567,
      bedCapacity: 50,
      catchmentPopulation: 140000,
    },
    {
      id: "fac-pune-chc-2",
      code: "CHC-JUN-05",
      name: "Junnar Community Health Center",
      district: "Pune",
      facilityType: "Community Health Center",
      tier: "Secondary",
      latitude: 19.2081,
      longitude: 73.8765,
      bedCapacity: 45,
      catchmentPopulation: 125000,
    },
    {
      id: "fac-pune-chc-3",
      code: "CHC-IND-06",
      name: "Indapur Rural Health Center",
      district: "Pune",
      facilityType: "Community Health Center",
      tier: "Secondary",
      latitude: 18.1158,
      longitude: 75.0343,
      bedCapacity: 40,
      catchmentPopulation: 110000,
    },
    {
      id: "fac-pune-phc-1",
      code: "PHC-PAU-07",
      name: "Paud Primary Health Center",
      district: "Pune",
      facilityType: "Primary Health Center",
      tier: "Primary",
      latitude: 18.5324,
      longitude: 73.6144,
      bedCapacity: 16,
      catchmentPopulation: 38000,
    },
    {
      id: "fac-pune-phc-2",
      code: "PHC-WAG-08",
      name: "Wagholi Primary Health Center",
      district: "Pune",
      facilityType: "Primary Health Center",
      tier: "Primary",
      latitude: 18.5808,
      longitude: 73.9787,
      bedCapacity: 12,
      catchmentPopulation: 45000,
    },
    {
      id: "fac-pune-phc-3",
      code: "PHC-KHA-09",
      name: "Khadakwasla Health Center",
      district: "Pune",
      facilityType: "Primary Health Center",
      tier: "Primary",
      latitude: 18.4354,
      longitude: 73.7667,
      bedCapacity: 14,
      catchmentPopulation: 32000,
    },
    // Thane District
    {
      id: "fac-thane-dh",
      code: "DH-THA-10",
      name: "Thane Civil Hospital",
      district: "Thane",
      facilityType: "District Hospital",
      tier: "Tertiary",
      latitude: 19.1973,
      longitude: 72.9734,
      bedCapacity: 400,
      catchmentPopulation: 950000,
    },
    {
      id: "fac-thane-sdh-1",
      code: "SDH-KAL-11",
      name: "Kalyan Sub-District Hospital",
      district: "Thane",
      facilityType: "Sub-District Hospital",
      tier: "Secondary",
      latitude: 19.2403,
      longitude: 73.1305,
      bedCapacity: 160,
      catchmentPopulation: 340000,
    },
    {
      id: "fac-thane-chc-1",
      code: "CHC-BHI-12",
      name: "Bhiwandi Community Health Center",
      district: "Thane",
      facilityType: "Community Health Center",
      tier: "Secondary",
      latitude: 19.2967,
      longitude: 73.0631,
      bedCapacity: 60,
      catchmentPopulation: 220000,
    },
    {
      id: "fac-thane-phc-1",
      code: "PHC-SHA-13",
      name: "Shahapur Primary Health Post",
      district: "Thane",
      facilityType: "Primary Health Center",
      tier: "Primary",
      latitude: 19.4539,
      longitude: 73.3283,
      bedCapacity: 18,
      catchmentPopulation: 42000,
    }
  ];

  await db.insert(facilities).values(facilityData);

  const drugData = [
    {
      id: "drug-ceftriaxone",
      code: "MED-CEF-1G",
      name: "Ceftriaxone 1g Inj",
      category: "Critical Antibiotic",
      unit: "vials",
      leadTimeDays: 7,
      safetyStockDays: 10,
    },
    {
      id: "drug-oxytocin",
      code: "MED-OXY-10IU",
      name: "Oxytocin 10 IU/ml",
      category: "Maternal Health",
      unit: "ampoules",
      leadTimeDays: 5,
      safetyStockDays: 12,
    },
    {
      id: "drug-artesunate",
      code: "MED-ART-60MG",
      name: "Artesunate 60mg Inj",
      category: "Antimalarial Care",
      unit: "vials",
      leadTimeDays: 9,
      safetyStockDays: 14,
    },
    {
      id: "drug-insulin",
      code: "MED-INS-40IU",
      name: "Insulin Regular 40 IU/ml",
      category: "Endocrine Critical",
      unit: "vials",
      leadTimeDays: 8,
      safetyStockDays: 15,
    }
  ];

  await db.insert(drugs).values(drugData);

  // Referral links between facilities
  const referralData = [
    // Pune cluster
    { sourceFacilityId: "fac-pune-phc-1", targetFacilityId: "fac-pune-chc-1", transferTimeHours: 0.8, transferVolumeShare: 0.45, referralType: "primary_referral" },
    { sourceFacilityId: "fac-pune-phc-1", targetFacilityId: "fac-pune-dh", transferTimeHours: 1.4, transferVolumeShare: 0.35, referralType: "tertiary_escalation" },
    { sourceFacilityId: "fac-pune-phc-2", targetFacilityId: "fac-pune-chc-1", transferTimeHours: 0.6, transferVolumeShare: 0.50, referralType: "primary_referral" },
    { sourceFacilityId: "fac-pune-phc-2", targetFacilityId: "fac-pune-dh", transferTimeHours: 1.1, transferVolumeShare: 0.40, referralType: "tertiary_escalation" },
    { sourceFacilityId: "fac-pune-phc-3", targetFacilityId: "fac-pune-chc-1", transferTimeHours: 0.7, transferVolumeShare: 0.60, referralType: "primary_referral" },
    { sourceFacilityId: "fac-pune-chc-1", targetFacilityId: "fac-pune-dh", transferTimeHours: 0.5, transferVolumeShare: 0.65, referralType: "tertiary_escalation" },
    { sourceFacilityId: "fac-pune-chc-1", targetFacilityId: "fac-pune-sdh-1", transferTimeHours: 1.8, transferVolumeShare: 0.25, referralType: "peer_redirection" },
    { sourceFacilityId: "fac-pune-chc-2", targetFacilityId: "fac-pune-sdh-2", transferTimeHours: 1.2, transferVolumeShare: 0.55, referralType: "secondary_escalation" },
    { sourceFacilityId: "fac-pune-chc-2", targetFacilityId: "fac-pune-dh", transferTimeHours: 2.2, transferVolumeShare: 0.30, referralType: "tertiary_escalation" },
    { sourceFacilityId: "fac-pune-chc-3", targetFacilityId: "fac-pune-sdh-1", transferTimeHours: 1.1, transferVolumeShare: 0.70, referralType: "secondary_escalation" },
    { sourceFacilityId: "fac-pune-sdh-2", targetFacilityId: "fac-pune-dh", transferTimeHours: 1.6, transferVolumeShare: 0.50, referralType: "tertiary_escalation" },
    { sourceFacilityId: "fac-pune-sdh-1", targetFacilityId: "fac-pune-dh", transferTimeHours: 2.0, transferVolumeShare: 0.45, referralType: "tertiary_escalation" },
    // Thane cluster
    { sourceFacilityId: "fac-thane-phc-1", targetFacilityId: "fac-thane-chc-1", transferTimeHours: 0.9, transferVolumeShare: 0.60, referralType: "primary_referral" },
    { sourceFacilityId: "fac-thane-chc-1", targetFacilityId: "fac-thane-sdh-1", transferTimeHours: 0.8, transferVolumeShare: 0.50, referralType: "secondary_escalation" },
    { sourceFacilityId: "fac-thane-chc-1", targetFacilityId: "fac-thane-dh", transferTimeHours: 1.1, transferVolumeShare: 0.40, referralType: "tertiary_escalation" },
    { sourceFacilityId: "fac-thane-sdh-1", targetFacilityId: "fac-thane-dh", transferTimeHours: 0.7, transferVolumeShare: 0.65, referralType: "tertiary_escalation" },
  ];

  await db.insert(referralLinks).values(referralData);

  // Facility Inventories for all facilities and drugs
  // We'll create distinct scenarios:
  // Ceftriaxone in Pune: Aundh DH has 4.8 days cover (critical!), delayed pipeline, will stock out on day 5 and deflect patients to Haveli CHC and Baramati SDH!
  const inventoryList = [
    // CEFTRIAXONE INVENTORIES
    {
      facilityId: "fac-pune-dh",
      drugId: "drug-ceftriaxone",
      currentStock: 384,
      avgDailyConsumption: 80,
      safetyStock: 800,
      daysCover: 4.8,
      daysCoverPipeline: 7.2,
      pipelineUnits: 200,
      nextDeliveryDays: 9, // Delayed from day 3
      replenishmentStatus: "Delayed",
      riskProbability: 0.88,
      riskStatus: "critical",
      riskDriver: "Replenishment delay (6d overdue) + 38% patient surge",
    },
    {
      facilityId: "fac-pune-chc-1",
      drugId: "drug-ceftriaxone",
      currentStock: 140,
      avgDailyConsumption: 22,
      safetyStock: 220,
      daysCover: 6.4,
      daysCoverPipeline: 10.5,
      pipelineUnits: 90,
      nextDeliveryDays: 5,
      replenishmentStatus: "Delayed",
      riskProbability: 0.74,
      riskStatus: "warning",
      riskDriver: "High vulnerability to Aundh DH deflection spillover",
    },
    {
      facilityId: "fac-pune-sdh-1",
      drugId: "drug-ceftriaxone",
      currentStock: 480,
      avgDailyConsumption: 35,
      safetyStock: 350,
      daysCover: 13.7,
      daysCoverPipeline: 18.0,
      pipelineUnits: 150,
      nextDeliveryDays: 4,
      replenishmentStatus: "On Track",
      riskProbability: 0.42,
      riskStatus: "warning",
      riskDriver: "Secondary buffer under indirect referral pressure",
    },
    {
      facilityId: "fac-pune-sdh-2",
      drugId: "drug-ceftriaxone",
      currentStock: 520,
      avgDailyConsumption: 28,
      safetyStock: 280,
      daysCover: 18.5,
      daysCoverPipeline: 24.2,
      pipelineUnits: 160,
      nextDeliveryDays: 6,
      replenishmentStatus: "On Track",
      riskProbability: 0.18,
      riskStatus: "low",
      riskDriver: "Normal burn rate with healthy reserve",
    },
    {
      facilityId: "fac-pune-chc-2",
      drugId: "drug-ceftriaxone",
      currentStock: 75,
      avgDailyConsumption: 16,
      safetyStock: 160,
      daysCover: 4.7,
      daysCoverPipeline: 5.9,
      pipelineUnits: 20,
      nextDeliveryDays: 11,
      replenishmentStatus: "Delayed",
      riskProbability: 0.81,
      riskStatus: "critical",
      riskDriver: "Late procurement dispatch + regional transport choke",
    },
    {
      facilityId: "fac-pune-chc-3",
      drugId: "drug-ceftriaxone",
      currentStock: 210,
      avgDailyConsumption: 14,
      safetyStock: 140,
      daysCover: 15.0,
      daysCoverPipeline: 20.0,
      pipelineUnits: 70,
      nextDeliveryDays: 8,
      replenishmentStatus: "On Track",
      riskProbability: 0.22,
      riskStatus: "low",
      riskDriver: "Balanced stock levels",
    },
    {
      facilityId: "fac-pune-phc-1",
      drugId: "drug-ceftriaxone",
      currentStock: 24,
      avgDailyConsumption: 5,
      safetyStock: 50,
      daysCover: 4.8,
      daysCoverPipeline: 8.8,
      pipelineUnits: 20,
      nextDeliveryDays: 3,
      replenishmentStatus: "On Track",
      riskProbability: 0.65,
      riskStatus: "warning",
      riskDriver: "Low local buffer, dependent on Haveli CHC",
    },
    {
      facilityId: "fac-pune-phc-2",
      drugId: "drug-ceftriaxone",
      currentStock: 68,
      avgDailyConsumption: 6,
      safetyStock: 60,
      daysCover: 11.3,
      daysCoverPipeline: 16.3,
      pipelineUnits: 30,
      nextDeliveryDays: 5,
      replenishmentStatus: "On Track",
      riskProbability: 0.25,
      riskStatus: "low",
      riskDriver: "Stable inventory profile",
    },
    {
      facilityId: "fac-pune-phc-3",
      drugId: "drug-ceftriaxone",
      currentStock: 0,
      avgDailyConsumption: 0,
      safetyStock: 40,
      daysCover: 0,
      daysCoverPipeline: 0,
      pipelineUnits: 0,
      nextDeliveryDays: null,
      replenishmentStatus: "No Order",
      riskProbability: 0.0,
      riskStatus: "insufficient_data",
      riskDriver: "Electronic reporting feed offline (3 days)",
    },

    // OXYTOCIN INVENTORIES
    {
      facilityId: "fac-pune-dh",
      drugId: "drug-oxytocin",
      currentStock: 820,
      avgDailyConsumption: 65,
      safetyStock: 650,
      daysCover: 12.6,
      daysCoverPipeline: 18.7,
      pipelineUnits: 400,
      nextDeliveryDays: 4,
      replenishmentStatus: "On Track",
      riskProbability: 0.29,
      riskStatus: "low",
      riskDriver: "Adequate cold-chain storage and regular replenishment",
    },
    {
      facilityId: "fac-pune-chc-1",
      drugId: "drug-oxytocin",
      currentStock: 62,
      avgDailyConsumption: 20,
      safetyStock: 200,
      daysCover: 3.1,
      daysCoverPipeline: 4.6,
      pipelineUnits: 30,
      nextDeliveryDays: 8,
      replenishmentStatus: "Delayed",
      riskProbability: 0.89,
      riskStatus: "critical",
      riskDriver: "Cold-chain vehicle breakdown during inter-facility transit",
    },
    {
      facilityId: "fac-pune-sdh-1",
      drugId: "drug-oxytocin",
      currentStock: 210,
      avgDailyConsumption: 25,
      safetyStock: 250,
      daysCover: 8.4,
      daysCoverPipeline: 12.0,
      pipelineUnits: 90,
      nextDeliveryDays: 6,
      replenishmentStatus: "On Track",
      riskProbability: 0.48,
      riskStatus: "warning",
      riskDriver: "Maternity ward admissions surge +19%",
    },

    // ARTESUNATE INVENTORIES
    {
      facilityId: "fac-pune-dh",
      drugId: "drug-artesunate",
      currentStock: 95,
      avgDailyConsumption: 18,
      safetyStock: 180,
      daysCover: 5.2,
      daysCoverPipeline: 6.8,
      pipelineUnits: 30,
      nextDeliveryDays: 10,
      replenishmentStatus: "Delayed",
      riskProbability: 0.82,
      riskStatus: "critical",
      riskDriver: "Monsoon post-rainfall malaria cluster admissions",
    },
    {
      facilityId: "fac-pune-chc-2",
      drugId: "drug-artesunate",
      currentStock: 120,
      avgDailyConsumption: 8,
      safetyStock: 80,
      daysCover: 15.0,
      daysCoverPipeline: 21.2,
      pipelineUnits: 50,
      nextDeliveryDays: 5,
      replenishmentStatus: "On Track",
      riskProbability: 0.21,
      riskStatus: "low",
      riskDriver: "Stable seasonal stock",
    },

    // INSULIN REGULAR INVENTORIES
    {
      facilityId: "fac-pune-dh",
      drugId: "drug-insulin",
      currentStock: 310,
      avgDailyConsumption: 30,
      safetyStock: 300,
      daysCover: 10.3,
      daysCoverPipeline: 15.3,
      pipelineUnits: 150,
      nextDeliveryDays: 5,
      replenishmentStatus: "On Track",
      riskProbability: 0.35,
      riskStatus: "low",
      riskDriver: "Central warehouse dispatch scheduled",
    },

    // THANE DISTRICT FACILITIES
    {
      facilityId: "fac-thane-dh",
      drugId: "drug-ceftriaxone",
      currentStock: 290,
      avgDailyConsumption: 70,
      safetyStock: 700,
      daysCover: 4.1,
      daysCoverPipeline: 5.5,
      pipelineUnits: 100,
      nextDeliveryDays: 9,
      replenishmentStatus: "Critical Delay",
      riskProbability: 0.91,
      riskStatus: "critical",
      riskDriver: "Port logistics bottleneck + vendor manufacturing halt",
    },
    {
      facilityId: "fac-thane-sdh-1",
      drugId: "drug-ceftriaxone",
      currentStock: 180,
      avgDailyConsumption: 28,
      safetyStock: 280,
      daysCover: 6.4,
      daysCoverPipeline: 10.0,
      pipelineUnits: 100,
      nextDeliveryDays: 4,
      replenishmentStatus: "Delayed",
      riskProbability: 0.72,
      riskStatus: "warning",
      riskDriver: "Secondary catchment spillover expected",
    },
    {
      facilityId: "fac-thane-chc-1",
      drugId: "drug-ceftriaxone",
      currentStock: 110,
      avgDailyConsumption: 18,
      safetyStock: 180,
      daysCover: 6.1,
      daysCoverPipeline: 9.4,
      pipelineUnits: 60,
      nextDeliveryDays: 6,
      replenishmentStatus: "On Track",
      riskProbability: 0.61,
      riskStatus: "warning",
      riskDriver: "Rapid depletion on emergency trauma shift",
    },
    {
      facilityId: "fac-thane-phc-1",
      drugId: "drug-ceftriaxone",
      currentStock: 45,
      avgDailyConsumption: 4,
      safetyStock: 40,
      daysCover: 11.2,
      daysCoverPipeline: 16.2,
      pipelineUnits: 20,
      nextDeliveryDays: 7,
      replenishmentStatus: "On Track",
      riskProbability: 0.28,
      riskStatus: "low",
      riskDriver: "Normal local dispensary buffer",
    }
  ];

  await db.insert(facilityInventories).values(inventoryList);

  console.log("Seeding Monte Carlo simulation runs and cascading failure edges...");

  const scenariosToSeed = [
    {
      id: "mc-baseline-pune",
      scenarioName: "Baseline Operational Drift",
      district: "Pune",
      drugId: "drug-ceftriaxone",
      iterations: 500,
      horizonDays: 30,
      demandVolatility: 0.20,
      leadTimeDelayProb: 0.35,
      surgeProbability: 0.08,
      surgeMultiplier: 1.7,
      spilloverVolatility: 0.15,
      seed: 42,
    },
    {
      id: "mc-surge-pune",
      scenarioName: "Monsoon Epidemic & Surge Shock",
      district: "Pune",
      drugId: "drug-ceftriaxone",
      iterations: 500,
      horizonDays: 30,
      demandVolatility: 0.35,
      leadTimeDelayProb: 0.40,
      surgeProbability: 0.22,
      surgeMultiplier: 2.1,
      spilloverVolatility: 0.25,
      seed: 1337,
    },
    {
      id: "mc-choke-thane",
      scenarioName: "Port Logistics & Supply Disruption",
      district: "Thane",
      drugId: "drug-ceftriaxone",
      iterations: 500,
      horizonDays: 30,
      demandVolatility: 0.18,
      leadTimeDelayProb: 0.70,
      surgeProbability: 0.06,
      surgeMultiplier: 1.5,
      spilloverVolatility: 0.15,
      seed: 999,
    },
    {
      id: "mc-all-ceftriaxone",
      scenarioName: "State-Wide Referral Cascade Stress Test",
      district: "all",
      drugId: "drug-ceftriaxone",
      iterations: 500,
      horizonDays: 30,
      demandVolatility: 0.25,
      leadTimeDelayProb: 0.45,
      surgeProbability: 0.12,
      surgeMultiplier: 1.85,
      spilloverVolatility: 0.20,
      seed: 2026,
    },
  ];

  // Fetch full lists from DB to ensure schema matching
  const [seededFacilities, seededInventories, seededReferrals] = await Promise.all([
    db.select().from(facilities),
    db.select().from(facilityInventories),
    db.select().from(referralLinks),
  ]);

  for (const scen of scenariosToSeed) {
    const mcResult = runMonteCarloSimulation({
      facilities: seededFacilities,
      inventories: seededInventories,
      referralLinks: seededReferrals,
      selectedDrugId: scen.drugId,
      selectedDistrict: scen.district,
      iterations: scen.iterations,
      horizonDays: scen.horizonDays,
      demandVolatility: scen.demandVolatility,
      leadTimeDelayProb: scen.leadTimeDelayProb,
      surgeProbability: scen.surgeProbability,
      surgeMultiplier: scen.surgeMultiplier,
      spilloverVolatility: scen.spilloverVolatility,
      scenarioName: scen.scenarioName,
      seed: scen.seed,
    });

    await db.insert(monteCarloSimulations).values({
      id: scen.id,
      scenarioName: scen.scenarioName,
      district: scen.district,
      drugId: scen.drugId,
      iterations: scen.iterations,
      horizonDays: scen.horizonDays,
      demandVolatility: scen.demandVolatility,
      leadTimeDelayProb: scen.leadTimeDelayProb,
      surgeProbability: scen.surgeProbability,
      networkStockoutProbability: mcResult.networkStockoutProbability,
      expectedStockoutsCount: mcResult.expectedStockoutsCount,
      p95UnmetDemand: mcResult.p95UnmetDemandTotal,
      createdAt: new Date(),
    });

    if (mcResult.facilityResults.length > 0) {
      await db.insert(monteCarloFacilityMetrics).values(
        mcResult.facilityResults.map((fr) => ({
          simulationId: scen.id,
          facilityId: fr.facility.id,
          drugId: scen.drugId,
          stockoutProbability: fr.stockoutProbability,
          meanStockoutDay: fr.meanStockoutDay,
          p10StockoutDay: fr.p10StockoutDay,
          p50StockoutDay: fr.p50StockoutDay,
          p90StockoutDay: fr.p90StockoutDay,
          cascadeVulnerabilityScore: fr.cascadeVulnerabilityScore,
          cascadeContagionScore: fr.cascadeContagionScore,
          meanUnmetDemand: fr.meanUnmetDemand,
          trajectoryQuantiles: JSON.stringify(fr.trajectoryQuantiles),
          createdAt: new Date(),
        }))
      );
    }

    if (mcResult.cascadeEdges.length > 0) {
      await db.insert(monteCarloCascadeEdges).values(
        mcResult.cascadeEdges.map((e) => ({
          simulationId: scen.id,
          sourceFacilityId: e.sourceFacilityId,
          targetFacilityId: e.targetFacilityId,
          drugId: scen.drugId,
          cascadeProbability: e.cascadeProbability,
          meanDeflectedUnits: e.meanDeflectedUnits,
          daysAccelerated: e.daysAccelerated,
          riskTier: e.riskTier,
          createdAt: new Date(),
        }))
      );
    }
    console.log(`Seeded Monte Carlo Scenario [${scen.scenarioName}] (${mcResult.facilityResults.length} facilities, ${mcResult.cascadeEdges.length} edges).`);
  }

  console.log("Seeding complete! Inserted facilities, drugs, referral links, inventories, and Monte Carlo models.");
}

seed()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
