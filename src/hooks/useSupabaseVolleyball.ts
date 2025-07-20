
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "../context/TeamContext";
import { Player, GameDay, Serve, GameType, ServeQuality, SortField, SortDirection, gameTypes as defaultGameTypes } from "../types";
import { toast } from "sonner";
import React from "react";

// Loading states for CRUD operations
interface LoadingStates {
  addingPlayer: boolean;
  removingPlayer: string | null;
  addingGameDay: boolean;
  recordingServe: string | null;
  removingServe: string | null;
}

// Real-time event tracking for debugging
interface RealTimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'players' | 'game_days' | 'serves';
  timestamp: string;
  entityName: string;
  entityId: string;
}

// Connection health monitoring
type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

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
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    addingPlayer: false,
    removingPlayer: null,
    addingGameDay: false,
    recordingServe: null,
    removingServe: null
  });

  // Real-time monitoring - simplified
  const [lastRealTimeEvent, setLastRealTimeEvent] = useState<RealTimeEvent | null>(null);
  const [realtimeConnectionStatus, setRealtimeConnectionStatus] = useState<ConnectionStatus>('connecting');

  const currentTeamId = currentTeam?.id;

  console.log('🏐 HOOK STATE:', {
    currentGameDayId: currentGameDay?.id,
    gameTypeFilter,
    playersCount: players.length,
    gameDaysCount: gameDays.length,
    servesCount: serves.length,
    connectionStatus: realtimeConnectionStatus
  });

  // Helper function to check if a serve matches current filter context
  const serveMatchesCurrentFilter = (serve: Serve): boolean => {
    if (currentGameDay) {
      return serve.gameId === currentGameDay.id;
    }
    if (gameTypeFilter) {
      // Check if any game day of the filter type contains this serve
      return gameDays.some(gd => gd.id === serve.gameId && gd.gameType === gameTypeFilter);
    }
    return false;
  };

  // Load players from database with their serves
  const loadPlayers = async () => {
    if (!currentTeamId) return;
    
    setLoading(true);
    try {
      console.log('📥 Loading players for team:', currentTeamId);
      
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', currentTeamId);

      if (playersError) throw playersError;

      const { data: servesData, error: servesError } = await supabase
        .from('serves')
        .select('*')
        .eq('team_id', currentTeamId);

      if (servesError) throw servesError;

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

      console.log('✅ Players loaded successfully:', formattedPlayers.length);
      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('❌ Error loading players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  // Load game days from database
  const loadGameDays = async () => {
    if (!currentTeamId) return;
    
    try {
      console.log('📥 Loading game days for team:', currentTeamId);
      
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

      console.log('✅ Game days loaded successfully:', formattedGameDays.length);
      setGameDays(formattedGameDays);
      
      if (formattedGameDays.length > 0 && !currentGameDay && !hasAutoSelected && !gameTypeFilter) {
        console.log('🎯 Auto-selecting most recent game day:', formattedGameDays[0].title || formattedGameDays[0].date);
        setCurrentGameDay(formattedGameDays[0]);
        setHasAutoSelected(true);
      }
    } catch (error) {
      console.error('❌ Error loading game days:', error);
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

      if (gameId) {
        console.log('📊 Loading serves for specific game:', gameId);
        query = query.eq('game_id', gameId);
      } else if (currentGameDay) {
        console.log('📊 Loading serves for current game day:', currentGameDay.id);
        query = query.eq('game_id', currentGameDay.id);
      } else if (gameTypeFilter) {
        console.log('📊 Loading serves for game type filter:', gameTypeFilter);
        const gamesOfType = gameDays.filter(gd => gd.gameType === gameTypeFilter);
        const gameIds = gamesOfType.map(gd => gd.id);
        if (gameIds.length > 0) {
          query = query.in('game_id', gameIds);
        } else {
          console.log('⚠️ No games found for type filter, clearing serves');
          setServes([]);
          return;
        }
      } else {
        console.log('🧹 No filter active, clearing serves');
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

      console.log('✅ Serves loaded successfully:', formattedServes.length);
      setServes(formattedServes);
    } catch (error) {
      console.error('❌ Error loading serves:', error);
    }
  };

  // Add player - will be instantly visible via real-time
  const addPlayer = async (name: string, tags: string[] = []) => {
    if (!currentTeamId) return;
    
    setLoadingStates(prev => ({ ...prev, addingPlayer: true }));
    toast("Adding player...", { description: "Real-time update will follow" });
    
    try {
      console.log('➕ Adding player:', name, 'with tags:', tags);
      
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
      console.log('✅ Player added to database:', data);
      
    } catch (error) {
      console.error('❌ Error adding player:', error);
      toast.error('Failed to add player');
      setLoadingStates(prev => ({ ...prev, addingPlayer: false }));
    }
  };

  // Remove player
  const removePlayer = async (id: string) => {
    setLoadingStates(prev => ({ ...prev, removingPlayer: id }));
    
    const playerToRemove = players.find(p => p.id === id);
    const playerName = playerToRemove?.name || 'Unknown';
    
    toast("Removing player...", { description: `Removing ${playerName}` });
    
    try {
      console.log('➖ Removing player:', id);
      
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log('✅ Player removed from database');
    } catch (error) {
      console.error('❌ Error removing player:', error);
      toast.error('Failed to remove player');
      setLoadingStates(prev => ({ ...prev, removingPlayer: null }));
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
      console.log('✅ Player name updated');
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
      console.log('✅ Player tags updated');
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

  // Add game day - will be instantly visible via real-time
  const addGameDay = async (date: string, gameType: GameType | string, title?: string, notes?: string) => {
    if (!currentTeamId) return;
    
    setLoadingStates(prev => ({ ...prev, addingGameDay: true }));
    toast("Creating game day...", { description: "Real-time update will follow" });
    
    try {
      console.log('➕ Adding game day:', { date, gameType, title });
      
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
      console.log('✅ Game day added to database:', data);
      
    } catch (error) {
      console.error('❌ Error adding game day:', error);
      toast.error('Failed to add game day');
      setLoadingStates(prev => ({ ...prev, addingGameDay: false }));
    }
  };

  // Record serve
  const addServe = async (playerId: string, type: "fail" | "ace", quality: ServeQuality): Promise<boolean> => {
    if (!currentGameDay) {
      toast.error('Please select a game day first');
      return false;
    }
    
    setLoadingStates(prev => ({ ...prev, recordingServe: playerId }));
    
    const player = players.find(p => p.id === playerId);
    toast("Recording serve...", { 
      description: `Recording ${type} for ${player?.name || 'player'}` 
    });
    
    try {
      console.log('🎯 Recording serve:', { 
        playerId, 
        type, 
        quality, 
        targetGameId: currentGameDay.id
      });
      
      const { error } = await supabase
        .from('serves')
        .insert({
          player_id: playerId,
          game_id: currentGameDay.id,
          team_id: currentTeamId!,
          type,
          quality,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
      console.log('✅ Serve recorded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error recording serve:', error);
      toast.error('Failed to record serve');
      setLoadingStates(prev => ({ ...prev, recordingServe: null }));
      return false;
    }
  };

  // Load data when team changes
  useEffect(() => {
    if (currentTeamId) {
      console.log('🔄 Loading data for team:', currentTeamId);
      loadPlayers();
      loadGameDays();
      loadCustomGameTypes();
      setHasAutoSelected(false);
    } else {
      console.log('🧹 Clearing data (no team selected)');
      setPlayers([]);
      setGameDays([]);
      setCurrentGameDay(null);
      setServes([]);
      setCustomGameTypes({});
      setHasAutoSelected(false);
    }
  }, [currentTeamId]);

  // Load serves when game day or game type filter changes
  useEffect(() => {
    console.log('🔄 Filter changed, reloading serves:', { 
      currentGameDayId: currentGameDay?.id, 
      gameTypeFilter
    });
    
    if (currentTeamId) {
      loadServes();
    }
  }, [currentGameDay?.id, gameTypeFilter, currentTeamId]);

  // FIXED REAL-TIME SUBSCRIPTIONS - NO STALE CLOSURES
  useEffect(() => {
    if (!currentTeamId) return;

    console.log('📡 Setting up real-time subscriptions for team:', currentTeamId);
    setRealtimeConnectionStatus('connecting');

    const channel = supabase
      .channel(`team-${currentTeamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          console.log('📡 REALTIME - Player event:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newPlayer: Player = {
              id: payload.new.id,
              name: payload.new.name,
              totalFails: payload.new.total_fails || 0,
              totalAces: payload.new.total_aces || 0,
              serves: [],
              tags: Array.isArray(payload.new.tags) 
                ? payload.new.tags as string[]
                : (typeof payload.new.tags === 'string' 
                    ? JSON.parse(payload.new.tags || '[]') 
                    : []) as string[]
            };
            
            // FIXED: Pure functional update with no dependencies
            setPlayers(currentPlayers => {
              if (currentPlayers.some(p => p.id === newPlayer.id)) {
                console.log('📡 Player already exists, skipping add');
                return currentPlayers;
              }
              console.log('📡 Adding new player to state:', newPlayer.name);
              return [...currentPlayers, newPlayer]; // New array reference
            });
            
            setLoadingStates(prev => ({ ...prev, addingPlayer: false }));
            setLastRealTimeEvent({
              type: 'INSERT',
              table: 'players',
              timestamp: new Date().toISOString(),
              entityName: newPlayer.name,
              entityId: newPlayer.id
            });
            
            toast.success(`Player ${newPlayer.name} added successfully`);
          }
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            // FIXED: Pure functional update
            setPlayers(currentPlayers => currentPlayers.map(player => 
              player.id === payload.new.id 
                ? {
                    ...player,
                    name: payload.new.name,
                    totalFails: payload.new.total_fails || 0,
                    totalAces: payload.new.total_aces || 0,
                    tags: Array.isArray(payload.new.tags) 
                      ? payload.new.tags as string[]
                      : (typeof payload.new.tags === 'string' 
                          ? JSON.parse(payload.new.tags || '[]') 
                          : []) as string[]
                  }
                : player
            ));
            
            setLastRealTimeEvent({
              type: 'UPDATE',
              table: 'players',
              timestamp: new Date().toISOString(),
              entityName: payload.new.name,
              entityId: payload.new.id
            });
            
            console.log('📡 Updated player:', payload.new.name);
          }
          
          if (payload.eventType === 'DELETE' && payload.old) {
            // FIXED: Pure functional update
            setPlayers(currentPlayers => {
              const updated = currentPlayers.filter(player => player.id !== payload.old.id);
              console.log('📡 Removed player from state:', payload.old.name);
              return updated; // New array reference
            });
            
            setLoadingStates(prev => ({ ...prev, removingPlayer: null }));
            setLastRealTimeEvent({
              type: 'DELETE',
              table: 'players',
              timestamp: new Date().toISOString(),
              entityName: payload.old.name,
              entityId: payload.old.id
            });
            
            toast.success(`Player ${payload.old.name} removed successfully`);
          }
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
          console.log('📡 REALTIME - Game day INSERT:', payload.new.title || payload.new.date);
          
          const newGameDay: GameDay = {
            id: payload.new.id,
            date: payload.new.date,
            gameType: payload.new.game_type,
            title: payload.new.title || undefined,
            notes: payload.new.notes || undefined
          };
          
          // FIXED: Pure functional update with new array reference
          setGameDays(currentGameDays => {
            const updated = [newGameDay, ...currentGameDays];
            console.log('📡 Updated game days state:', { previousCount: currentGameDays.length, newCount: updated.length });
            return updated;
          });
          
          setLoadingStates(prev => ({ ...prev, addingGameDay: false }));
          setLastRealTimeEvent({
            type: 'INSERT',
            table: 'game_days',
            timestamp: new Date().toISOString(),
            entityName: newGameDay.title || newGameDay.date,
            entityId: newGameDay.id
          });
          
          // Auto-select the newly created game day
          console.log('🎯 Auto-selecting newly created game day');
          setCurrentGameDay(newGameDay);
          setGameTypeFilter(null);
          
          toast.success('Game day added successfully');
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
          console.log('📡 REALTIME - Game day UPDATE:', payload.new.title || payload.new.date);
          
          // FIXED: Pure functional update
          setGameDays(currentGameDays => currentGameDays.map(gameDay => 
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
          setCurrentGameDay(currentGameDay => 
            currentGameDay?.id === payload.new.id 
              ? {
                  id: payload.new.id,
                  date: payload.new.date,
                  gameType: payload.new.game_type,
                  title: payload.new.title || undefined,
                  notes: payload.new.notes || undefined
                }
              : currentGameDay
          );
          
          setLastRealTimeEvent({
            type: 'UPDATE',
            table: 'game_days',
            timestamp: new Date().toISOString(),
            entityName: payload.new.title || payload.new.date,
            entityId: payload.new.id
          });
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
          console.log('📡 REALTIME - Game day DELETE:', payload.old.id);
          
          // FIXED: Pure functional update
          setGameDays(currentGameDays => currentGameDays.filter(gd => gd.id !== payload.old.id));
          
          // Clear current game day if it was deleted
          setCurrentGameDay(currentGameDay => 
            currentGameDay?.id === payload.old.id ? null : currentGameDay
          );
          
          setLastRealTimeEvent({
            type: 'DELETE',
            table: 'game_days',
            timestamp: new Date().toISOString(),
            entityName: payload.old.title || payload.old.date || 'Unknown',
            entityId: payload.old.id
          });
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
          console.log('🏐 REALTIME - Serve INSERT:', payload.new);
          const newServe: Serve = {
            id: payload.new.id,
            playerId: payload.new.player_id,
            gameId: payload.new.game_id,
            type: payload.new.type as "fail" | "ace",
            quality: payload.new.quality as "good" | "neutral" | "bad",
            timestamp: payload.new.timestamp || new Date().toISOString()
          };
          
          // FIXED: Update serves state with pure functional update
          setServes(currentServes => {
            // Check if serve matches current filter without accessing stale state
            const matchesFilter = currentGameDay?.id === newServe.gameId || 
                                  gameTypeFilter && gameDays.some(gd => gd.id === newServe.gameId && gd.gameType === gameTypeFilter);
            
            if (matchesFilter) {
              console.log('🏐 Adding new serve to filtered serves state');
              return [...currentServes, newServe]; // New array reference
            }
            return currentServes;
          });
          
          // FIXED: Update player's serves array with pure functional update
          setPlayers(currentPlayers => currentPlayers.map(player => {
            if (player.id === payload.new.player_id) {
              console.log('🏐 Adding serve to player serves array');
              return { 
                ...player, 
                serves: [...player.serves, newServe], // New array reference
                totalAces: payload.new.type === 'ace' ? player.totalAces + 1 : player.totalAces,
                totalFails: payload.new.type === 'fail' ? player.totalFails + 1 : player.totalFails
              };
            }
            return player;
          }));
          
          setLoadingStates(prev => ({ ...prev, recordingServe: null }));
          
          setLastRealTimeEvent({
            type: 'INSERT',
            table: 'serves',
            timestamp: new Date().toISOString(),
            entityName: `${payload.new.type} serve`,
            entityId: newServe.id
          });
          
          toast.success(`${payload.new.type === 'ace' ? 'Ace' : 'Error'} recorded successfully`);
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
          console.log('🏐 REALTIME - Serve DELETE:', payload.old);
          
          // FIXED: Pure functional updates
          setServes(currentServes => currentServes.filter(s => s.id !== payload.old.id));
          
          setPlayers(currentPlayers => currentPlayers.map(player => 
            player.id === payload.old.player_id
              ? { 
                  ...player, 
                  serves: player.serves.filter(s => s.id !== payload.old.id),
                  totalAces: payload.old.type === 'ace' ? Math.max(0, player.totalAces - 1) : player.totalAces,
                  totalFails: payload.old.type === 'fail' ? Math.max(0, player.totalFails - 1) : player.totalFails
                }
              : player
          ));
          
          setLoadingStates(prev => ({ ...prev, removingServe: null }));
          setLastRealTimeEvent({
            type: 'DELETE',
            table: 'serves',
            timestamp: new Date().toISOString(),
            entityName: `${payload.old.type} serve`,
            entityId: payload.old.id
          });
          
          toast.success('Serve removed');
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'custom_game_types',
          filter: `team_id=eq.${currentTeamId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setCustomGameTypes(prev => ({ 
              ...prev, 
              [payload.new.abbreviation]: payload.new.name 
            }));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setCustomGameTypes(prev => ({ 
              ...prev, 
              [payload.new.abbreviation]: payload.new.name 
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setCustomGameTypes(prev => {
              const newTypes = { ...prev };
              delete newTypes[payload.old.abbreviation];
              return newTypes;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 REALTIME CONNECTION STATUS:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeConnectionStatus('connected');
        } else if (status === 'CLOSED') {
          setRealtimeConnectionStatus('disconnected');
        }
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [currentTeamId]); // ONLY depend on currentTeamId - no other dependencies

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
      toast.success('Game type removed successfully');
    } catch (error) {
      console.error('Error removing game type:', error);
      toast.error('Failed to remove game type');
    }
  };

  // Get all game types (default + custom)
  const getAllGameTypes = React.useCallback((): Record<string, string> => {
    return { ...defaultGameTypes, ...customGameTypes };
  }, [customGameTypes]);

  // Get player stats
  const getPlayerStats = (playerId: string, gameId?: string, gameType?: GameType | string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { errors: 0, aces: 0 };

    console.log('📊 Getting player stats:', { 
      playerId, 
      gameId, 
      gameType, 
      playerName: player.name,
      servesStateCount: serves.length
    });

    if (!gameId && !gameType && !currentGameDay && !gameTypeFilter) {
      console.log('📊 Using database totals (no filter active)');
      return {
        aces: player.totalAces,
        errors: player.totalFails
      };
    }

    console.log('📊 Using filtered serves state');
    const relevantServes = serves.filter(s => s.playerId === playerId);

    const aces = relevantServes.filter(s => s.type === 'ace').length;
    const errors = relevantServes.filter(s => s.type === 'fail').length;
    
    console.log('📊 Player stats calculated:', { 
      playerName: player.name,
      relevantServesCount: relevantServes.length, 
      aces, 
      errors
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

  // Get filtered players
  const getFilteredPlayers = (): Player[] => {
    return players;
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
    setLoadingStates(prev => ({ ...prev, removingServe: serveId }));
    toast("Removing serve...", { description: "Real-time update will follow" });
    
    try {
      console.log('Removing serve:', { playerId, serveId });
      
      const { error } = await supabase
        .from('serves')
        .delete()
        .eq('id', serveId);

      if (error) throw error;
      console.log('Serve removed successfully');
    } catch (error) {
      console.error('Error removing serve:', error);
      toast.error('Failed to remove serve');
      setLoadingStates(prev => ({ ...prev, removingServe: null }));
    }
  };

  // Set current game day
  const setCurrentGameDayById = (gameDay: GameDay | null) => {
    console.log('🎯 Setting current game day:', {
      gameDayId: gameDay?.id || 'null', 
      gameDayTitle: gameDay?.title || gameDay?.date || 'null'
    });
    
    if (!gameDay) {
      setCurrentGameDay(null);
      return;
    }
    
    if (gameTypeFilter) {
      console.log('🎯 Clearing game type filter because specific game was selected');
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

  // Manual refresh - only as emergency fallback
  const refreshData = () => {
    console.log('🔄 MANUAL REFRESH - Emergency fallback triggered');
    loadPlayers();
    loadGameDays();
    loadCustomGameTypes();
    toast.success('Data refreshed manually');
  };

  return {
    // Data
    players,
    gameDays,
    currentGameDay,
    gameTypeFilter,
    serves,
    loading,
    loadingStates,
    gameTypes: defaultGameTypes,
    customGameTypes,
    
    // Real-time monitoring
    lastRealTimeEvent,
    realtimeConnectionStatus,

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

    // Emergency fallback only
    refreshData
  };
}
