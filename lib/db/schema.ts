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

export const monteCarloSimulations = pgTable("monte_carlo_simulations", {
  id: text("id").primaryKey(),
  scenarioName: text("scenario_name").notNull(),
  district: text("district").notNull().default("all"),
  drugId: text("drug_id").notNull().references(() => drugs.id),
  iterations: integer("iterations").notNull().default(500),
  horizonDays: integer("horizon_days").notNull().default(30),
  demandVolatility: doublePrecision("demand_volatility").notNull().default(0.20),
  leadTimeDelayProb: doublePrecision("lead_time_delay_prob").notNull().default(0.35),
  surgeProbability: doublePrecision("surge_probability").notNull().default(0.10),
  networkStockoutProbability: doublePrecision("network_stockout_probability").notNull(),
  expectedStockoutsCount: doublePrecision("expected_stockouts_count").notNull(),
  p95UnmetDemand: integer("p95_unmet_demand").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monteCarloFacilityMetrics = pgTable("monte_carlo_facility_metrics", {
  id: serial("id").primaryKey(),
  simulationId: text("simulation_id").notNull().references(() => monteCarloSimulations.id, { onDelete: "cascade" }),
  facilityId: text("facility_id").notNull().references(() => facilities.id),
  drugId: text("drug_id").notNull().references(() => drugs.id),
  stockoutProbability: doublePrecision("stockout_probability").notNull(), // 0.0 - 1.0
  meanStockoutDay: doublePrecision("mean_stockout_day"),
  p10StockoutDay: doublePrecision("p10_stockout_day"),
  p50StockoutDay: doublePrecision("p50_stockout_day"),
  p90StockoutDay: doublePrecision("p90_stockout_day"),
  cascadeVulnerabilityScore: doublePrecision("cascade_vulnerability_score").notNull().default(0), // likelihood of being pushed into stockout by other facilities
  cascadeContagionScore: doublePrecision("cascade_contagion_score").notNull().default(0), // expected number of downstream facility failures triggered
  meanUnmetDemand: integer("mean_unmet_demand").notNull().default(0),
  trajectoryQuantiles: text("trajectory_quantiles").notNull(), // JSON string array of { day, p10, p25, p50, p75, p90, mean }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monteCarloCascadeEdges = pgTable("monte_carlo_cascade_edges", {
  id: serial("id").primaryKey(),
  simulationId: text("simulation_id").notNull().references(() => monteCarloSimulations.id, { onDelete: "cascade" }),
  sourceFacilityId: text("source_facility_id").notNull().references(() => facilities.id),
  targetFacilityId: text("target_facility_id").notNull().references(() => facilities.id),
  drugId: text("drug_id").notNull().references(() => drugs.id),
  cascadeProbability: doublePrecision("cascade_probability").notNull(), // P(target stocks out | source stocks out)
  meanDeflectedUnits: doublePrecision("mean_deflected_units").notNull(),
  daysAccelerated: doublePrecision("days_accelerated").notNull().default(0), // How many days earlier target depletes due to spillover
  riskTier: text("risk_tier").notNull().default("moderate"), // 'critical' | 'high' | 'moderate' | 'low'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Facility = typeof facilities.$inferSelect;
export type Drug = typeof drugs.$inferSelect;
export type FacilityInventory = typeof facilityInventories.$inferSelect;
export type ReferralLink = typeof referralLinks.$inferSelect;
export type MonteCarloSimulation = typeof monteCarloSimulations.$inferSelect;
export type MonteCarloFacilityMetric = typeof monteCarloFacilityMetrics.$inferSelect;
export type MonteCarloCascadeEdge = typeof monteCarloCascadeEdges.$inferSelect;

// =========================================================================
// BETTER AUTH TABLES
// =========================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  assignedFacilityId: text("assigned_facility_id").references(() => facilities.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
