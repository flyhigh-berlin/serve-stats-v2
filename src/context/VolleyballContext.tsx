
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Player, GameDay, Serve, ServeQuality, SortField, SortDirection, GameType, gameTypes as defaultGameTypes } from "../types";

interface VolleyballContextType {
  // Data
  players: Player[];
  gameDays: GameDay[];
  gameTypes: Record<GameType, string>;
  customGameTypes: Record<string, string>;
  
  // Current selections
  currentGameDay: GameDay | null;
  gameTypeFilter: GameType | string | null;
  
  // Actions
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (playerId: string, newName: string) => void;
  addGameDay: (date: string, gameType: GameType | string, title?: string, notes?: string) => void;
  setCurrentGameDay: (gameId: string | null) => void;
  setGameTypeFilter: (gameType: GameType | string | null) => void;
  
  // Game type management
  addCustomGameType: (abbreviation: string, name: string) => void;
  updateGameType: (abbreviation: string, name: string) => void;
  removeCustomGameType: (abbreviation: string) => void;
  getAllGameTypes: () => Record<string, string>;
  
  // Stats tracking
  addServe: (playerId: string, type: "fail" | "ace", quality: ServeQuality) => void;
  removeServe: (playerId: string, serveId: string) => void;
  
  // Helper functions
  getPlayerStats: (playerId: string, gameId?: string, gameType?: GameType | string) => { fails: number, aces: number };
  getGameDayServes: (gameId: string) => Serve[];
  getFilteredGameDays: () => GameDay[];
  
  // Sorting and filtering
  sortedPlayers: (field: SortField, direction: SortDirection, gameId?: string, gameType?: GameType | string) => Player[];
}

// Create the context
const VolleyballContext = createContext<VolleyballContextType | undefined>(undefined);

// Storage keys
const PLAYERS_STORAGE_KEY = "volleyball_players";
const GAME_DAYS_STORAGE_KEY = "volleyball_game_days";
const CURRENT_GAME_DAY_KEY = "volleyball_current_game";
const GAME_TYPE_FILTER_KEY = "volleyball_game_type_filter";
const CUSTOM_GAME_TYPES_KEY = "volleyball_custom_game_types";

export function VolleyballProvider({ children }: { children: ReactNode }) {
  // State for players and game days
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [currentGameDay, setCurrentGameDayState] = useState<GameDay | null>(null);
  const [gameTypeFilter, setGameTypeFilterState] = useState<GameType | string | null>(null);
  const [customGameTypes, setCustomGameTypes] = useState<Record<string, string>>({});

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY);
    const storedGameDays = localStorage.getItem(GAME_DAYS_STORAGE_KEY);
    const storedCurrentGameDay = localStorage.getItem(CURRENT_GAME_DAY_KEY);
    const storedGameTypeFilter = localStorage.getItem(GAME_TYPE_FILTER_KEY);
    const storedCustomGameTypes = localStorage.getItem(CUSTOM_GAME_TYPES_KEY);
    
    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    }
    
    if (storedGameDays) {
      setGameDays(JSON.parse(storedGameDays));
    }
    
    if (storedCurrentGameDay) {
      const gameId = JSON.parse(storedCurrentGameDay);
      if (gameId && storedGameDays) {
        const gameDays = JSON.parse(storedGameDays);
        const game = gameDays.find((g: GameDay) => g.id === gameId);
        if (game) {
          setCurrentGameDayState(game);
        }
      }
    }

    if (storedGameTypeFilter) {
      setGameTypeFilterState(JSON.parse(storedGameTypeFilter));
    }

    if (storedCustomGameTypes) {
      setCustomGameTypes(JSON.parse(storedCustomGameTypes));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(GAME_DAYS_STORAGE_KEY, JSON.stringify(gameDays));
  }, [gameDays]);

  useEffect(() => {
    localStorage.setItem(CURRENT_GAME_DAY_KEY, JSON.stringify(currentGameDay?.id || null));
  }, [currentGameDay]);

  useEffect(() => {
    localStorage.setItem(GAME_TYPE_FILTER_KEY, JSON.stringify(gameTypeFilter));
  }, [gameTypeFilter]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_GAME_TYPES_KEY, JSON.stringify(customGameTypes));
  }, [customGameTypes]);

  // Get all game types (default + custom)
  const getAllGameTypes = () => {
    return { ...defaultGameTypes, ...customGameTypes };
  };

  // Add a new player
  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      totalFails: 0,
      totalAces: 0,
      serves: []
    };
    setPlayers([...players, newPlayer]);
  };

  // Remove a player
  const removePlayer = (id: string) => {
    setPlayers(players.filter(player => player.id !== id));
  };

  // Update player name
  const updatePlayerName = (playerId: string, newName: string) => {
    setPlayers(players.map(player => 
      player.id === playerId ? { ...player, name: newName } : player
    ));
  };

  // Add a new game day
  const addGameDay = (date: string, gameType: GameType | string, title?: string, notes?: string) => {
    const newGameDay: GameDay = {
      id: crypto.randomUUID(),
      date,
      gameType: gameType as GameType,
      title,
      notes
    };
    setGameDays([...gameDays, newGameDay]);
    
    // Set as current game day if none is selected
    if (!currentGameDay) {
      setCurrentGameDayState(newGameDay);
    }
  };

  // Set the current game day
  const setCurrentGameDay = (gameId: string | null) => {
    if (gameId === null) {
      setCurrentGameDayState(null);
      return;
    }
    
    const gameDay = gameDays.find(day => day.id === gameId);
    setCurrentGameDayState(gameDay || null);
  };

  // Set game type filter
  const setGameTypeFilter = (gameType: GameType | string | null) => {
    setGameTypeFilterState(gameType);
  };

  // Game type management functions
  const addCustomGameType = (abbreviation: string, name: string) => {
    setCustomGameTypes(prev => ({ ...prev, [abbreviation]: name }));
  };

  const updateGameType = (abbreviation: string, name: string) => {
    if (abbreviation in defaultGameTypes) {
      // Can't edit default game types, but could add override
      setCustomGameTypes(prev => ({ ...prev, [abbreviation]: name }));
    } else {
      setCustomGameTypes(prev => ({ ...prev, [abbreviation]: name }));
    }
  };

  const removeCustomGameType = (abbreviation: string) => {
    if (abbreviation in defaultGameTypes) return; // Can't remove default types
    setCustomGameTypes(prev => {
      const updated = { ...prev };
      delete updated[abbreviation];
      return updated;
    });
  };

  // Get filtered game days based on game type filter
  const getFilteredGameDays = () => {
    if (!gameTypeFilter) return gameDays;
    return gameDays.filter(gameDay => gameDay.gameType === gameTypeFilter);
  };

  // Add a new serve (fail or ace)
  const addServe = (playerId: string, type: "fail" | "ace", quality: ServeQuality) => {
    if (!currentGameDay) return;
    
    // Create the serve record
    const newServe: Serve = {
      id: crypto.randomUUID(),
      gameId: currentGameDay.id,
      type,
      quality,
      timestamp: new Date().toISOString()
    };
    
    // Update the player's stats
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          totalFails: type === "fail" ? player.totalFails + 1 : player.totalFails,
          totalAces: type === "ace" ? player.totalAces + 1 : player.totalAces,
          serves: [...player.serves, newServe]
        };
      }
      return player;
    }));
  };

  // Remove a serve
  const removeServe = (playerId: string, serveId: string) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        const serve = player.serves.find(s => s.id === serveId);
        if (!serve) return player;
        
        return {
          ...player,
          totalFails: serve.type === "fail" ? player.totalFails - 1 : player.totalFails,
          totalAces: serve.type === "ace" ? player.totalAces - 1 : player.totalAces,
          serves: player.serves.filter(s => s.id !== serveId)
        };
      }
      return player;
    }));
  };

  // Get player stats for all games, a specific game day, or filtered by game type
  const getPlayerStats = (playerId: string, gameId?: string, gameType?: GameType) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { fails: 0, aces: 0 };
    
    let relevantServes = player.serves;

    if (gameId) {
      // Filter serves for the specific game
      relevantServes = player.serves.filter(serve => serve.gameId === gameId);
    } else if (gameType) {
      // Filter serves for the specific game type
      const filteredGameDays = gameDays.filter(gameDay => gameDay.gameType === gameType);
      const gameIds = filteredGameDays.map(gameDay => gameDay.id);
      relevantServes = player.serves.filter(serve => gameIds.includes(serve.gameId));
    } else if (!gameId && !gameType) {
      // Use total stats
      return { fails: player.totalFails, aces: player.totalAces };
    }
    
    const fails = relevantServes.filter(serve => serve.type === "fail").length;
    const aces = relevantServes.filter(serve => serve.type === "ace").length;
    
    return { fails, aces };
  };

  // Get all serves for a specific game day
  const getGameDayServes = (gameId: string) => {
    return players.flatMap(player => 
      player.serves.filter(serve => serve.gameId === gameId)
    );
  };

  // Sort players based on various criteria
  const sortedPlayers = (field: SortField, direction: SortDirection, gameId?: string, gameType?: GameType) => {
    return [...players].sort((a, b) => {
      let aValue, bValue;
      
      if (field === "name") {
        aValue = a.name;
        bValue = b.name;
        return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      const aStats = getPlayerStats(a.id, gameId, gameType);
      const bStats = getPlayerStats(b.id, gameId, gameType);
      
      if (field === "serves") {
        aValue = aStats.fails + aStats.aces;
        bValue = bStats.fails + bStats.aces;
      } else if (field === "fails") {
        aValue = aStats.fails;
        bValue = bStats.fails;
      } else {
        aValue = aStats.aces;
        bValue = bStats.aces;
      }
      
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    });
  };

  const value = {
    players,
    gameDays,
    gameTypes: defaultGameTypes,
    customGameTypes,
    currentGameDay,
    gameTypeFilter,
    addPlayer,
    removePlayer,
    updatePlayerName,
    addGameDay,
    setCurrentGameDay,
    setGameTypeFilter,
    addCustomGameType,
    updateGameType,
    removeCustomGameType,
    getAllGameTypes,
    addServe,
    removeServe,
    getPlayerStats,
    getGameDayServes,
    getFilteredGameDays,
    sortedPlayers
  };

  return (
    <VolleyballContext.Provider value={value}>
      {children}
    </VolleyballContext.Provider>
  );
}

// Custom hook to use the context
export function useVolleyball() {
  const context = useContext(VolleyballContext);
  if (context === undefined) {
    throw new Error("useVolleyball must be used within a VolleyballProvider");
  }
  return context;
}
