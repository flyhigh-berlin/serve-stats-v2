
// Quality of serve: good (close fail/clean ace), neutral, bad (not close fail/enemy's fault ace)
export type ServeQuality = "good" | "neutral" | "bad";

// Game types
export type GameType = "KL" | "MX" | "TN" | "TG" | "FH";

export const gameTypes: Record<GameType, string> = {
  "KL": "Liga",
  "MX": "Mixed", 
  "TN": "Tournament",
  "TG": "Test Game",
  "FH": "Fly High Training"
};

// Player model
export interface Player {
  id: string;
  name: string;
  totalFails: number;
  totalAces: number;
  serves: Serve[];
}

// Serve record
export interface Serve {
  id: string;
  gameId: string;
  type: "fail" | "ace";
  quality: ServeQuality;
  timestamp: string;
}

// Game day model
export interface GameDay {
  id: string;
  date: string;
  gameType: GameType;
  title?: string;
  notes?: string;
}

// Types for filtering and sorting the scoreboard
export type SortField = "name" | "serves" | "fails" | "aces";
export type SortDirection = "asc" | "desc";
