import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const games = [
  { title: "Catan", playerCount: "3-4", playtime: "60-120 min" },
  { title: "Ticket to Ride", playerCount: "2-5", playtime: "30-60 min" },
  { title: "Pandemic", playerCount: "2-4", playtime: "45 min" },
  { title: "Azul", playerCount: "2-4", playtime: "30-45 min" },
  { title: "Wingspan", playerCount: "1-5", playtime: "40-70 min" },
  { title: "7 Wonders", playerCount: "2-7", playtime: "30 min" },
  { title: "Codenames", playerCount: "2-8", playtime: "15 min" },
  { title: "Splendor", playerCount: "2-4", playtime: "30 min" },
  { title: "Terraforming Mars", playerCount: "1-5", playtime: "120 min" },
  { title: "Dominion", playerCount: "2-4", playtime: "30 min" },
  { title: "Carcassonne", playerCount: "2-5", playtime: "35 min" },
  { title: "Spirit Island", playerCount: "1-4", playtime: "90-120 min" },
];

async function main() {
  console.log("Seeding games...");

  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.title.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: game.title.toLowerCase().replace(/\s+/g, "-"),
        ...game,
      },
    });
  }

  console.log(`Seeded ${games.length} games.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
