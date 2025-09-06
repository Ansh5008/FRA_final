import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, doublePrecision, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fraClaims = pgTable("fra_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: text("claim_id").notNull().unique(),
  beneficiaryName: text("beneficiary_name").notNull(),
  village: text("village").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull(),
  claimType: text("claim_type").notNull(), // "Individual Forest Right" | "Community Forest Right"
  landArea: text("land_area").notNull(),
  documents: text("documents").array().notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  coordinates: text("coordinates"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  aiScore: doublePrecision("ai_score").default(0),
  aiFlags: text("ai_flags").array(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
  role: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  message: true,
});

export const insertFraClaimSchema = createInsertSchema(fraClaims).pick({
  beneficiaryName: true,
  village: true,
  district: true,
  state: true,
  claimType: true,
  landArea: true,
  documents: true,
  coordinates: true,
  aiScore: true,
  aiFlags: true,
}).extend({
  claimType: z.enum(["Individual Forest Right", "Community Forest Right"]),
});

// --- Add TypeScript interfaces for shared use ---

export interface FraClaim {
  id: string;
  claimId: string;
  beneficiaryName: string;
  village: string;
  district: string;
  state: string;
  claimType: "Individual Forest Right" | "Community Forest Right";
  landArea: string;
  documents: string[];
  coordinates?: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  aiScore?: number;
  aiFlags?: string[];
}

export type InsertFraClaim = Omit<
  FraClaim,
  "id" | "claimId" | "status" | "createdAt" | "updatedAt"
>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
// Remove old InsertFraClaim and FraClaim exports if present
// export type InsertFraClaim = z.infer<typeof insertFraClaimSchema>;
// export type FraClaim = typeof fraClaims.$inferSelect;