
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Gamepad2, Settings, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TeamGameTypesTabProps {
  teamId: string;
}

interface CustomGameType {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string;
}

interface GameTypeWithCount {
  name: string;
  abbreviation: string;
  isCustom: boolean;
  id?: string;
  gameCount: number;
}

const DEFAULT_GAME_TYPES = [
  { name: "Training", abbreviation: "TR" },
  { name: "Match", abbreviation: "M" },
  { name: "Tournament", abbreviation: "T" },
  { name: "Friendly", abbreviation: "F" }
];

export function TeamGameTypesTab({ teamId }: TeamGameTypesTabProps) {
  const [newGameType, setNewGameType] = useState({ name: '', abbreviation: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: customGameTypes, isLoading: customLoading } = useQuery({
    queryKey: ['custom-game-types', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_game_types')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CustomGameType[];
    }
  });

  const { data: gameCounts, isLoading: countsLoading } = useQuery({
    queryKey: ['game-type-counts', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_days')
        .select('game_type')
        .eq('team_id', teamId);
      
      if (error) throw error;
      
      // Count games by type
      const counts: Record<string, number> = {};
      data?.forEach(game => {
        counts[game.game_type] = (counts[game.game_type] || 0) + 1;
      });
      
      return counts;
    }
  });

  const createGameTypeMutation = useMutation({
    mutationFn: async (gameType: { name: string; abbreviation: string }) => {
      const { data, error } = await supabase
        .from('custom_game_types')
        .insert({
          team_id: teamId,
          name: gameType.name,
          abbreviation: gameType.abbreviation
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-game-types', teamId] });
      toast.success('Game type created successfully');
      setNewGameType({ name: '', abbreviation: '' });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error creating game type:', error);
      toast.error('Failed to create game type');
    }
  });

  const deleteGameTypeMutation = useMutation({
    mutationFn: async (gameTypeId: string) => {
      const { error } = await supabase
        .from('custom_game_types')
        .delete()
        .eq('id', gameTypeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-game-types', teamId] });
      toast.success('Game type deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting game type:', error);
      toast.error('Failed to delete game type');
    }
  });

  const handleCreateGameType = () => {
    if (newGameType.name.trim() && newGameType.abbreviation.trim()) {
      createGameTypeMutation.mutate({
        name: newGameType.name.trim(),
        abbreviation: newGameType.abbreviation.trim().toUpperCase()
      });
    } else {
      toast.error('Please fill in all fields');
    }
  };

  const isLoading = customLoading || countsLoading;

  // Combine default and custom game types with counts
  const allGameTypes: GameTypeWithCount[] = [
    ...DEFAULT_GAME_TYPES.map(type => ({
      ...type,
      isCustom: false,
      gameCount: gameCounts?.[type.abbreviation] || 0
    })),
    ...(customGameTypes?.map(type => ({
      ...type,
      isCustom: true,
      gameCount: gameCounts?.[type.abbreviation] || 0
    })) || [])
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Game Types</h3>
          <p className="text-sm text-muted-foreground">
            Manage default and custom game types for your team
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Game Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Game Type</DialogTitle>
              <DialogDescription>
                Add a new game type for your team's specific needs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Championship"
                  value={newGameType.name}
                  onChange={(e) => setNewGameType(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="abbreviation">Abbreviation</Label>
                <Input
                  id="abbreviation"
                  placeholder="e.g., CH"
                  value={newGameType.abbreviation}
                  onChange={(e) => setNewGameType(prev => ({ ...prev, abbreviation: e.target.value.toUpperCase() }))}
                  maxLength={3}
                />
              </div>
              <Button 
                onClick={handleCreateGameType} 
                disabled={createGameTypeMutation.isPending}
                className="w-full"
              >
                {createGameTypeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Game Type
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default Game Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Default Game Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allGameTypes.filter(type => !type.isCustom).map(type => (
              <div key={type.abbreviation} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{type.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Abbreviation: {type.abbreviation}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {type.gameCount} games
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Game Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Game Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allGameTypes.filter(type => type.isCustom).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allGameTypes.filter(type => type.isCustom).map(type => (
                <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{type.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Abbreviation: {type.abbreviation}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {type.gameCount} games
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Game Type</AlertDialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete "{type.name}"? This action cannot be undone.
                          </DialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteGameTypeMutation.mutate(type.id!)}
                            className="bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No custom game types created yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create custom game types to better organize your team's activities
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
