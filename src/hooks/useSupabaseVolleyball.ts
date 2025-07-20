import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "../context/TeamContext";
import { Player, GameDay, Serve, GameType, ServeQuality, SortField, SortDirection, gameTypes as defaultGameTypes } from "../types";
import { toast } from "sonner";
import React from "react";

export function useSupabaseVolleyball() {
  const { currentTeam } = useTeam();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameDays, setGameDays] = useState<GameDay[]>([]);
  const [currentGameDay, setCurrentGameDay] = useState<GameDay | null>(null);
  const [gameTypeFilter, setGameTypeFilter] = useState<GameType | string | null>(null);
  const [serves, setServes] = useState<Serve[]>([]);
  const [customGameTypes, setCustomGameTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const currentTeamId = currentTeam?.id;

  console.log('🏐 HOOK STATE DEBUG - useSupabaseVolleyball hook state:', {
    currentGameDayId: currentGameDay?.id,
    currentGameDayTitle: currentGameDay?.title || currentGameDay?.date,
    gameTypeFilter,
    gameDaysCount: gameDays.length,
    playersCount: players.length,
    servesCount: serves.length,
    timestamp: new Date().toISOString()
  });

  // Helper function to check if a serve matches current filter context
  const serveMatchesCurrentFilter = (serve: Serve): boolean => {
    if (currentGameDay) {
      return serve.gameId === currentGameDay.id;
    }
    if (gameTypeFilter) {
      return gameDays.some(gd => gd.id === serve.gameId && gd.gameType === gameTypeFilter);
    }
    return false;
  };

  // Load players from database with their serves
  const loadPlayers = async () => {
    if (!currentTeamId) return;
    
    setLoading(true);
    try {
      console.log('📥 LOADING DEBUG - Starting to load players for team:', currentTeamId);
      
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
            playerId: serve.player_id,
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

      console.log('✅ LOADING DEBUG - Players loaded successfully:', formattedPlayers.length, 'players');
      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('❌ LOADING DEBUG - Error loading players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  // Load game days from database
  const loadGameDays = async () => {
    if (!currentTeamId) return;
    
    try {
      console.log('📥 LOADING DEBUG - Starting to load game days for team:', currentTeamId);
      
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

      console.log('✅ LOADING DEBUG - Game days loaded successfully:', formattedGameDays.length, 'game days');
      setGameDays(formattedGameDays);
      
      // Auto-select most recent game day only on initial load AND if no current selection
      if (formattedGameDays.length > 0 && !currentGameDay && !hasAutoSelected && !gameTypeFilter) {
        console.log('🎯 AUTO-SELECT DEBUG - Auto-selecting most recent game day:', formattedGameDays[0].title || formattedGameDays[0].date);
        setCurrentGameDay(formattedGameDays[0]);
        setHasAutoSelected(true);
      }
    } catch (error) {
      console.error('❌ LOADING DEBUG - Error loading game days:', error);
      toast.error('Failed to load game days');
    }
  };

  // Load serves based on current game day or game type filter
  const loadServes = async (gameId?: string) => {
    if (!currentTeamId) return;
    
    try {
      let query = supabase
        .from('serves')
        .select('*')
        .eq('team_id', currentTeamId)
        .order('timestamp', { ascending: false });

      // Apply filtering based on context
      if (gameId) {
        console.log('📊 SERVES LOADING DEBUG - Loading serves for specific game:', gameId);
        query = query.eq('game_id', gameId);
      } else if (currentGameDay) {
        console.log('📊 SERVES LOADING DEBUG - Loading serves for current game day:', currentGameDay.id, currentGameDay.title || currentGameDay.date);
        query = query.eq('game_id', currentGameDay.id);
      } else if (gameTypeFilter) {
        console.log('📊 SERVES LOADING DEBUG - Loading serves for game type filter:', gameTypeFilter);
        // Get all games of this type
        const gamesOfType = gameDays.filter(gd => gd.gameType === gameTypeFilter);
        const gameIds = gamesOfType.map(gd => gd.id);
        if (gameIds.length > 0) {
          query = query.in('game_id', gameIds);
        } else {
          // No games of this type exist, return empty
          console.log('⚠️ SERVES LOADING DEBUG - No games found for type filter, clearing serves state');
          setServes([]);
          return;
        }
      } else {
        // No filter - clear serves for performance and to use database totals
        console.log('🧹 SERVES LOADING DEBUG - No filter active, clearing serves state');
        setServes([]);
        return;
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const formattedServes: Serve[] = (data || []).map(serve => ({
        id: serve.id,
        playerId: serve.player_id,
        gameId: serve.game_id,
        type: serve.type as 'ace' | 'fail',
        quality: serve.quality as ServeQuality,
        timestamp: serve.timestamp || new Date().toISOString()
      }));

      console.log('✅ SERVES LOADING DEBUG - Serves loaded successfully:', formattedServes.length, 'serves for filter context');
      setServes(formattedServes);
    } catch (error) {
      console.error('❌ SERVES LOADING DEBUG - Error loading serves:', error);
    }
  };

  // Add player with immediate state update
  const addPlayer = async (name: string, tags: string[] = []) => {
    if (!currentTeamId) return;
    
    try {
      console.log('➕ PLAYER ADD DEBUG - Starting to add player:', name, 'with tags:', tags);
      
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

      console.log('✅ PLAYER ADD DEBUG - Player added to database, updating local state immediately');
      
      // Immediately add to local state for instant UI feedback
      setPlayers(prev => {
        const updated = [...prev, newPlayer];
        console.log('🔄 PLAYER ADD DEBUG - Local players state updated, new count:', updated.length);
        return updated;
      });
      
      toast.success(`Player ${name} added successfully`);
    } catch (error) {
      console.error('❌ PLAYER ADD DEBUG - Error adding player:', error);
      toast.error('Failed to add player');
    }
  };

  // Remove player with immediate state update
  const removePlayer = async (id: string) => {
    try {
      console.log('➖ PLAYER REMOVE DEBUG - Starting to remove player:', id);
      
      // Find player name for toast message
      const playerToRemove = players.find(p => p.id === id);
      const playerName = playerToRemove?.name || 'Unknown';
      
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ PLAYER REMOVE DEBUG - Player removed from database, updating local state immediately');
      
      // Immediately remove from local state for instant UI feedback
      setPlayers(prev => {
        const updated = prev.filter(p => p.id !== id);
        console.log('🔄 PLAYER REMOVE DEBUG - Local players state updated, new count:', updated.length);
        return updated;
      });
      
      toast.success(`Player ${playerName} removed successfully`);
    } catch (error) {
      console.error('❌ PLAYER REMOVE DEBUG - Error removing player:', error);
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

      // Immediately update local state
      setPlayers(prev => prev.map(player => 
        player.id === playerId ? { ...player, name: newName } : player
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

      // Immediately update local state
      setPlayers(prev => prev.map(player => 
        player.id === playerId ? { ...player, tags } : player
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

  // Add game day with immediate state update and auto-selection
  const addGameDay = async (date: string, gameType: GameType | string, title?: string, notes?: string) => {
    if (!currentTeamId) return;
    
    try {
      console.log('➕ GAME DAY ADD DEBUG - Starting to add game day:', { date, gameType, title });
      
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

      console.log('✅ GAME DAY ADD DEBUG - Game day added to database, updating local state immediately');
      
      // Immediately add to local state (add to beginning since we order by date desc)
      setGameDays(prev => {
        const updated = [newGameDay, ...prev];
        console.log('🔄 GAME DAY ADD DEBUG - Local game days state updated, new count:', updated.length);
        return updated;
      });
      
      // Auto-select the newly created game day
      console.log('🎯 GAME DAY ADD DEBUG - Auto-selecting newly created game day');
      setCurrentGameDay(newGameDay);
      setGameTypeFilter(null); // Clear any game type filter
      
      toast.success('Game day added successfully');
    } catch (error) {
      console.error('❌ GAME DAY ADD DEBUG - Error adding game day:', error);
      toast.error('Failed to add game day');
    }
  };

  // Record serve (alias for addServe)
  const addServe = async (playerId: string, type: "fail" | "ace", quality: ServeQuality): Promise<boolean> => {
    if (!currentGameDay) {
      toast.error('Please select a game day first');
      return false;
    }
    
    try {
      console.log('🎯 SERVE RECORDING DEBUG - Starting serve recording:', { 
        playerId, 
        type, 
        quality, 
        targetGameId: currentGameDay.id, 
        targetGameTitle: currentGameDay.title || currentGameDay.date,
        timestamp: new Date().toISOString()
      });
      
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
        playerId: data.player_id,
        gameId: data.game_id,
        type: data.type as "fail" | "ace",
        quality: data.quality as "good" | "neutral" | "bad",
        timestamp: data.timestamp || new Date().toISOString()
      };

      console.log('✅ SERVE RECORDING DEBUG - Serve recorded successfully:', {
        serveId: newServe.id,
        recordedForGameId: newServe.gameId,
        expectedGameId: currentGameDay.id,
        gameMatch: newServe.gameId === currentGameDay.id,
        timestamp: new Date().toISOString()
      });
      
      // Immediately update local player stats for instant UI feedback
      setPlayers(prev => prev.map(player => {
        if (player.id === playerId) {
          const updatedPlayer = {
            ...player,
            totalAces: type === 'ace' ? player.totalAces + 1 : player.totalAces,
            totalFails: type === 'fail' ? player.totalFails + 1 : player.totalFails,
            serves: [...player.serves, newServe]
          };
          console.log('🔄 SERVE RECORDING DEBUG - Updated player stats locally:', {
            playerName: player.name,
            newTotalAces: updatedPlayer.totalAces,
            newTotalFails: updatedPlayer.totalFails,
            timestamp: new Date().toISOString()
          });
          return updatedPlayer;
        }
        return player;
      }));

      // Only add to serves state if it matches current filter
      if (serveMatchesCurrentFilter(newServe)) {
        console.log('✅ SERVE RECORDING DEBUG - Adding serve to filtered state (matches current filter)');
        setServes(prev => [...prev, newServe]);
      } else {
        console.log('⚠️ SERVE RECORDING DEBUG - Serve not added to filtered state - does not match current filter');
      }
      
      toast.success(`${type === 'ace' ? 'Ace' : 'Error'} recorded for ${currentGameDay.title || currentGameDay.date}`);
      return true;
    } catch (error) {
      console.error('❌ SERVE RECORDING DEBUG - Error recording serve:', error);
      toast.error('Failed to record serve');
      return false;
    }
  };

  // Load data when team changes
  useEffect(() => {
    if (currentTeamId) {
      console.log('🔄 TEAM CHANGE DEBUG - Loading data for team:', currentTeamId);
      loadPlayers();
      loadGameDays();
      loadCustomGameTypes();
      setHasAutoSelected(false);
    } else {
      console.log('🧹 TEAM CHANGE DEBUG - Clearing data (no team selected)');
      setPlayers([]);
      setGameDays([]);
      setCurrentGameDay(null);
      setServes([]);
      setCustomGameTypes({});
      setHasAutoSelected(false);
    }
  }, [currentTeamId]);

  // Load serves when game day or game type filter changes - FIXED DEPENDENCIES
  useEffect(() => {
    console.log('🔄 FILTER CHANGE DEBUG - Filter changed, reloading serves:', { 
      currentGameDayId: currentGameDay?.id, 
      currentGameDayTitle: currentGameDay?.title || currentGameDay?.date,
      gameTypeFilter,
      gameDaysCount: gameDays.length,
      timestamp: new Date().toISOString()
    });
    
    if (currentTeamId) {
      loadServes();
    }
  }, [currentGameDay?.id, gameTypeFilter, gameDays.length, currentTeamId]); // Using currentGameDay?.id for proper dependency

  // Set up real-time subscriptions with enhanced debugging and duplicate prevention
  useEffect(() => {
    if (!currentTeamId) return;

    console.log('🔄 REALTIME DEBUG - Setting up real-time subscriptions for team:', currentTeamId);

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('📡 REALTIME DEBUG - Player INSERT event received:', payload.new.name);
          
          const newPlayer: Player = {
            id: payload.new.id,
            name: payload.new.name,
            totalFails: payload.new.total_fails || 0,
            totalAces: payload.new.total_aces || 0,
            serves: [],
            tags: Array.isArray(payload.new.tags) 
              ? payload.new.tags as string[]
              : (typeof payload.new.tags === 'string' 
                  ? JSON.parse(payload.new.tags) 
                  : []) as string[]
          };
          
          // Check if player already exists to prevent duplicates from immediate updates
          setPlayers(prev => {
            const exists = prev.some(p => p.id === newPlayer.id);
            if (exists) {
              console.log('⚠️ REALTIME DEBUG - Player already exists in state (from immediate update), skipping');
              return prev;
            }
            console.log('✅ REALTIME DEBUG - Adding new player via real-time sync:', newPlayer.name);
            return [...prev, newPlayer];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('📡 REALTIME DEBUG - Player UPDATE event received:', payload.new.name);
          setPlayers(prev => prev.map(player => 
            player.id === payload.new.id 
              ? {
                  ...player,
                  name: payload.new.name,
                  totalFails: payload.new.total_fails || 0,
                  totalAces: payload.new.total_aces || 0,
                  tags: Array.isArray(payload.new.tags) 
                    ? payload.new.tags as string[]
                    : (typeof payload.new.tags === 'string' 
                        ? JSON.parse(payload.new.tags) 
                        : []) as string[]
                }
              : player
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('📡 REALTIME DEBUG - Player DELETE event received:', payload.old.id);
          
          // Check if player still exists to prevent double removal from immediate updates
          setPlayers(prev => {
            const exists = prev.some(p => p.id === payload.old.id);
            if (!exists) {
              console.log('⚠️ REALTIME DEBUG - Player already removed from state (from immediate update), skipping');
              return prev;
            }
            console.log('✅ REALTIME DEBUG - Removing player via real-time sync');
            return prev.filter(p => p.id !== payload.old.id);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_days',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('📡 REALTIME DEBUG - Game day INSERT event received:', payload.new.title || payload.new.date);
          
          const newGameDay: GameDay = {
            id: payload.new.id,
            date: payload.new.date,
            gameType: payload.new.game_type,
            title: payload.new.title || undefined,
            notes: payload.new.notes || undefined
          };
          
          // Check if game day already exists to prevent duplicates from immediate updates
          setGameDays(prev => {
            const exists = prev.some(gd => gd.id === newGameDay.id);
            if (exists) {
              console.log('⚠️ REALTIME DEBUG - Game day already exists in state (from immediate update), skipping');
              return prev;
            }
            console.log('✅ REALTIME DEBUG - Adding new game day via real-time sync:', newGameDay.title || newGameDay.date);
            return [newGameDay, ...prev];
          });
          
          // Only auto-select if not already set by immediate update
          if (!currentGameDay || currentGameDay.id !== newGameDay.id) {
            console.log('🎯 REALTIME DEBUG - Auto-selecting newly created game day via real-time sync');
            setCurrentGameDay(newGameDay);
            setGameTypeFilter(null);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_days',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('📡 REALTIME DEBUG - Game day UPDATE event received:', payload.new.title || payload.new.date);
          setGameDays(prev => prev.map(gameDay => 
            gameDay.id === payload.new.id 
              ? {
                  ...gameDay,
                  date: payload.new.date,
                  gameType: payload.new.game_type,
                  title: payload.new.title || undefined,
                  notes: payload.new.notes || undefined
                }
              : gameDay
          ));
          
          // Update current game day if it's the one being updated
          if (currentGameDay?.id === payload.new.id) {
            console.log('🎯 REALTIME DEBUG - Updating current game day via real-time sync');
            setCurrentGameDay({
              id: payload.new.id,
              date: payload.new.date,
              gameType: payload.new.game_type,
              title: payload.new.title || undefined,
              notes: payload.new.notes || undefined
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'game_days',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('📡 REALTIME DEBUG - Game day DELETE event received:', payload.old.id);
          setGameDays(prev => prev.filter(gd => gd.id !== payload.old.id));
          // Clear current game day if it was deleted
          if (currentGameDay?.id === payload.old.id) {
            console.log('🎯 REALTIME DEBUG - Clearing current game day (deleted)');
            setCurrentGameDay(null);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'serves',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('🏐 SERVE REALTIME DEBUG - Serve INSERT event (syncing):', payload.new);
          const newServe: Serve = {
            id: payload.new.id,
            playerId: payload.new.player_id,
            gameId: payload.new.game_id,
            type: payload.new.type as "fail" | "ace",
            quality: payload.new.quality as "good" | "neutral" | "bad",
            timestamp: payload.new.timestamp || new Date().toISOString()
          };
          
          // Check if this serve is already in our local state (to avoid duplicates from immediate updates)
          setServes(prev => {
            const exists = prev.some(s => s.id === newServe.id);
            if (exists) {
              console.log('🏐 SERVE REALTIME DEBUG - Serve already exists in state (from immediate update)');
              return prev;
            }
            
            // Only add to serves state if it matches current filter context
            if (serveMatchesCurrentFilter(newServe)) {
              console.log('🏐 SERVE REALTIME DEBUG - Adding new serve to filtered serves state via real-time sync');
              return [...prev, newServe];
            } else {
              console.log('🏐 SERVE REALTIME DEBUG - Serve not added - does not match current filter');
              return prev;
            }
          });
          
          // Update player's serves array (avoid duplicates)
          setPlayers(prev => prev.map(player => {
            if (player.id === payload.new.player_id) {
              const serveExists = player.serves.some(s => s.id === newServe.id);
              if (!serveExists) {
                console.log('🏐 SERVE REALTIME DEBUG - Adding serve to player serves array via real-time sync');
                return { ...player, serves: [...player.serves, newServe] };
              }
            }
            return player;
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'serves',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('🏐 SERVE REALTIME DEBUG - Serve DELETE event (syncing):', payload.old);
          
          // Remove from serves list (check if it exists to avoid double removal)
          setServes(prev => prev.filter(s => s.id !== payload.old.id));
          
          // Remove from player's serves array (check if it exists to avoid double removal)
          setPlayers(prev => prev.map(player => 
            player.id === payload.old.player_id
              ? { ...player, serves: player.serves.filter(s => s.id !== payload.old.id) }
              : player
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'custom_game_types',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          setCustomGameTypes(prev => ({ 
            ...prev, 
            [payload.new.abbreviation]: payload.new.name 
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'custom_game_types',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          setCustomGameTypes(prev => ({ 
            ...prev, 
            [payload.new.abbreviation]: payload.new.name 
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'custom_game_types',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          setCustomGameTypes(prev => {
            const newTypes = { ...prev };
            delete newTypes[payload.old.abbreviation];
            return newTypes;
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 REALTIME DEBUG - Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [currentTeamId, currentGameDay?.id, gameTypeFilter, gameDays]); // Added dependencies to ensure proper cleanup and setup

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

      // Game type will be added via real-time subscription
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

      // Game type will be updated via real-time subscription
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

      // Game type will be removed via real-time subscription
      toast.success('Game type removed successfully');
    } catch (error) {
      console.error('Error removing game type:', error);
      toast.error('Failed to remove game type');
    }
  };

  // Get all game types (default + custom) - STABLE FUNCTION TO PREVENT RE-RENDERS
  const getAllGameTypes = React.useCallback((): Record<string, string> => {
    const result = { ...defaultGameTypes, ...customGameTypes };
    console.log('getAllGameTypes computed:', Object.keys(result).length, 'types');
    return result;
  }, [customGameTypes]);

  // Get player stats - simplified and consistent logic
  const getPlayerStats = (playerId: string, gameId?: string, gameType?: GameType | string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { errors: 0, aces: 0 };

    console.log('📊 STATS DEBUG - getPlayerStats called:', { 
      playerId, 
      gameId, 
      gameType, 
      playerName: player.name,
      currentGameDay: currentGameDay?.id,
      gameTypeFilter,
      servesStateCount: serves.length,
      timestamp: new Date().toISOString()
    });

    // If no specific context is provided AND no current filter is active, use database totals
    if (!gameId && !gameType && !currentGameDay && !gameTypeFilter) {
      console.log('📊 STATS DEBUG - Using database totals (no filter active)');
      return {
        aces: player.totalAces,
        errors: player.totalFails
      };
    }

    // For any filtered context, use the filtered serves state
    console.log('📊 STATS DEBUG - Using filtered serves state');
    const relevantServes = serves.filter(s => s.playerId === playerId);

    const aces = relevantServes.filter(s => s.type === 'ace').length;
    const errors = relevantServes.filter(s => s.type === 'fail').length;
    
    console.log('📊 STATS DEBUG - Player stats calculated:', { 
      playerName: player.name,
      relevantServesCount: relevantServes.length, 
      aces, 
      errors,
      timestamp: new Date().toISOString()
    });
    return { aces, errors };
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

  // Get filtered players - now returns ALL players, filtering happens in stats
  const getFilteredPlayers = (): Player[] => {
    return players; // Always return all players
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
      console.log('Removing serve:', { playerId, serveId });
      
      // Find the serve to get its type for immediate local update
      const serveToRemove = serves.find(s => s.id === serveId);
      if (!serveToRemove) {
        console.error('Serve not found in local state');
        return;
      }

      const { error } = await supabase
        .from('serves')
        .delete()
        .eq('id', serveId);

      if (error) throw error;

      console.log('Serve removed successfully, updating local player stats immediately');
      
      // Immediately update local player stats for instant UI feedback
      setPlayers(prev => prev.map(player => {
        if (player.id === playerId) {
          const updatedPlayer = {
            ...player,
            totalAces: serveToRemove.type === 'ace' ? Math.max(0, player.totalAces - 1) : player.totalAces,
            totalFails: serveToRemove.type === 'fail' ? Math.max(0, player.totalFails - 1) : player.totalFails,
            serves: player.serves.filter(s => s.id !== serveId)
          };
          console.log('Updated player totals locally after removal:', {
            name: player.name,
            newTotalAces: updatedPlayer.totalAces,
            newTotalFails: updatedPlayer.totalFails
          });
          return updatedPlayer;
        }
        return player;
      }));

      // Also immediately remove from serves state
      setServes(prev => prev.filter(s => s.id !== serveId));
      
      toast.success('Serve removed');
    } catch (error) {
      console.error('Error removing serve:', error);
      toast.error('Failed to remove serve');
    }
  };

  // Set current game day - Enhanced with comprehensive debugging
  const setCurrentGameDayById = (gameDay: GameDay | null) => {
    console.log('🎯 SELECTION DEBUG - setCurrentGameDayById called with:', {
      gameDayId: gameDay?.id || 'null', 
      gameDayTitle: gameDay?.title || gameDay?.date || 'null',
      timestamp: new Date().toISOString()
    });
    
    if (!gameDay) {
      console.log('🎯 SELECTION DEBUG - Clearing current game day selection');
      setCurrentGameDay(null);
      return;
    }
    
    console.log('🎯 SELECTION DEBUG - Setting current game day to:', {
      title: gameDay.title || gameDay.date,
      id: gameDay.id,
      gameType: gameDay.gameType
    });
    
    // Clear game type filter when selecting specific game
    if (gameTypeFilter) {
      console.log('🎯 SELECTION DEBUG - Clearing game type filter because specific game was selected');
      setGameTypeFilter(null);
    }
    
    setCurrentGameDay(gameDay);
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
