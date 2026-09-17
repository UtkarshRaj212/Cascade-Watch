import { db } from "../lib/db";
import { user } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Updating assigned facilities in PostgreSQL database...");

  // Assign Shirur Sub-District Hospital (fac-pune-sdh-2) to tempoacc.utkarshraj@gmail.com
  await db
    .update(user)
    .set({ assignedFacilityId: "fac-pune-sdh-2" })
    .where(eq(user.email, "tempoacc.utkarshraj@gmail.com"));

  // Assign Aundh District Hospital (fac-pune-dh) to test.officer@mediripple.gov
  await db
    .update(user)
    .set({ assignedFacilityId: "fac-pune-dh" })
    .where(eq(user.email, "test.officer@mediripple.gov"));

  // If utkarsh.raj135@gmail.com or utkarshraj212@gmail.com is already registered, assign fac-pune-dh
  await db
    .update(user)
    .set({ assignedFacilityId: "fac-pune-dh" })
    .where(eq(user.email, "utkarsh.raj135@gmail.com"));

  await db
    .update(user)
    .set({ assignedFacilityId: "fac-pune-dh" })
    .where(eq(user.email, "utkarshraj212@gmail.com"));

  const allUsers = await db.select().from(user);
  console.log("Current user facility assignments in DB:");
  for (const u of allUsers) {
    console.log(`- Email: ${u.email} | Name: ${u.name} | Assigned Facility: ${u.assignedFacilityId || "NONE"}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
