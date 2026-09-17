import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, user, facilities } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { authenticated: false, error: "Unauthorized. Officer session required." },
        { status: 401 }
      );
    }

    // Query user record directly from database to get up-to-date assignedFacilityId
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!userRecord || !userRecord.assignedFacilityId) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          assignedFacilityId: null,
        },
        facility: null,
        message: "No hospital facility has been assigned to this account in the database.",
      });
    }

    // Query facility details
    const [facilityRecord] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, userRecord.assignedFacilityId));

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        assignedFacilityId: userRecord.assignedFacilityId,
      },
      facility: facilityRecord || null,
    });
  } catch (error: any) {
    console.error("Error in GET /api/user/facility:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to query officer facility assignment" },
      { status: 500 }
    );
  }
}
