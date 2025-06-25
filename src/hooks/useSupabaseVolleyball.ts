
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "../context/TeamContext";
import { toast } from "sonner";

// Types that match our database schema
export interface Player {
  id: string;
  team_id: string;
  name: string;
  total_fails: number;
  total_aces: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface GameDay {
  id: string;
  team_id: string;
  date: string;
  game_type: string;
  title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Serve {
  id: string;
  team_id: string;
  player_id: string;
  game_id: string;
  type: 'fail' | 'ace';
  quality: 'good' | 'neutral' | 'bad';
  timestamp: string;
}

export interface CustomGameType {
  id: string;
  team_id: string;
  abbreviation: string;
  name: string;
  created_at: string;
}

export function useSupabasePlayers() {
  const { currentTeam } = useTeam();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTeam) {
      loadPlayers();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('players-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'players',
            filter: `team_id=eq.${currentTeam.id}`
          },
          () => {
            loadPlayers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setPlayers([]);
      setLoading(false);
    }
  }, [currentTeam]);

  const loadPlayers = async () => {
    if (!currentTeam) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', currentTeam.id)
      .order('name');

    if (error) {
      console.error('Error loading players:', error);
      toast.error('Failed to load players');
    } else {
      setPlayers(data || []);
    }
    setLoading(false);
  };

  const addPlayer = async (name: string, tags: string[] = []) => {
    if (!currentTeam) return;

    const { data, error } = await supabase
      .from('players')
      .insert({
        team_id: currentTeam.id,
        name,
        tags: tags,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
    } else {
      toast.success(`${name} added to the team!`);
      loadPlayers();
    }
  };

  const updatePlayer = async (playerId: string, updates: Partial<Pick<Player, 'name' | 'tags'>>) => {
    const { error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId);

    if (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    } else {
      loadPlayers();
    }
  };

  const removePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) {
      console.error('Error removing player:', error);
      toast.error('Failed to remove player');
    } else {
      toast.success('Player removed');
      loadPlayers();
    }
  };

  return {
    players,
    loading,
    addPlayer,
    updatePlayer,
    removePlayer,
    refreshPlayers: loadPlayers,
  };
}

export function useSupabaseGameDays() {
  const { currentTeam } = useTeam();
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTeam) {
      loadGameDays();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('gamedays-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_days',
            filter: `team_id=eq.${currentTeam.id}`
          },
          () => {
            loadGameDays();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setGameDays([]);
      setLoading(false);
    }
  }, [currentTeam]);

  const loadGameDays = async () => {
    if (!currentTeam) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('game_days')
      .select('*')
      .eq('team_id', currentTeam.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading game days:', error);
      toast.error('Failed to load game days');
    } else {
      setGameDays(data || []);
    }
    setLoading(false);
  };

  const addGameDay = async (date: string, gameType: string, title?: string, notes?: string) => {
    if (!currentTeam) return;

    const { data, error } = await supabase
      .from('game_days')
      .insert({
        team_id: currentTeam.id,
        date,
        game_type: gameType,
        title,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding game day:', error);
      toast.error('Failed to add game day');
      return null;
    } else {
      toast.success('Game day added!');
      loadGameDays();
      return data;
    }
  };

  return {
    gameDays,
    loading,
    addGameDay,
    refreshGameDays: loadGameDays,
  };
}

export function useSupabaseServes() {
  const { currentTeam } = useTeam();
  const [serves, setServes] = useState<Serve[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTeam) {
      loadServes();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('serves-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'serves',
            filter: `team_id=eq.${currentTeam.id}`
          },
          () => {
            loadServes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setServes([]);
      setLoading(false);
    }
  }, [currentTeam]);

  const loadServes = async () => {
    if (!currentTeam) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('serves')
      .select('*')
      .eq('team_id', currentTeam.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error loading serves:', error);
      toast.error('Failed to load serves');
    } else {
      setServes(data || []);
    }
    setLoading(false);
  };

  const addServe = async (playerId: string, gameId: string, type: 'fail' | 'ace', quality: 'good' | 'neutral' | 'bad') => {
    if (!currentTeam) return;

    const { error } = await supabase
      .from('serves')
      .insert({
        team_id: currentTeam.id,
        player_id: playerId,
        game_id: gameId,
        type,
        quality,
      });

    if (error) {
      console.error('Error adding serve:', error);
      toast.error('Failed to add serve');
    } else {
      loadServes();
    }
  };

  const removeServe = async (serveId: string) => {
    const { error } = await supabase
      .from('serves')
      .delete()
      .eq('id', serveId);

    if (error) {
      console.error('Error removing serve:', error);
      toast.error('Failed to remove serve');
    } else {
      loadServes();
    }
  };

  return {
    serves,
    loading,
    addServe,
    removeServe,
    refreshServes: loadServes,
  };
}
