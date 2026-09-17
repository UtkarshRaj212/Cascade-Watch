import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = (user.email || "").toLowerCase().trim();
          let assignedFacilityId: string | null = null;
          if (email === "tempoacc.utkarshraj@gmail.com") {
            assignedFacilityId = "fac-pune-sdh-2"; // Shirur Sub-District Hospital
          } else if (
            email === "utkarsh.raj135@gmail.com" ||
            email === "utkarshraj212@gmail.com" ||
            email === "test.officer@mediripple.gov"
          ) {
            assignedFacilityId = "fac-pune-dh"; // Aundh District Hospital
          }
          return {
            data: {
              ...user,
              assignedFacilityId,
            },
          };
        },
      },
    },
  },
  user: {
    additionalFields: {
      assignedFacilityId: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
