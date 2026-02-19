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
    image: "https://upload.wikimedia.org/wikipedia/en/a/a3/Catan-2015-boxart.jpg",
    description:
      "Trade, build, and settle the island of Catan in this classic resource management game. Compete with other players to be the dominant force on the island by building settlements, roads, and cities.",
    minPlayers: 3,
    maxPlayers: 4,
    minPlaytime: 60,
    maxPlaytime: 120,
    yearPublished: 1995,
    difficulty: 2.3,
    rating: 7.1,
    designer: "Klaus Teuber",
    categories: ["Strategy", "Negotiation"],
  },
  {
    title: "Ticket to Ride",
    image: "https://upload.wikimedia.org/wikipedia/en/9/92/Ticket_to_Ride_Board_Game_Box_EN.jpg",
    description:
      "Claim railway routes across the map to connect cities and complete destination tickets. Simple to learn but strategically deep, this is a perfect gateway game.",
    minPlayers: 2,
    maxPlayers: 5,
    minPlaytime: 30,
    maxPlaytime: 60,
    yearPublished: 2004,
    difficulty: 1.8,
    rating: 7.4,
    designer: "Alan R. Moon",
    categories: ["Family", "Route Building"],
  },
  {
    title: "Pandemic",
    image: "https://upload.wikimedia.org/wikipedia/en/3/36/Pandemic_game.jpg",
    description:
      "Work together as a team of specialists to stop four deadly diseases from spreading across the globe. A cooperative game where you win or lose as a team.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 45,
    maxPlaytime: 45,
    yearPublished: 2008,
    difficulty: 2.4,
    rating: 7.5,
    designer: "Matt Leacock",
    categories: ["Cooperative", "Strategy"],
  },
  {
    title: "Azul",
    image: "https://upload.wikimedia.org/wikipedia/en/2/23/Picture_of_Azul_game_box.jpg",
    description:
      "Draft colorful tiles and arrange them on your board to score points. Inspired by Portuguese azulejos, this abstract strategy game combines simple rules with deep tactics.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 30,
    maxPlaytime: 45,
    yearPublished: 2017,
    difficulty: 1.8,
    rating: 7.7,
    designer: "Michael Kiesling",
    categories: ["Abstract", "Family"],
  },
  {
    title: "Wingspan",
    image: "https://upload.wikimedia.org/wikipedia/en/c/c3/3d-wingspan-768x752.png",
    description:
      "Attract birds to your wildlife preserves in this engine-building game. Each bird you play extends a chain of powerful combinations in one of your habitats.",
    minPlayers: 1,
    maxPlayers: 5,
    minPlaytime: 40,
    maxPlaytime: 70,
    yearPublished: 2019,
    difficulty: 2.5,
    rating: 8.1,
    designer: "Elizabeth Hargrave",
    categories: ["Strategy", "Engine Building"],
  },
  {
    title: "7 Wonders",
    image: "https://upload.wikimedia.org/wikipedia/en/0/0b/7_Wonders_-_New_Edition_boxart.png",
    description:
      "Lead an ancient civilization and build one of the seven wonders of the world. Draft cards over three ages to develop your city, army, and scientific achievements.",
    minPlayers: 2,
    maxPlayers: 7,
    minPlaytime: 30,
    maxPlaytime: 30,
    yearPublished: 2010,
    difficulty: 2.3,
    rating: 7.7,
    designer: "Antoine Bauza",
    categories: ["Strategy", "Card Drafting"],
  },
  {
    title: "Codenames",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Codenames_board_game.jpg/330px-Codenames_board_game.jpg",
    description:
      "Give one-word clues to help your team guess the right words on the board. A party game of deduction and wordplay where spymasters try to contact their agents.",
    minPlayers: 2,
    maxPlayers: 8,
    minPlaytime: 15,
    maxPlaytime: 15,
    yearPublished: 2015,
    difficulty: 1.3,
    rating: 7.5,
    designer: "Vlaada Chvatil",
    categories: ["Party", "Word Game"],
  },
  {
    title: "Splendor",
    image: "https://upload.wikimedia.org/wikipedia/en/2/2e/BoardGameSplendorLogoFairUse.jpg",
    description:
      "Collect gems to purchase development cards and attract nobles. Build an economic engine that generates increasingly valuable resources each turn.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 30,
    maxPlaytime: 30,
    yearPublished: 2014,
    difficulty: 1.8,
    rating: 7.4,
    designer: "Marc Andre",
    categories: ["Strategy", "Engine Building"],
  },
  {
    title: "Terraforming Mars",
    image: "https://upload.wikimedia.org/wikipedia/en/f/f0/Terraforming_Mars_board_game_box_cover.jpg",
    description:
      "Compete with rival corporations to terraform Mars. Raise the temperature, increase oxygen levels, and create oceans while building an economic engine.",
    minPlayers: 1,
    maxPlayers: 5,
    minPlaytime: 120,
    maxPlaytime: 120,
    yearPublished: 2016,
    difficulty: 3.3,
    rating: 8.4,
    designer: "Jacob Fryxelius",
    categories: ["Strategy", "Science Fiction"],
  },
  {
    title: "Dominion",
    image: "https://upload.wikimedia.org/wikipedia/en/b/b5/Dominion_game.jpg",
    description:
      "Build the most efficient deck of cards to earn victory points. The original deck-building game where every card you acquire shapes your strategy.",
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 30,
    maxPlaytime: 30,
    yearPublished: 2008,
    difficulty: 2.4,
    rating: 7.6,
    designer: "Donald X. Vaccarino",
    categories: ["Strategy", "Deck Building"],
  },
  {
    title: "Carcassonne",
    image: "https://upload.wikimedia.org/wikipedia/en/5/5e/Carcassonne-game.jpg",
    description:
      "Place tiles to build a medieval landscape and deploy followers to claim features. Score points for completed cities, roads, monasteries, and farms.",
    minPlayers: 2,
    maxPlayers: 5,
    minPlaytime: 35,
    maxPlaytime: 35,
    yearPublished: 2000,
    difficulty: 1.9,
    rating: 7.4,
    designer: "Klaus-Jurgen Wrede",
    categories: ["Family", "Tile Placement"],
  },
  {
    title: "Spirit Island",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Game_in_progress%2C_Spirit_Island.jpg/330px-Game_in_progress%2C_Spirit_Island.jpg",
    description:
      "Defend your island from colonizing invaders as powerful spirits of the land. A complex cooperative game with deep strategic decision-making.",
    minPlayers: 1,
    maxPlayers: 4,
    minPlaytime: 90,
    maxPlaytime: 120,
    yearPublished: 2017,
    difficulty: 4.0,
    rating: 8.3,
    designer: "R. Eric Reuss",
    categories: ["Cooperative", "Strategy"],
  },
  {
    title: "Monopoly",
    description:
      "Buy, trade, and develop properties to build your real-estate empire while trying to bankrupt opponents. A classic economic board game known for deals, rivalries, and table drama.",
    minPlayers: 2,
    maxPlayers: 8,
    minPlaytime: 60,
    maxPlaytime: 180,
    yearPublished: 1935,
    difficulty: 1.7,
    rating: 4.4,
    designer: "Lizzie Magie",
    categories: ["Family", "Economic", "Negotiation", "Classic"],
  },
  {
    title: "Risk",
    description:
      "Lead armies across the world map, form temporary alliances, and conquer territories in a battle for global dominance.",
    minPlayers: 2,
    maxPlayers: 6,
    minPlaytime: 90,
    maxPlaytime: 180,
    yearPublished: 1959,
    difficulty: 2.1,
    rating: 5.6,
    designer: "Albert Lamorisse",
    categories: ["Strategy", "War Game", "Classic"],
  },
  {
    title: "Hitster",
    image: "https://cdn.svc.asmodee.net/production-asmodeenordics/uploads/image-converter/2026/01/hitster_0003_Layer-3-150x150.webp",
    description:
      "A music party game where players scan songs and place them in chronological order on their timeline. Fast, social, and perfect for groups.",
    minPlayers: 2,
    maxPlayers: 10,
    minPlaytime: 30,
    maxPlaytime: 30,
    yearPublished: 2022,
    difficulty: 1.2,
    rating: 6.8,
    designer: "Marcus Carleson",
    categories: ["Party", "Music", "Card Game", "Trivia"],
  },
  {
    title: "UNO",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/UNO_Logo.svg/330px-UNO_Logo.svg.png",
    description:
      "Match colors and numbers, use action cards to disrupt opponents, and be the first to empty your hand. A timeless, fast-paced card game for all ages.",
    minPlayers: 2,
    maxPlayers: 10,
    minPlaytime: 15,
    maxPlaytime: 30,
    yearPublished: 1971,
    difficulty: 1.1,
    rating: 5.4,
    designer: "Merle Robbins",
    categories: ["Family", "Card Game", "Party", "Classic"],
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
