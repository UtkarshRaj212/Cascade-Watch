import { Facility, Drug, FacilityInventory, ReferralLink } from "./db/schema";

export interface MonteCarloTrajectoryQuantile {
  day: number;
  p10: number; // 10th percentile (conservative / pessimistic stock level)
  p25: number;
  p50: number; // Median stock level
  p75: number;
  p90: number; // 90th percentile (optimistic stock level)
  mean: number;
}

export interface FacilityMonteCarloResult {
  facility: Facility;
  inventory: FacilityInventory;
  stockoutProbability: number; // 0.0 - 1.0
  meanStockoutDay: number | null;
  p10StockoutDay: number | null; // Earliest expected failure day (worst 10%)
  p50StockoutDay: number | null; // Median expected failure day
  p90StockoutDay: number | null; // Late/best-case failure day
  cascadeVulnerabilityScore: number; // Prob of failing strictly due to referral deflection
  cascadeContagionScore: number; // Avg number of downstream facilities this facility pushes into failure
  meanUnmetDemand: number; // Average unmet patient units over the horizon
  p95UnmetDemand: number;
  trajectoryQuantiles: MonteCarloTrajectoryQuantile[];
  baselineIsolatedStockoutProb: number; // Prob of stocking out without any referral cascade
}

export interface MonteCarloCascadeEdgeResult {
  sourceFacilityId: string;
  sourceFacilityName: string;
  targetFacilityId: string;
  targetFacilityName: string;
  referralType: string;
  cascadeProbability: number; // Conditional prob P(Target stocks out | Source stocks out)
  meanDeflectedUnits: number; // Average daily deflected units transmitted
  daysAccelerated: number; // Days earlier target stocks out because of spillover
  riskTier: "critical" | "high" | "moderate" | "low";
}

export interface MonteCarloCascadeSizeDistribution {
  failedFacilitiesCount: number;
  frequency: number; // Frequency in iterations
  probability: number; // 0.0 - 1.0
}

export interface MonteCarloSimulationResult {
  scenarioName: string;
  district: string;
  drugId: string;
  iterations: number;
  horizonDays: number;
  demandVolatility: number;
  leadTimeDelayProb: number;
  surgeProbability: number;
  networkStockoutProbability: number; // Prob of at least 1 facility failing in network
  expectedStockoutsCount: number; // Expected total number of facility failures
  p95UnmetDemandTotal: number;
  facilityResults: FacilityMonteCarloResult[];
  cascadeEdges: MonteCarloCascadeEdgeResult[];
  cascadeSizeDistribution: MonteCarloCascadeSizeDistribution[];
  topContagionVector: {
    sourceFacilityName: string;
    targetFacilityName: string;
    cascadeProbability: number;
    daysAccelerated: number;
  } | null;
  executionTimeMs: number;
}

export interface MonteCarloParams {
  facilities: Facility[];
  inventories: FacilityInventory[];
  referralLinks: ReferralLink[];
  selectedDrugId: string;
  selectedDistrict: string;
  iterations?: number;
  horizonDays?: number;
  demandVolatility?: number; // Std dev ratio (e.g. 0.20 = 20% CV)
  leadTimeDelayProb?: number; // Probability of delivery delay (e.g. 0.35)
  surgeProbability?: number; // Probability of epidemic/surge spike day (e.g. 0.08)
  surgeMultiplier?: number; // Magnitude of surge (e.g. 1.8x)
  spilloverVolatility?: number; // Volatility on transfer share (e.g. 0.15)
  scenarioName?: string;
  focalFacilityId?: string;
  seed?: number;
}

// Deterministic PRNG (Mulberry32) for reproducible stochastic runs if seed is provided
function createPrng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for Gaussian variates
function sampleGaussian(mean: number, stdDev: number, rand: () => number): number {
  const u1 = Math.max(1e-7, rand());
  const u2 = rand();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return Math.max(0, mean + z0 * stdDev);
}

// Helper to calculate percentile from sorted numbers array
function getPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function runMonteCarloSimulation({
  facilities,
  inventories,
  referralLinks,
  selectedDrugId,
  selectedDistrict,
  iterations = 500,
  horizonDays = 30,
  demandVolatility = 0.20,
  leadTimeDelayProb = 0.35,
  surgeProbability = 0.08,
  surgeMultiplier = 1.8,
  spilloverVolatility = 0.15,
  scenarioName = "Probabilistic Dynamic Cascade",
  seed,
}: MonteCarloParams): MonteCarloSimulationResult {
  const startTime = Date.now();

  const rand = seed !== undefined ? createPrng(seed) : Math.random;

  // Filter facilities by district
  const districtFacilities = facilities.filter((f) =>
    selectedDistrict === "all" || selectedDistrict === "All Districts"
      ? true
      : f.district.toLowerCase() === selectedDistrict.toLowerCase()
  );
  const districtFacilityIds = new Set(districtFacilities.map((f) => f.id));

  // Filter and map inventories
  const invMap = new Map<string, FacilityInventory>();
  inventories.forEach((inv) => {
    if (inv.drugId === selectedDrugId && districtFacilityIds.has(inv.facilityId)) {
      invMap.set(inv.facilityId, inv);
    }
  });

  // Filter referral links within active district
  const activeReferralLinks = referralLinks.filter(
    (l) => districtFacilityIds.has(l.sourceFacilityId) && districtFacilityIds.has(l.targetFacilityId)
  );

  // Build graph adjacency for cascade propagation
  const outgoingLinks = new Map<string, ReferralLink[]>();
  const incomingLinks = new Map<string, ReferralLink[]>();

  districtFacilities.forEach((f) => {
    outgoingLinks.set(f.id, []);
    incomingLinks.set(f.id, []);
  });

  activeReferralLinks.forEach((link) => {
    outgoingLinks.get(link.sourceFacilityId)?.push(link);
    incomingLinks.get(link.targetFacilityId)?.push(link);

    // Also support peer redirection link reverse deflection
    if (link.referralType === "peer_redirection") {
      outgoingLinks.get(link.targetFacilityId)?.push({
        ...link,
        sourceFacilityId: link.targetFacilityId,
        targetFacilityId: link.sourceFacilityId,
        transferVolumeShare: link.transferVolumeShare * 0.7,
      });
    }
  });

  // Data tracking across all iterations
  // For each facility:
  // - stockoutOccurred: boolean per run
  // - stockoutDay: number | null per run
  // - stockoutOccurredIsolated: boolean per run (counterfactual without cascade)
  // - stockoutDayIsolated: number | null per run
  // - trajectories: number[][] (iteration x day)
  // - unmetDemand: number per run
  // - causedSecondaryStockouts: number per run (contagion score)
  const facilityData = new Map<
    string,
    {
      stockoutDays: (number | null)[];
      stockoutDaysIsolated: (number | null)[];
      trajectories: number[][]; // [runIndex][day]
      unmetDemands: number[];
      contagionCounts: number[]; // Count of downstream facilities pushed into stockout
    }
  >();

  districtFacilities.forEach((f) => {
    facilityData.set(f.id, {
      stockoutDays: new Array(iterations).fill(null),
      stockoutDaysIsolated: new Array(iterations).fill(null),
      trajectories: Array.from({ length: iterations }, () => new Array(horizonDays + 1).fill(0)),
      unmetDemands: new Array(iterations).fill(0),
      contagionCounts: new Array(iterations).fill(0),
    });
  });

  // Pairwise cascade edge tracking:
  // key: "sourceId->targetId"
  // tracking: sourceStockedOutCount, targetStockedOutGivenSource, daysAcceleratedList, deflectedUnitsSum
  const edgeTracking = new Map<
    string,
    {
      link: ReferralLink;
      sourceStockedOutCount: number;
      targetStockedOutGivenSource: number;
      daysAcceleratedList: number[];
      deflectedUnitsSum: number;
    }
  >();

  activeReferralLinks.forEach((l) => {
    edgeTracking.set(`${l.sourceFacilityId}->${l.targetFacilityId}`, {
      link: l,
      sourceStockedOutCount: 0,
      targetStockedOutGivenSource: 0,
      daysAcceleratedList: [],
      deflectedUnitsSum: 0,
    });
  });

  // Distribution of total failed facilities count
  const cascadeSizeCounts = new Array(districtFacilities.length + 1).fill(0);
  const totalNetworkUnmetDemandList: number[] = [];

  // ==========================================
  // MONTE CARLO ITERATION LOOP
  // ==========================================
  for (let run = 0; run < iterations; run++) {
    // 1. Sample lead time / arrival day for each facility in this run
    const actualDeliveryDays = new Map<string, number | null>();
    const actualPipelineUnits = new Map<string, number>();

    districtFacilities.forEach((f) => {
      const inv = invMap.get(f.id);
      if (!inv || inv.nextDeliveryDays === null) {
        actualDeliveryDays.set(f.id, null);
        actualPipelineUnits.set(f.id, 0);
        return;
      }

      // Sample whether delivery is on-time or delayed
      let arrival = inv.nextDeliveryDays;
      if (rand() < leadTimeDelayProb) {
        // Delay jitter: 1 to 7 extra days
        const delayAddition = Math.floor(rand() * 6) + 2;
        arrival += delayAddition;
      }
      actualDeliveryDays.set(f.id, arrival);

      // Fulfillment yield (between 85% and 105% of promised units)
      const yieldRatio = 0.85 + rand() * 0.20;
      actualPipelineUnits.set(f.id, Math.round(inv.pipelineUnits * yieldRatio));
    });

    // ----------------------------------------------------
    // Run A: Counterfactual Baseline (Isolated, No Cascade)
    // ----------------------------------------------------
    districtFacilities.forEach((f) => {
      const inv = invMap.get(f.id);
      if (!inv || inv.avgDailyConsumption <= 0) return;

      let stock = inv.currentStock;
      let isolatedStockout: number | null = null;
      const scheduledArrival = actualDeliveryDays.get(f.id);
      const scheduledUnits = actualPipelineUnits.get(f.id) || 0;

      for (let day = 0; day <= horizonDays; day++) {
        if (day === scheduledArrival) {
          stock += scheduledUnits;
        }

        // Daily consumption with volatility
        const dailyBurn = sampleGaussian(
          inv.avgDailyConsumption,
          inv.avgDailyConsumption * demandVolatility,
          rand
        );

        const stockLeft = stock - dailyBurn;
        if (stockLeft <= 0 && isolatedStockout === null && day > 0) {
          isolatedStockout = day;
        }
        stock = Math.max(0, stockLeft);
      }

      facilityData.get(f.id)!.stockoutDaysIsolated[run] = isolatedStockout;
    });

    // ----------------------------------------------------
    // Run B: Active Network Simulation with Cascade Deflection
    // ----------------------------------------------------
    const currentStock = new Map<string, number>();
    const facilityStockoutDay = new Map<string, number | null>();
    let runTotalUnmet = 0;

    districtFacilities.forEach((f) => {
      const inv = invMap.get(f.id);
      currentStock.set(f.id, inv ? inv.currentStock : 0);
      facilityStockoutDay.set(f.id, null);
      facilityData.get(f.id)!.trajectories[run][0] = inv ? inv.currentStock : 0;
    });

    // Day-by-day cascade simulation across the network
    for (let day = 1; day <= horizonDays; day++) {
      // 1. Replenishment arrivals
      districtFacilities.forEach((f) => {
        const arrDay = actualDeliveryDays.get(f.id);
        if (arrDay === day) {
          const units = actualPipelineUnits.get(f.id) || 0;
          currentStock.set(f.id, (currentStock.get(f.id) || 0) + units);
        }
      });

      // 2. Base consumption + Surge shocks
      const baseDemandMap = new Map<string, number>();
      districtFacilities.forEach((f) => {
        const inv = invMap.get(f.id);
        if (!inv || inv.avgDailyConsumption <= 0) {
          baseDemandMap.set(f.id, 0);
          return;
        }

        let burn = sampleGaussian(
          inv.avgDailyConsumption,
          inv.avgDailyConsumption * demandVolatility,
          rand
        );

        // Epidemic / regional surge shock
        if (rand() < surgeProbability) {
          burn *= surgeMultiplier;
        }

        baseDemandMap.set(f.id, burn);
      });

      // 3. Multi-tier referral cascading deflection
      // Check which facilities are ALREADY stocked out and redirecting patients
      const deflectedInflow = new Map<string, number>();
      districtFacilities.forEach((f) => deflectedInflow.set(f.id, 0));

      districtFacilities.forEach((src) => {
        const srcStockout = facilityStockoutDay.get(src.id) ?? null;
        // If source stocked out previously or currently has 0 stock
        if (srcStockout !== null && srcStockout <= day) {
          const srcInv = invMap.get(src.id);
          const nominalRate = srcInv ? srcInv.avgDailyConsumption : 0;
          const links = outgoingLinks.get(src.id) || [];

          links.forEach((link) => {
            // Stochastic volume share with volatility
            const share = Math.min(
              0.95,
              Math.max(0.05, sampleGaussian(link.transferVolumeShare, link.transferVolumeShare * spilloverVolatility, rand))
            );
            const divertedAmount = nominalRate * share;
            deflectedInflow.set(link.targetFacilityId, (deflectedInflow.get(link.targetFacilityId) || 0) + divertedAmount);

            // Record deflected units for edge analysis
            const edgeKey = `${link.sourceFacilityId}->${link.targetFacilityId}`;
            const edgeStat = edgeTracking.get(edgeKey);
            if (edgeStat) {
              edgeStat.deflectedUnitsSum += divertedAmount;
            }
          });
        }
      });

      // 4. Update stock balances and check for new stockouts
      districtFacilities.forEach((f) => {
        const stock = currentStock.get(f.id) || 0;
        const base = baseDemandMap.get(f.id) || 0;
        const spillover = deflectedInflow.get(f.id) || 0;
        const totalDemand = base + spillover;

        const remaining = stock - totalDemand;
        if (remaining <= 0) {
          currentStock.set(f.id, 0);
          if (facilityStockoutDay.get(f.id) === null) {
            facilityStockoutDay.set(f.id, day);
          }
          const unmetToday = Math.abs(remaining);
          facilityData.get(f.id)!.unmetDemands[run] += unmetToday;
          runTotalUnmet += unmetToday;
        } else {
          currentStock.set(f.id, remaining);
        }

        // Store daily trajectory point
        facilityData.get(f.id)!.trajectories[run][day] = currentStock.get(f.id)!;
      });
    }

    // Record stockout days for this run
    let failedInThisRun = 0;
    districtFacilities.forEach((f) => {
      const sDay = facilityStockoutDay.get(f.id) ?? null;
      facilityData.get(f.id)!.stockoutDays[run] = sDay;
      if (sDay !== null && sDay <= horizonDays) {
        failedInThisRun++;
      }
    });

    cascadeSizeCounts[failedInThisRun]++;
    totalNetworkUnmetDemandList.push(runTotalUnmet);

    // Track pairwise cascade edge effects
    districtFacilities.forEach((src) => {
      const srcDay = facilityStockoutDay.get(src.id) ?? null;
      if (srcDay !== null && srcDay <= horizonDays) {
        const links = outgoingLinks.get(src.id) || [];
        links.forEach((link) => {
          const edgeKey = `${link.sourceFacilityId}->${link.targetFacilityId}`;
          const edgeStat = edgeTracking.get(edgeKey);
          if (edgeStat) {
            edgeStat.sourceStockedOutCount++;
            const tgtDay = facilityStockoutDay.get(link.targetFacilityId) ?? null;
            const tgtIsoDay = facilityData.get(link.targetFacilityId)!.stockoutDaysIsolated[run];

            if (tgtDay !== null && tgtDay <= horizonDays) {
              edgeStat.targetStockedOutGivenSource++;

              // Acceleration in days compared to baseline without cascade
              if (tgtIsoDay !== null && tgtIsoDay > tgtDay) {
                const accel = tgtIsoDay - tgtDay;
                edgeStat.daysAcceleratedList.push(accel);
                facilityData.get(src.id)!.contagionCounts[run]++;
              } else if (tgtIsoDay === null) {
                // Caused a failure that wouldn't have occurred at all
                const accel = horizonDays - tgtDay;
                edgeStat.daysAcceleratedList.push(accel);
                facilityData.get(src.id)!.contagionCounts[run]++;
              }
            }
          }
        });
      }
    });
  }

  // ==========================================
  // AGGREGATE POST-PROCESSING & METRICS
  // ==========================================

  // Sort unmet demand to calculate 95th percentile
  totalNetworkUnmetDemandList.sort((a, b) => a - b);
  const p95UnmetDemandTotal = Math.round(getPercentile(totalNetworkUnmetDemandList, 95));

  // Compute facility results
  const facilityResults: FacilityMonteCarloResult[] = districtFacilities.map((f) => {
    const inv = invMap.get(f.id) || {
      id: 0,
      facilityId: f.id,
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
      riskDriver: "No data",
      updatedAt: new Date(),
    };

    const data = facilityData.get(f.id)!;

    // Filter valid stockout days within horizon
    const validStockoutDays = data.stockoutDays
      .filter((d): d is number => d !== null && d <= horizonDays)
      .sort((a, b) => a - b);

    const stockoutCount = validStockoutDays.length;
    const stockoutProbability = Number((stockoutCount / iterations).toFixed(3));

    // Isolated baseline stockouts
    const validIsolatedDays = data.stockoutDaysIsolated
      .filter((d): d is number => d !== null && d <= horizonDays);
    const baselineIsolatedStockoutProb = Number((validIsolatedDays.length / iterations).toFixed(3));

    // Cascade vulnerability: stockouts that were induced or accelerated strictly by incoming cascade
    let cascadeVulnerableCount = 0;
    for (let i = 0; i < iterations; i++) {
      const activeDay = data.stockoutDays[i];
      const isoDay = data.stockoutDaysIsolated[i];
      if (activeDay !== null && activeDay <= horizonDays) {
        if (isoDay === null || isoDay > activeDay) {
          cascadeVulnerableCount++;
        }
      }
    }
    const cascadeVulnerabilityScore = Number((cascadeVulnerableCount / iterations).toFixed(3));

    // Average contagion score (how many others it caused to fail)
    const totalContagion = data.contagionCounts.reduce((acc, c) => acc + c, 0);
    const cascadeContagionScore = Number((totalContagion / iterations).toFixed(2));

    // Unmet demand statistics
    const totalUnmet = data.unmetDemands.reduce((a, b) => a + b, 0);
    const meanUnmetDemand = Math.round(totalUnmet / iterations);
    const sortedUnmet = [...data.unmetDemands].sort((a, b) => a - b);
    const p95UnmetDemand = Math.round(getPercentile(sortedUnmet, 95));

    // Stockout Day Percentiles
    let meanStockoutDay: number | null = null;
    let p10StockoutDay: number | null = null;
    let p50StockoutDay: number | null = null;
    let p90StockoutDay: number | null = null;

    if (validStockoutDays.length > 0) {
      const sumDays = validStockoutDays.reduce((a, b) => a + b, 0);
      meanStockoutDay = Number((sumDays / validStockoutDays.length).toFixed(1));
      p10StockoutDay = Math.round(getPercentile(validStockoutDays, 10));
      p50StockoutDay = Math.round(getPercentile(validStockoutDays, 50));
      p90StockoutDay = Math.round(getPercentile(validStockoutDays, 90));
    }

    // Daily trajectory quantile ribbons across horizon
    const trajectoryQuantiles: MonteCarloTrajectoryQuantile[] = [];
    for (let day = 0; day <= horizonDays; day++) {
      const dayStocks = data.trajectories.map((runTraj) => runTraj[day]).sort((a, b) => a - b);
      const sum = dayStocks.reduce((a, b) => a + b, 0);

      trajectoryQuantiles.push({
        day,
        p10: Math.round(getPercentile(dayStocks, 10)),
        p25: Math.round(getPercentile(dayStocks, 25)),
        p50: Math.round(getPercentile(dayStocks, 50)),
        p75: Math.round(getPercentile(dayStocks, 75)),
        p90: Math.round(getPercentile(dayStocks, 90)),
        mean: Math.round(sum / iterations),
      });
    }

    return {
      facility: f,
      inventory: inv,
      stockoutProbability,
      meanStockoutDay,
      p10StockoutDay,
      p50StockoutDay,
      p90StockoutDay,
      cascadeVulnerabilityScore,
      cascadeContagionScore,
      meanUnmetDemand,
      p95UnmetDemand,
      trajectoryQuantiles,
      baselineIsolatedStockoutProb,
    };
  });

  // Sort facility results by highest stockout probability descending
  facilityResults.sort((a, b) => b.stockoutProbability - a.stockoutProbability);

  // Compute pairwise cascade edges results
  const facMap = new Map(facilities.map((f) => [f.id, f]));

  const cascadeEdges: MonteCarloCascadeEdgeResult[] = [];
  edgeTracking.forEach((stat, key) => {
    const [sourceId, targetId] = key.split("->");
    const sourceFac = facMap.get(sourceId);
    const targetFac = facMap.get(targetId);

    if (!sourceFac || !targetFac) return;

    // Conditional probability: P(Target fails | Source failed)
    const cascadeProb =
      stat.sourceStockedOutCount > 0
        ? Number((stat.targetStockedOutGivenSource / stat.sourceStockedOutCount).toFixed(3))
        : 0;

    const meanDeflectedUnits = Math.round(stat.deflectedUnitsSum / iterations);

    const avgAcceleration =
      stat.daysAcceleratedList.length > 0
        ? Number((stat.daysAcceleratedList.reduce((a, b) => a + b, 0) / stat.daysAcceleratedList.length).toFixed(1))
        : 0;

    let riskTier: "critical" | "high" | "moderate" | "low" = "low";
    if (cascadeProb >= 0.70 || avgAcceleration >= 4.0) {
      riskTier = "critical";
    } else if (cascadeProb >= 0.40 || avgAcceleration >= 2.0) {
      riskTier = "high";
    } else if (cascadeProb >= 0.20) {
      riskTier = "moderate";
    }

    cascadeEdges.push({
      sourceFacilityId: sourceId,
      sourceFacilityName: sourceFac.name,
      targetFacilityId: targetId,
      targetFacilityName: targetFac.name,
      referralType: stat.link.referralType,
      cascadeProbability: cascadeProb,
      meanDeflectedUnits,
      daysAccelerated: avgAcceleration,
      riskTier,
    });
  });

  // Sort edges by cascade probability descending
  cascadeEdges.sort((a, b) => b.cascadeProbability - a.cascadeProbability);

  // Top contagion vector
  const topEdge = cascadeEdges[0] || null;
  const topContagionVector = topEdge
    ? {
        sourceFacilityName: topEdge.sourceFacilityName,
        targetFacilityName: topEdge.targetFacilityName,
        cascadeProbability: topEdge.cascadeProbability,
        daysAccelerated: topEdge.daysAccelerated,
      }
    : null;

  // Cascade size distribution histogram
  const cascadeSizeDistribution: MonteCarloCascadeSizeDistribution[] = cascadeSizeCounts.map((count, i) => ({
    failedFacilitiesCount: i,
    frequency: count,
    probability: Number((count / iterations).toFixed(3)),
  }));

  // Network metrics
  const runsWithAtLeastOneFailure = iterations - cascadeSizeCounts[0];
  const networkStockoutProbability = Number((runsWithAtLeastOneFailure / iterations).toFixed(3));

  let totalFailuresSum = 0;
  cascadeSizeCounts.forEach((count, i) => {
    totalFailuresSum += count * i;
  });
  const expectedStockoutsCount = Number((totalFailuresSum / iterations).toFixed(2));

  return {
    scenarioName,
    district: selectedDistrict,
    drugId: selectedDrugId,
    iterations,
    horizonDays,
    demandVolatility,
    leadTimeDelayProb,
    surgeProbability,
    networkStockoutProbability,
    expectedStockoutsCount,
    p95UnmetDemandTotal,
    facilityResults,
    cascadeEdges,
    cascadeSizeDistribution,
    topContagionVector,
    executionTimeMs: Date.now() - startTime,
  };
}
