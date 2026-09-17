import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, facilities, drugs, facilityInventories, user } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deriveInventoryFields, slugify } from "@/lib/stockInsights";
import type { Drug, FacilityInventory } from "@/lib/db/schema";

const REORDER_STATUS_OPTIONS = ["On Track", "Delayed", "Critical Delay", "In Transit"] as const;
type ReplenishmentStatus = (typeof REORDER_STATUS_OPTIONS)[number];

function formatCode(name: string) {
  const key = slugify(name).toUpperCase().replace(/-/g, "").slice(0, 8);
  return `MED-${key && key.length > 0 ? key : "GEN"}`;
}

function fallbackInventoryId() {
  return -Math.floor(Date.now() % 1_000_000_000);
}

// POST /api/inventory — add a medicine for a facility
export async function POST(request: NextRequest) {
  try {
    // 1. Enforce authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in to manage inventory." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      facilityId,
      drugId,
      newDrug,
      currentStock,
      avgDailyConsumption,
      safetyStock,
      pipelineUnits = 0,
      nextDeliveryDays = null,
      replenishmentStatus = "On Track",
    } = body;

    if (!facilityId || currentStock === undefined || avgDailyConsumption === undefined) {
      return NextResponse.json(
        { success: false, error: "facilityId, currentStock and avgDailyConsumption are required" },
        { status: 400 }
      );
    }

    // 2. Enforce hospital facility authorization
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userRecord?.assignedFacilityId || userRecord.assignedFacilityId !== facilityId) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are only authorized to manage inventory for your assigned hospital.",
        },
        { status: 403 }
      );
    }

    // Resolve or create the drug
    let createdDrug: Drug | null = null;
    let resolvedDrug: Drug | undefined;

    if (newDrug?.name) {
      const name = String(newDrug.name).trim();
      const drugIdGenerated = `drug-${slugify(name)}`;
      resolvedDrug = {
        id: drugIdGenerated,
        code: formatCode(name),
        name,
        category: String(newDrug.category || "Essential Medicine").trim(),
        unit: String(newDrug.unit || "vials").trim(),
        leadTimeDays: Number(newDrug.leadTimeDays) || 7,
        safetyStockDays: Number(newDrug.safetyStockDays) || 10,
        createdAt: new Date(),
      };
      createdDrug = resolvedDrug;
    } else if (drugId) {
      resolvedDrug = (await db.select().from(drugs).where(eq(drugs.id, drugId)))[0];
      if (!resolvedDrug) {
        return NextResponse.json(
          { success: false, error: `Drug ${drugId} not found` },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Provide drugId or newDrug" },
        { status: 400 }
      );
    }

    const stock = Math.max(0, Math.round(Number(currentStock)));
    const consumption = Math.max(0, Number(avgDailyConsumption));
    const computedSafetyStock = Number.isFinite(Number(safetyStock))
      ? Math.max(0, Math.round(Number(safetyStock)))
      : Math.max(0, Math.round(resolvedDrug.safetyStockDays * consumption));
    const pipeline = Math.max(0, Math.round(Number(pipelineUnits)));
    const deliveryDays = Number.isFinite(Number(nextDeliveryDays)) && nextDeliveryDays !== null
      ? Math.max(0, Math.round(Number(nextDeliveryDays)))
      : null;
    const status = REORDER_STATUS_OPTIONS.includes(replenishmentStatus)
      ? (replenishmentStatus as ReplenishmentStatus)
      : "On Track";

    const derived = deriveInventoryFields(stock, consumption, pipeline, status, deliveryDays);

    let inventoryRecord: FacilityInventory = {
      id: fallbackInventoryId(),
      facilityId,
      drugId: resolvedDrug.id,
      currentStock: stock,
      avgDailyConsumption: consumption,
      safetyStock: computedSafetyStock,
      daysCover: derived.daysCover,
      daysCoverPipeline: derived.daysCoverPipeline,
      pipelineUnits: pipeline,
      nextDeliveryDays: deliveryDays,
      replenishmentStatus: derived.replenishmentStatus,
      riskProbability: derived.riskProbability,
      riskStatus: derived.riskStatus,
      riskDriver: derived.riskDriver,
      updatedAt: new Date(),
    };

    let persisted = false;
    let dbError: string | null = null;

    try {
      const facilityExists: boolean =
        (await db.select().from(facilities).where(eq(facilities.id, facilityId))).length > 0;
      if (!facilityExists) {
        return NextResponse.json(
          { success: false, error: `Facility ${facilityId} not found` },
          { status: 404 }
        );
      }

      if (createdDrug) {
        await db.insert(drugs).values(createdDrug).onConflictDoNothing();
      }

      const inserted = await db
        .insert(facilityInventories)
        .values({
          facilityId,
          drugId: resolvedDrug.id,
          currentStock: stock,
          avgDailyConsumption: consumption,
          safetyStock: computedSafetyStock,
          daysCover: derived.daysCover,
          daysCoverPipeline: derived.daysCoverPipeline,
          pipelineUnits: pipeline,
          nextDeliveryDays: deliveryDays,
          replenishmentStatus: derived.replenishmentStatus,
          riskProbability: derived.riskProbability,
          riskStatus: derived.riskStatus,
          riskDriver: derived.riskDriver,
          updatedAt: new Date(),
        })
        .returning();

      if (inserted.length > 0) {
        inventoryRecord = inserted[0];
        persisted = true;
      }
    } catch (err) {
      dbError = String(err);
      console.error("DB insert failed in POST /api/inventory (falling back):", err);
    }

    return NextResponse.json({
      success: true,
      persisted,
      dbError,
      inventory: inventoryRecord,
      drug: createdDrug || resolvedDrug,
    });
  } catch (error) {
    console.error("API error in POST /api/inventory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add medicine", details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory — update an existing facility medicine record
export async function PATCH(request: NextRequest) {
  try {
    // 1. Enforce authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in to update inventory." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, facilityId, drugId, ...fields } = body;

    if (!id && !(facilityId && drugId)) {
      return NextResponse.json(
        { success: false, error: "Provide id, or facilityId + drugId to locate the record" },
        { status: 400 }
      );
    }

    // Locate the current record (from DB when id is a real serial; otherwise fallback merge)
    let existing: FacilityInventory | undefined;
    if (Number.isFinite(Number(id)) && Number(id) > 0) {
      existing = (await db.select().from(facilityInventories).where(eq(facilityInventories.id, Number(id))))[0];
    }

    const resolveFacilityId = facilityId || existing?.facilityId;
    const resolveDrugId = drugId || existing?.drugId;

    if (!existing && (!resolveFacilityId || !resolveDrugId)) {
      return NextResponse.json(
        { success: false, error: "Unable to locate the inventory record" },
        { status: 404 }
      );
    }

    // 2. Enforce hospital facility authorization
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userRecord?.assignedFacilityId || userRecord.assignedFacilityId !== resolveFacilityId) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are only authorized to modify inventory for your assigned hospital.",
        },
        { status: 403 }
      );
    }

    // Merge current values
    const currentStock =
      fields.currentStock !== undefined
        ? Math.max(0, Math.round(Number(fields.currentStock)))
        : (existing?.currentStock ?? 0);
    const consumption =
      fields.avgDailyConsumption !== undefined
        ? Math.max(0, Number(fields.avgDailyConsumption))
        : (existing?.avgDailyConsumption ?? 0);
    const safetyStockValue =
      fields.safetyStock !== undefined
        ? Math.max(0, Math.round(Number(fields.safetyStock)))
        : (existing?.safetyStock ?? 0);
    const pipeline = Math.max(0, Math.round(Number(fields.pipelineUnits ?? existing?.pipelineUnits ?? 0)));
    const deliveryDays =
      fields.nextDeliveryDays !== undefined && fields.nextDeliveryDays !== null
        ? Math.max(0, Math.round(Number(fields.nextDeliveryDays)))
        : fields.nextDeliveryDays === null
        ? null
        : (existing?.nextDeliveryDays ?? null);
    const status = REORDER_STATUS_OPTIONS.includes(fields.replenishmentStatus as ReplenishmentStatus)
      ? (fields.replenishmentStatus as ReplenishmentStatus)
      : ((existing?.replenishmentStatus as ReplenishmentStatus) || "On Track");

    // Resolve drug for lead-time / safety day context
    let resolvedDrug: Drug | undefined;
    if (resolveDrugId) {
      resolvedDrug = (await db.select().from(drugs).where(eq(drugs.id, resolveDrugId)))[0];
    }

    const derived = deriveInventoryFields(currentStock, consumption, pipeline, status, deliveryDays);

    const updatedRecord: FacilityInventory = {
      id: existing?.id ?? fallbackInventoryId(),
      facilityId: resolveFacilityId ?? "",
      drugId: resolveDrugId ?? "",
      currentStock,
      avgDailyConsumption: consumption,
      safetyStock: safetyStockValue,
      daysCover: derived.daysCover,
      daysCoverPipeline: derived.daysCoverPipeline,
      pipelineUnits: pipeline,
      nextDeliveryDays: deliveryDays,
      replenishmentStatus: derived.replenishmentStatus,
      riskProbability: derived.riskProbability,
      riskStatus: derived.riskStatus,
      riskDriver: derived.riskDriver,
      updatedAt: new Date(),
    };

    let persisted = false;
    let dbError: string | null = null;

    if (existing && Number(existing.id) > 0) {
      try {
        const updated = await db
          .update(facilityInventories)
          .set({
            currentStock,
            avgDailyConsumption: consumption,
            safetyStock: safetyStockValue,
            daysCover: derived.daysCover,
            daysCoverPipeline: derived.daysCoverPipeline,
            pipelineUnits: pipeline,
            nextDeliveryDays: deliveryDays,
            replenishmentStatus: derived.replenishmentStatus,
            riskProbability: derived.riskProbability,
            riskStatus: derived.riskStatus,
            riskDriver: derived.riskDriver,
            updatedAt: new Date(),
          })
          .where(eq(facilityInventories.id, existing.id))
          .returning();
        if (updated.length > 0) {
          persisted = true;
        }
      } catch (err) {
        dbError = String(err);
        console.error("DB update failed in PATCH /api/inventory (falling back):", err);
      }
    }

    return NextResponse.json({
      success: true,
      persisted,
      dbError,
      inventory: updatedRecord,
      drug: resolvedDrug,
    });
  } catch (error) {
    console.error("API error in PATCH /api/inventory:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update medicine", details: String(error) },
      { status: 500 }
    );
  }
}