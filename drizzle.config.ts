import { defineConfig } from "drizzle-kit";

// Note: This app uses in-memory storage, database config only kept for schema definitions
// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL, ensure the database is provisioned");
// }

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost/placeholder",
  },
});
