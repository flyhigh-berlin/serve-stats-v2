
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "../context/TeamContext";
import { Player, GameDay, Serve, GameType } from "../types";
import { toast } from "sonner";

export function useSupabaseVolleyball() {
  const { currentTeam } = useTeam();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [currentGameDay, setCurrentGameDay] = useState<GameDay | null>(null);
  const [serves, setServes] = useState<Serve[]>([]);
  const [loading, setLoading] = useState(false);

  const currentTeamId = currentTeam?.id;

  // Load players from database
  const loadPlayers = async () => {
    if (!currentTeamId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', currentTeamId);

      if (error) throw error;

      // Convert JSONB tags to string array and map to Player interface
      const formattedPlayers: Player[] = data.map(player => ({
        id: player.id,
        name: player.name,
        totalFails: player.total_fails || 0,
        totalAces: player.total_aces || 0,
        serves: [], // Will be loaded separately
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

  // Add game day
  const addGameDay = async (gameDay: Omit<GameDay, 'id'>) => {
    if (!currentTeamId) return;
    
    try {
      const { data, error } = await supabase
        .from('game_days')
        .insert({
          team_id: currentTeamId,
          date: gameDay.date,
          game_type: gameDay.gameType,
          title: gameDay.title,
          notes: gameDay.notes
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

  // Record serve
  const recordServe = async (playerId: string, type: "fail" | "ace", quality: "good" | "neutral" | "bad") => {
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
    } else {
      setPlayers([]);
      setGameDays([]);
      setCurrentGameDay(null);
      setServes([]);
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

  return {
    players,
    gameDays,
    currentGameDay,
    serves,
    loading,
    setCurrentGameDay,
    addPlayer,
    addGameDay,
    recordServe,
    refreshData: () => {
      loadPlayers();
      loadGameDays();
    }
  };
}
