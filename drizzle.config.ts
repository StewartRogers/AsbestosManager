import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Make sure it's set.");
}

export default defineConfig({
  schema: "./shared/schema.ts", // adjust if needed
  out: "./migrations",
  dialect: "postgresql", // ✅ use 'postgresql' here
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
