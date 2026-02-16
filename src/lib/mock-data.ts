export interface Game {
  id: string;
  title: string;
  playerCount: string;
  playtime: string;
  image?: string;
}

export const games: Game[] = [
  {
    id: "1",
    title: "Catan",
    playerCount: "3-4",
    playtime: "60-120 min",
  },
  {
    id: "2",
    title: "Ticket to Ride",
    playerCount: "2-5",
    playtime: "30-60 min",
  },
  {
    id: "3",
    title: "Pandemic",
    playerCount: "2-4",
    playtime: "45 min",
  },
  {
    id: "4",
    title: "Azul",
    playerCount: "2-4",
    playtime: "30-45 min",
  },
  {
    id: "5",
    title: "Wingspan",
    playerCount: "1-5",
    playtime: "40-70 min",
  },
  {
    id: "6",
    title: "7 Wonders",
    playerCount: "2-7",
    playtime: "30 min",
  },
  {
    id: "7",
    title: "Codenames",
    playerCount: "2-8",
    playtime: "15 min",
  },
  {
    id: "8",
    title: "Splendor",
    playerCount: "2-4",
    playtime: "30 min",
  },
  {
    id: "9",
    title: "Terraforming Mars",
    playerCount: "1-5",
    playtime: "120 min",
  },
  {
    id: "10",
    title: "Dominion",
    playerCount: "2-4",
    playtime: "30 min",
  },
  {
    id: "11",
    title: "Carcassonne",
    playerCount: "2-5",
    playtime: "35 min",
  },
  {
    id: "12",
    title: "Spirit Island",
    playerCount: "1-4",
    playtime: "90-120 min",
  },
];

export interface UserProfile {
  username: string;
  displayName: string;
  avatarUrl?: string;
  favoriteGames: Game[];
}

export const mockUser: UserProfile = {
  username: "johndoe",
  displayName: "John Doe",
  favoriteGames: games.slice(0, 6),
};
