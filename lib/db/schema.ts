import { pgTable, text, serial, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";

export const facilities = pgTable("facilities", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  district: text("district").notNull(),
  facilityType: text("facility_type").notNull(), // 'District Hospital' | 'Sub-District Hospital' | 'Community Health Center' | 'Primary Health Center'
  tier: text("tier").notNull(), // 'Tertiary' | 'Secondary' | 'Primary'
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  bedCapacity: integer("bed_capacity").notNull().default(50),
  catchmentPopulation: integer("catchment_population").notNull().default(100000),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const drugs = pgTable("drugs", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull().default("vials"),
  leadTimeDays: integer("lead_time_days").notNull().default(7),
  safetyStockDays: integer("safety_stock_days").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const facilityInventories = pgTable("facility_inventories", {
  id: serial("id").primaryKey(),
  facilityId: text("facility_id").notNull().references(() => facilities.id),
  drugId: text("drug_id").notNull().references(() => drugs.id),
  currentStock: integer("current_stock").notNull(),
  avgDailyConsumption: doublePrecision("avg_daily_consumption").notNull(),
  safetyStock: integer("safety_stock").notNull(),
  daysCover: doublePrecision("days_cover").notNull(),
  daysCoverPipeline: doublePrecision("days_cover_pipeline").notNull(),
  pipelineUnits: integer("pipeline_units").notNull().default(0),
  nextDeliveryDays: integer("next_delivery_days"),
  replenishmentStatus: text("replenishment_status").notNull(), // 'On Track' | 'Delayed' | 'Critical Delay' | 'No Order'
  riskProbability: doublePrecision("risk_probability").notNull(), // 0.0 - 1.0
  riskStatus: text("risk_status").notNull(), // 'critical' | 'warning' | 'low' | 'insufficient_data'
  riskDriver: text("risk_driver").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const referralLinks = pgTable("referral_links", {
  id: serial("id").primaryKey(),
  sourceFacilityId: text("source_facility_id").notNull().references(() => facilities.id),
  targetFacilityId: text("target_facility_id").notNull().references(() => facilities.id),
  transferTimeHours: doublePrecision("transfer_time_hours").notNull().default(1.5),
  transferVolumeShare: doublePrecision("transfer_volume_share").notNull().default(0.35), // proportion of deflecting demand redirected
  referralType: text("referral_type").notNull().default("tertiary_escalation"), // 'tertiary_escalation' | 'peer_redirection'
});

export type Facility = typeof facilities.$inferSelect;
export type Drug = typeof drugs.$inferSelect;
export type FacilityInventory = typeof facilityInventories.$inferSelect;
export type ReferralLink = typeof referralLinks.$inferSelect;
