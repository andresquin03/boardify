import "dotenv/config";
import { defineConfig } from "prisma/config";

// Use session mode pooler (port 5432) for migrations since direct connection requires IPv4 add-on
const migrationUrl = process.env["DATABASE_URL"]?.replace(":6543/", ":5432/");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
