
// Quality of serve: good (close error/clean ace), neutral, bad (not close error/enemy's fault ace)
export type ServeQuality = "good" | "neutral" | "bad";

// Game types
export type GameType = "KL" | "MX" | "TN" | "TG" | "FH" | "PG";

export const gameTypes: Record<GameType, string> = {
  "KL": "Liga",
  "MX": "Mixed", 
  "TN": "Tournament",
  "TG": "Test Game",
  "FH": "Fly High Training",
  "PG": "Practice Game"
};

// Player model
export interface Player {
  id: string;
  name: string;
  totalFails: number;
  totalAces: number;
  serves: Serve[];
  tags: (GameType | string)[]; // Tags are game types
}

// Serve record
export interface Serve {
  id: string;
  playerId: string;
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
export type SortField = "name" | "serves" | "errors" | "aces" | "aeRatio" | "qualityScore";
export type SortDirection = "asc" | "desc";
