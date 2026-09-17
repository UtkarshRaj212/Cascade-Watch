import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, saveMonteCarloRunToDb } from "@/lib/db/queries";
import { runMonteCarloSimulation } from "@/lib/monte-carlo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district") || "Pune";
    const drugId = searchParams.get("drugId") || "drug-ceftriaxone";
    const iterations = parseInt(searchParams.get("iterations") || "500", 10);
    const horizonDays = parseInt(searchParams.get("horizonDays") || "30", 10);
    const demandVolatility = parseFloat(searchParams.get("demandVolatility") || "0.20");
    const leadTimeDelayProb = parseFloat(searchParams.get("leadTimeDelayProb") || "0.35");
    const surgeProbability = parseFloat(searchParams.get("surgeProbability") || "0.08");
    const surgeMultiplier = parseFloat(searchParams.get("surgeMultiplier") || "1.8");
    const spilloverVolatility = parseFloat(searchParams.get("spilloverVolatility") || "0.15");

    const data = await getDashboardData();

    const result = runMonteCarloSimulation({
      facilities: data.facilities,
      inventories: data.inventories,
      referralLinks: data.referralLinks,
      selectedDrugId: drugId,
      selectedDistrict: district,
      iterations,
      horizonDays,
      demandVolatility,
      leadTimeDelayProb,
      surgeProbability,
      surgeMultiplier,
      spilloverVolatility,
      scenarioName: "Interactive Live Monte Carlo",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error in /api/monte-carlo:", error);
    return NextResponse.json(
      { error: "Failed to execute Monte Carlo simulation", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scenarioName = "Custom Monte Carlo Run",
      district = "Pune",
      drugId = "drug-ceftriaxone",
      iterations = 500,
      horizonDays = 30,
      demandVolatility = 0.20,
      leadTimeDelayProb = 0.35,
      surgeProbability = 0.08,
      surgeMultiplier = 1.8,
      spilloverVolatility = 0.15,
      saveToDb = false,
    } = body;

    const data = await getDashboardData();

    const result = runMonteCarloSimulation({
      facilities: data.facilities,
      inventories: data.inventories,
      referralLinks: data.referralLinks,
      selectedDrugId: drugId,
      selectedDistrict: district,
      iterations,
      horizonDays,
      demandVolatility,
      leadTimeDelayProb,
      surgeProbability,
      surgeMultiplier,
      spilloverVolatility,
      scenarioName,
    });

    if (saveToDb) {
      const runId = `mc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await saveMonteCarloRunToDb({
        id: runId,
        scenarioName,
        district,
        drugId,
        iterations,
        horizonDays,
        demandVolatility,
        leadTimeDelayProb,
        surgeProbability,
        networkStockoutProbability: result.networkStockoutProbability,
        expectedStockoutsCount: result.expectedStockoutsCount,
        p95UnmetDemand: result.p95UnmetDemandTotal,
        facilities: result.facilityResults.map((fr) => ({
          facilityId: fr.facility.id,
          drugId,
          stockoutProbability: fr.stockoutProbability,
          meanStockoutDay: fr.meanStockoutDay,
          p10StockoutDay: fr.p10StockoutDay,
          p50StockoutDay: fr.p50StockoutDay,
          p90StockoutDay: fr.p90StockoutDay,
          cascadeVulnerabilityScore: fr.cascadeVulnerabilityScore,
          cascadeContagionScore: fr.cascadeContagionScore,
          meanUnmetDemand: fr.meanUnmetDemand,
          trajectoryQuantiles: JSON.stringify(fr.trajectoryQuantiles),
        })),
        edges: result.cascadeEdges.map((ce) => ({
          sourceFacilityId: ce.sourceFacilityId,
          targetFacilityId: ce.targetFacilityId,
          drugId,
          cascadeProbability: ce.cascadeProbability,
          meanDeflectedUnits: ce.meanDeflectedUnits,
          daysAccelerated: ce.daysAccelerated,
          riskTier: ce.riskTier,
        })),
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error in POST /api/monte-carlo:", error);
    return NextResponse.json(
      { error: "Failed to execute or save Monte Carlo simulation", details: String(error) },
      { status: 500 }
    );
  }
}
