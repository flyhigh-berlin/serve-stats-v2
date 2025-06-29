
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gamepad2, Plus, Trash2, Edit, Calendar } from "lucide-react";
import { toast } from "sonner";

interface TeamGameTypesTabProps {
  teamId: string;
}

export function TeamGameTypesTab({ teamId }: TeamGameTypesTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeAbbreviation, setNewTypeAbbreviation] = useState("");
  
  const queryClient = useQueryClient();

  const { data: gameTypes, isLoading } = useQuery({
    queryKey: ['custom-game-types', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_game_types')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: gameTypesUsage } = useQuery({
    queryKey: ['game-types-usage', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_days')
        .select('game_type')
        .eq('team_id', teamId);
      if (error) throw error;
      
      const usage: Record<string, number> = {};
      data.forEach(game => {
        usage[game.game_type] = (usage[game.game_type] || 0) + 1;
      });
      return usage;
    }
  });

  const createGameTypeMutation = useMutation({
    mutationFn: async ({ name, abbreviation }: { name: string, abbreviation: string }) => {
      const { data, error } = await supabase
        .from('custom_game_types')
        .insert({
          team_id: teamId,
          name: name.trim(),
          abbreviation: abbreviation.trim().toUpperCase()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-game-types', teamId] });
      setIsCreateOpen(false);
      setNewTypeName("");
      setNewTypeAbbreviation("");
      toast.success('Game type created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create game type: ' + error.message);
    }
  });

  const updateGameTypeMutation = useMutation({
    mutationFn: async ({ id, name, abbreviation }: { id: string, name: string, abbreviation: string }) => {
      const { data, error } = await supabase
        .from('custom_game_types')
        .update({
          name: name.trim(),
          abbreviation: abbreviation.trim().toUpperCase()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-game-types', teamId] });
      setEditingType(null);
      toast.success('Game type updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update game type: ' + error.message);
    }
  });

  const deleteGameTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_game_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-game-types', teamId] });
      toast.success('Game type deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete game type: ' + error.message);
    }
  });

  const handleCreate = () => {
    if (!newTypeName.trim() || !newTypeAbbreviation.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    createGameTypeMutation.mutate({
      name: newTypeName,
      abbreviation: newTypeAbbreviation
    });
  };

  const handleUpdate = () => {
    if (!editingType || !editingType.name.trim() || !editingType.abbreviation.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    updateGameTypeMutation.mutate({
      id: editingType.id,
      name: editingType.name,
      abbreviation: editingType.abbreviation
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading game types...</div>;
  }

  const defaultGameTypes = [
    { name: 'Training', abbreviation: 'TRN', isDefault: true },
    { name: 'Friendly Match', abbreviation: 'FRI', isDefault: true },
    { name: 'Tournament', abbreviation: 'TOU', isDefault: true }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Game Types</h3>
          <p className="text-sm text-muted-foreground">
            Manage custom game types for your team
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Game Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Game Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Game Type Name</Label>
                <Input
                  id="name"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g., Championship Match"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="abbreviation">Abbreviation</Label>
                <Input
                  id="abbreviation"
                  value={newTypeAbbreviation}
                  onChange={(e) => setNewTypeAbbreviation(e.target.value.toUpperCase())}
                  placeholder="e.g., CHA"
                  maxLength={10}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  Create
                </Button>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {defaultGameTypes.map((type) => (
              <div
                key={type.abbreviation}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{type.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {type.abbreviation}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {gameTypesUsage?.[type.abbreviation] || 0} games
                  </Badge>
                  <Badge variant="outline">Default</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Game Types */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Game Types ({gameTypes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {gameTypes && gameTypes.length > 0 ? (
            <div className="space-y-3">
              {gameTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{type.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {type.abbreviation}
                      </p>
                      <Badge variant="secondary">
                        {gameTypesUsage?.[type.abbreviation] || 0} games
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog 
                      open={editingType?.id === type.id} 
                      onOpenChange={(open) => setEditingType(open ? type : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Game Type</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">Game Type Name</Label>
                            <Input
                              id="edit-name"
                              value={editingType?.name || ""}
                              onChange={(e) => setEditingType(prev => prev ? {...prev, name: e.target.value} : null)}
                              maxLength={50}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-abbreviation">Abbreviation</Label>
                            <Input
                              id="edit-abbreviation"
                              value={editingType?.abbreviation || ""}
                              onChange={(e) => setEditingType(prev => prev ? {...prev, abbreviation: e.target.value.toUpperCase()} : null)}
                              maxLength={10}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingType(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdate}>
                              Update
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Game Type</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{type.name}"? 
                            This action cannot be undone. Games that use this type will still retain their data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteGameTypeMutation.mutate(type.id)}
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
              <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No custom game types yet</p>
              <p className="text-sm text-muted-foreground">
                Create custom game types to better organize your team's activities
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
