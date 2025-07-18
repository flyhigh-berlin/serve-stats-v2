
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "../context/TeamContext";
import { Player, GameDay, Serve, GameType, ServeQuality, SortField, SortDirection, gameTypes as defaultGameTypes } from "../types";
import { toast } from "sonner";

export function useSupabaseVolleyball() {
  const { currentTeam } = useTeam();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [currentGameDay, setCurrentGameDay] = useState<GameDay | null>(null);
  const [gameTypeFilter, setGameTypeFilter] = useState<GameType | string | null>(null);
  const [serves, setServes] = useState<Serve[]>([]);
  const [customGameTypes, setCustomGameTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const currentTeamId = currentTeam?.id;

  // Load players from database with their serves
  const loadPlayers = async () => {
    if (!currentTeamId) return;
    
    setLoading(true);
    try {
      // Load players first
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', currentTeamId);

      if (playersError) throw playersError;

      // Load all serves for this team with player associations
      const { data: servesData, error: servesError } = await supabase
        .from('serves')
        .select('*')
        .eq('team_id', currentTeamId);

      if (servesError) throw servesError;

      // Convert JSONB tags to string array and map to Player interface with serves
      const formattedPlayers: Player[] = playersData.map(player => ({
        id: player.id,
        name: player.name,
        totalFails: player.total_fails || 0,
        totalAces: player.total_aces || 0,
        serves: servesData
          .filter(serve => serve.player_id === player.id)
          .map(serve => ({
            id: serve.id,
            gameId: serve.game_id,
            type: serve.type as "fail" | "ace",
            quality: serve.quality as "good" | "neutral" | "bad",
            timestamp: serve.timestamp || new Date().toISOString()
          })),
        tags: Array.isArray(player.tags) 
          ? player.tags as string[]
          : (typeof player.tags === 'string' 
              ? JSON.parse(player.tags) 
              : []) as string[]
      }));

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  // Load game days from database
  const loadGameDays = async () => {
    if (!currentTeamId) return;
    
    try {
      const { data, error } = await supabase
        .from('game_days')
        .select('*')
        .eq('team_id', currentTeamId)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedGameDays: GameDay[] = data.map(gameDay => ({
        id: gameDay.id,
        date: gameDay.date,
        gameType: gameDay.game_type as GameType,
        title: gameDay.title || undefined,
        notes: gameDay.notes || undefined
      }));

      setGameDays(formattedGameDays);
    } catch (error) {
      console.error('Error loading game days:', error);
      toast.error('Failed to load game days');
    }
  };

  // Load serves for current game day
  const loadServes = async (gameId: string) => {
    try {
      const { data, error } = await supabase
        .from('serves')
        .select('*')
        .eq('game_id', gameId);

      if (error) throw error;

      const formattedServes: Serve[] = data.map(serve => ({
        id: serve.id,
        gameId: serve.game_id,
        type: serve.type as "fail" | "ace",
        quality: serve.quality as "good" | "neutral" | "bad",
        timestamp: serve.timestamp || new Date().toISOString()
      }));

      setServes(formattedServes);
    } catch (error) {
      console.error('Error loading serves:', error);
      toast.error('Failed to load serves');
    }
  };

  // Add player
  const addPlayer = async (name: string, tags: string[] = []) => {
    if (!currentTeamId) return;
    
    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          name,
          team_id: currentTeamId,
          tags: JSON.stringify(tags),
          total_aces: 0,
          total_fails: 0
        })
        .select()
        .single();

      if (error) throw error;

      const newPlayer: Player = {
        id: data.id,
        name: data.name,
        totalFails: data.total_fails || 0,
        totalAces: data.total_aces || 0,
        serves: [],
        tags: Array.isArray(data.tags) 
          ? data.tags as string[]
          : (typeof data.tags === 'string' 
              ? JSON.parse(data.tags) 
              : []) as string[]
      };

      setPlayers(prev => [...prev, newPlayer]);
      toast.success(`Player ${name} added successfully`);
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
    }
  };

  // Remove player
  const removePlayer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlayers(prev => prev.filter(p => p.id !== id));
      toast.success('Player removed successfully');
    } catch (error) {
      console.error('Error removing player:', error);
      toast.error('Failed to remove player');
    }
  };

  // Update player name
  const updatePlayerName = async (playerId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ name: newName })
        .eq('id', playerId);

      if (error) throw error;

      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, name: newName } : p
      ));
      toast.success('Player name updated');
    } catch (error) {
      console.error('Error updating player name:', error);
      toast.error('Failed to update player name');
    }
  };

  // Update player tags
  const updatePlayerTags = async (playerId: string, tags: string[]) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ tags: JSON.stringify(tags) })
        .eq('id', playerId);

      if (error) throw error;

      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, tags } : p
      ));
      toast.success('Player tags updated');
    } catch (error) {
      console.error('Error updating player tags:', error);
      toast.error('Failed to update player tags');
    }
  };

  // Check if tag can be removed from player
  const canRemoveTagFromPlayer = (playerId: string, tag: string): boolean => {
    const player = players.find(p => p.id === playerId);
    if (!player) return false;
    return player.tags.length > 1 || !player.tags.includes(tag);
  };

  // Add game day (updated signature)
  const addGameDay = async (date: string, gameType: GameType | string, title?: string, notes?: string) => {
    if (!currentTeamId) return;
    
    try {
      const { data, error } = await supabase
        .from('game_days')
        .insert({
          team_id: currentTeamId,
          date: date,
          game_type: gameType,
          title: title,
          notes: notes
        })
        .select()
        .single();

      if (error) throw error;

      const newGameDay: GameDay = {
        id: data.id,
        date: data.date,
        gameType: data.game_type as GameType,
        title: data.title || undefined,
        notes: data.notes || undefined
      };

      setGameDays(prev => [newGameDay, ...prev]);
      toast.success('Game day added successfully');
    } catch (error) {
      console.error('Error adding game day:', error);
      toast.error('Failed to add game day');
    }
  };

  // Record serve (alias for addServe)
  const addServe = async (playerId: string, type: "fail" | "ace", quality: ServeQuality) => {
    if (!currentGameDay) return;
    
    try {
      const { data, error } = await supabase
        .from('serves')
        .insert({
          player_id: playerId,
          game_id: currentGameDay.id,
          team_id: currentTeamId!,
          type,
          quality,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newServe: Serve = {
        id: data.id,
        gameId: data.game_id,
        type: data.type as "fail" | "ace",
        quality: data.quality as "good" | "neutral" | "bad",
        timestamp: data.timestamp || new Date().toISOString()
      };

      setServes(prev => [...prev, newServe]);
      
      // Update player stats locally (will be synced by database trigger)
      setPlayers(prev => prev.map(player => 
        player.id === playerId 
          ? {
              ...player,
              totalAces: type === 'ace' ? player.totalAces + 1 : player.totalAces,
              totalFails: type === 'fail' ? player.totalFails + 1 : player.totalFails,
              serves: [...player.serves, newServe]
            }
          : player
      ));
      
      toast.success(`${type === 'ace' ? 'Ace' : 'Fail'} recorded`);
    } catch (error) {
      console.error('Error recording serve:', error);
      toast.error('Failed to record serve');
    }
  };

  // Load data when team changes
  useEffect(() => {
    if (currentTeamId) {
      loadPlayers();
      loadGameDays();
      loadCustomGameTypes();
    } else {
      setPlayers([]);
      setGameDays([]);
      setCurrentGameDay(null);
      setServes([]);
      setCustomGameTypes({});
    }
  }, [currentTeamId]);

  // Load serves when game day changes
  useEffect(() => {
    if (currentGameDay) {
      loadServes(currentGameDay.id);
    } else {
      setServes([]);
    }
  }, [currentGameDay]);

  // Custom game types management
  const addCustomGameType = async (abbreviation: string, name: string) => {
    if (!currentTeamId) return;
    
    try {
      const { error } = await supabase
        .from('custom_game_types')
        .insert({
          team_id: currentTeamId,
          abbreviation,
          name
        });

      if (error) throw error;

      setCustomGameTypes(prev => ({ ...prev, [abbreviation]: name }));
      toast.success('Game type added successfully');
    } catch (error) {
      console.error('Error adding game type:', error);
      toast.error('Failed to add game type');
    }
  };

  const updateGameType = async (abbreviation: string, name: string) => {
    if (!currentTeamId) return;
    
    try {
      const { error } = await supabase
        .from('custom_game_types')
        .update({ name })
        .eq('team_id', currentTeamId)
        .eq('abbreviation', abbreviation);

      if (error) throw error;

      setCustomGameTypes(prev => ({ ...prev, [abbreviation]: name }));
      toast.success('Game type updated successfully');
    } catch (error) {
      console.error('Error updating game type:', error);
      toast.error('Failed to update game type');
    }
  };

  const removeCustomGameType = async (abbreviation: string) => {
    if (!currentTeamId) return;
    
    try {
      const { error } = await supabase
        .from('custom_game_types')
        .delete()
        .eq('team_id', currentTeamId)
        .eq('abbreviation', abbreviation);

      if (error) throw error;

      setCustomGameTypes(prev => {
        const newTypes = { ...prev };
        delete newTypes[abbreviation];
        return newTypes;
      });
      toast.success('Game type removed successfully');
    } catch (error) {
      console.error('Error removing game type:', error);
      toast.error('Failed to remove game type');
    }
  };

  // Get all game types (default + custom)
  const getAllGameTypes = (): Record<string, string> => {
    return { ...defaultGameTypes, ...customGameTypes };
  };

  // Get player stats
  const getPlayerStats = (playerId: string, gameId?: string, gameType?: GameType | string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { errors: 0, aces: 0 };

    let relevantServes = player.serves || [];

    if (gameId) {
      relevantServes = relevantServes.filter(s => s.gameId === gameId);
    }

    if (gameType) {
      const filteredGameDays = gameDays.filter(gd => gd.gameType === gameType);
      const gameIds = filteredGameDays.map(gd => gd.id);
      relevantServes = relevantServes.filter(s => gameIds.includes(s.gameId));
    }

    return {
      errors: relevantServes.filter(s => s.type === "fail").length,
      aces: relevantServes.filter(s => s.type === "ace").length
    };
  };

  // Get game day serves
  const getGameDayServes = (gameId: string): Serve[] => {
    return serves.filter(s => s.gameId === gameId);
  };

  // Get filtered game days
  const getFilteredGameDays = (): GameDay[] => {
    if (!gameTypeFilter) return gameDays;
    return gameDays.filter(gd => gd.gameType === gameTypeFilter);
  };

  // Get filtered players
  const getFilteredPlayers = (): Player[] => {
    if (!gameTypeFilter) return players;
    return players.filter(p => p.tags.includes(gameTypeFilter));
  };

  // Sort players
  const sortedPlayers = (field: SortField, direction: SortDirection, gameId?: string, gameType?: GameType | string): Player[] => {
    const playersToSort = getFilteredPlayers();
    
    return playersToSort.sort((a, b) => {
      let aValue: number, bValue: number;
      
      if (field === "name") {
        return direction === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      const aStats = getPlayerStats(a.id, gameId, gameType);
      const bStats = getPlayerStats(b.id, gameId, gameType);
      
      switch (field) {
        case "aces":
          aValue = aStats.aces;
          bValue = bStats.aces;
          break;
        case "errors":
          aValue = aStats.errors;
          bValue = bStats.errors;
          break;
        case "aeRatio":
          aValue = aStats.errors === 0 ? aStats.aces : aStats.aces / aStats.errors;
          bValue = bStats.errors === 0 ? bStats.aces : bStats.aces / bStats.errors;
          break;
        case "serves":
          aValue = aStats.aces + aStats.errors;
          bValue = bStats.aces + bStats.errors;
          break;
        case "qualityScore":
          // This would need serve quality data, simplified for now
          aValue = 0;
          bValue = 0;
          break;
        default:
          return 0;
      }
      
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    });
  };

  // Remove serve
  const removeServe = async (playerId: string, serveId: string) => {
    try {
      const { error } = await supabase
        .from('serves')
        .delete()
        .eq('id', serveId);

      if (error) throw error;

      setServes(prev => prev.filter(s => s.id !== serveId));
      
      // Update player's serves locally
      setPlayers(prev => prev.map(player => 
        player.id === playerId 
          ? {
              ...player,
              serves: player.serves.filter(s => s.id !== serveId)
            }
          : player
      ));
      
      toast.success('Serve removed');
    } catch (error) {
      console.error('Error removing serve:', error);
      toast.error('Failed to remove serve');
    }
  };

  // Set current game day by ID
  const setCurrentGameDayById = (gameId: string | null) => {
    if (!gameId) {
      setCurrentGameDay(null);
      return;
    }
    const gameDay = gameDays.find(gd => gd.id === gameId);
    setCurrentGameDay(gameDay || null);
  };

  // Load custom game types
  const loadCustomGameTypes = async () => {
    if (!currentTeamId) return;
    
    try {
      const { data, error } = await supabase
        .from('custom_game_types')
        .select('*')
        .eq('team_id', currentTeamId);

      if (error) throw error;

      const customTypes: Record<string, string> = {};
      data.forEach(type => {
        customTypes[type.abbreviation] = type.name;
      });
      setCustomGameTypes(customTypes);
    } catch (error) {
      console.error('Error loading custom game types:', error);
    }
  };

  return {
    // Data
    players,
    gameDays,
    currentGameDay,
    gameTypeFilter,
    serves,
    loading,
    gameTypes: defaultGameTypes,
    customGameTypes,
    
    // Actions
    addPlayer,
    removePlayer,
    updatePlayerName,
    updatePlayerTags,
    canRemoveTagFromPlayer,
    addGameDay,
    setCurrentGameDay: setCurrentGameDayById,
    setGameTypeFilter,
    
    // Game type management
    addCustomGameType,
    updateGameType,
    removeCustomGameType,
    getAllGameTypes,
    
    // Stats tracking
    addServe,
    removeServe,
    
    // Helper functions
    getPlayerStats,
    getGameDayServes,
    getFilteredGameDays,
    getFilteredPlayers,
    sortedPlayers,
    
    // Utility
    refreshData: () => {
      loadPlayers();
      loadGameDays();
      loadCustomGameTypes();
    }
  };
}
