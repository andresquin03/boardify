import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const games = [
  {
    title: "Catan",
    description:
      "Trade, build, and settle the island of Catan in this classic resource management game. Compete with other players to be the dominant force on the island by building settlements, roads, and cities.",
    minPlayers: 3,
    maxPlayers: 4,
    minPlaytime: 60,
    maxPlaytime: 120,
    yearPublished: 1995,
    complexity: 2.3,
    designer: "Klaus Teuber",
    categories: ["Strategy", "Negotiation"],
  },
  {
    title: "Ticket to Ride",
    description:
      "Claim railway routes across the map to connect cities and complete destination tickets. Simple to learn but strategically deep, this is a perfect gateway game.",
    minPlayers: 2,
    maxPlayers: 5,
    minPlaytime: 30,
    maxPlaytime: 60,
    yearPublished: 2004,
    complexity: 1.8,
    designer: "Alan R. Moon",
    categories: ["Family", "Route Building"],
  },
  {
    title: "Pandemic",
    description:
      "Work together as a team of specialists to stop four deadly diseases from spreading across the globe. A cooperative game where you win or lose as a team.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 45,
    maxPlaytime: 45,
    yearPublished: 2008,
    complexity: 2.4,
    designer: "Matt Leacock",
    categories: ["Cooperative", "Strategy"],
  },
  {
    title: "Azul",
    description:
      "Draft colorful tiles and arrange them on your board to score points. Inspired by Portuguese azulejos, this abstract strategy game combines simple rules with deep tactics.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 30,
    maxPlaytime: 45,
    yearPublished: 2017,
    complexity: 1.8,
    designer: "Michael Kiesling",
    categories: ["Abstract", "Family"],
  },
  {
    title: "Wingspan",
    description:
      "Attract birds to your wildlife preserves in this engine-building game. Each bird you play extends a chain of powerful combinations in one of your habitats.",
    minPlayers: 1,
    maxPlayers: 5,
    minPlaytime: 40,
    maxPlaytime: 70,
    yearPublished: 2019,
    complexity: 2.5,
    designer: "Elizabeth Hargrave",
    categories: ["Strategy", "Engine Building"],
  },
  {
    title: "7 Wonders",
    description:
      "Lead an ancient civilization and build one of the seven wonders of the world. Draft cards over three ages to develop your city, army, and scientific achievements.",
    minPlayers: 2,
    maxPlayers: 7,
    minPlaytime: 30,
    maxPlaytime: 30,
    yearPublished: 2010,
    complexity: 2.3,
    designer: "Antoine Bauza",
    categories: ["Strategy", "Card Drafting"],
  },
  {
    title: "Codenames",
    description:
      "Give one-word clues to help your team guess the right words on the board. A party game of deduction and wordplay where spymasters try to contact their agents.",
    minPlayers: 2,
    maxPlayers: 8,
    minPlaytime: 15,
    maxPlaytime: 15,
    yearPublished: 2015,
    complexity: 1.3,
    designer: "Vlaada Chvatil",
    categories: ["Party", "Word Game"],
  },
  {
    title: "Splendor",
    description:
      "Collect gems to purchase development cards and attract nobles. Build an economic engine that generates increasingly valuable resources each turn.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 30,
    maxPlaytime: 30,
    yearPublished: 2014,
    complexity: 1.8,
    designer: "Marc Andre",
    categories: ["Strategy", "Engine Building"],
  },
  {
    title: "Terraforming Mars",
    description:
      "Compete with rival corporations to terraform Mars. Raise the temperature, increase oxygen levels, and create oceans while building an economic engine.",
    minPlayers: 1,
    maxPlayers: 5,
    minPlaytime: 120,
    maxPlaytime: 120,
    yearPublished: 2016,
    complexity: 3.3,
    designer: "Jacob Fryxelius",
    categories: ["Strategy", "Science Fiction"],
  },
  {
    title: "Dominion",
    description:
      "Build the most efficient deck of cards to earn victory points. The original deck-building game where every card you acquire shapes your strategy.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 30,
    maxPlaytime: 30,
    yearPublished: 2008,
    complexity: 2.4,
    designer: "Donald X. Vaccarino",
    categories: ["Strategy", "Deck Building"],
  },
  {
    title: "Carcassonne",
    description:
      "Place tiles to build a medieval landscape and deploy followers to claim features. Score points for completed cities, roads, monasteries, and farms.",
    minPlayers: 2,
    maxPlayers: 5,
    minPlaytime: 35,
    maxPlaytime: 35,
    yearPublished: 2000,
    complexity: 1.9,
    designer: "Klaus-Jurgen Wrede",
    categories: ["Family", "Tile Placement"],
  },
  {
    title: "Spirit Island",
    description:
      "Defend your island from colonizing invaders as powerful spirits of the land. A complex cooperative game with deep strategic decision-making.",
    minPlayers: 1,
    maxPlayers: 4,
    minPlaytime: 90,
    maxPlaytime: 120,
    yearPublished: 2017,
    complexity: 4.0,
    designer: "R. Eric Reuss",
    categories: ["Cooperative", "Strategy"],
  },
];

async function main() {
  console.log("Seeding games...");

  for (const game of games) {
    const { categories, ...gameData } = game;
    const slug = slugify(game.title);

    const savedGame = await prisma.game.upsert({
      where: { slug },
      update: { ...gameData, slug },
      create: { ...gameData, slug },
    });

    await prisma.gameCategory.deleteMany({ where: { gameId: savedGame.id } });

    for (const categoryName of categories) {
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: {
          name: categoryName,
          slug: slugify(categoryName),
        },
      });

      await prisma.gameCategory.create({
        data: {
          gameId: savedGame.id,
          categoryId: category.id,
        },
      });
    }
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
