
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TeamSettingsTabProps {
  teamId: string;
  teamName: string;
  teamDescription?: string;
  teamLogoUrl?: string;
}

interface UpdateTeamSettingsResponse {
  success: boolean;
  error?: string;
}

export function TeamSettingsTab({ teamId, teamName, teamDescription, teamLogoUrl }: TeamSettingsTabProps) {
  const [name, setName] = useState(teamName);
  const [description, setDescription] = useState(teamDescription || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(teamLogoUrl || null);
  const queryClient = useQueryClient();

  const updateTeamMutation = useMutation({
    mutationFn: async (updates: { name?: string; description?: string; logoUrl?: string }) => {
      console.log('Updating team settings:', updates);
      
      const { data, error } = await supabase.rpc('update_team_settings', {
        team_id_param: teamId,
        team_name: updates.name,
        team_description: updates.description,
        team_logo_url: updates.logoUrl
      });
      
      if (error) {
        console.error('Team update error:', error);
        throw error;
      }
      
      // Safely cast the response with proper type checking
      const response = data as unknown as UpdateTeamSettingsResponse;
      if (response && !response.success) {
        throw new Error(response.error || 'Failed to update team settings');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-info', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-analytics', teamId] });
      // Refresh team context - dispatch event to update all team references
      window.dispatchEvent(new CustomEvent('teamUpdated'));
      toast.success('Team settings updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating team settings:', error);
      const errorMessage = error?.message || 'Failed to update settings';
      
      if (errorMessage.includes('Access denied')) {
        toast.error('You do not have permission to update team settings');
      } else {
        toast.error(errorMessage);
      }
    }
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('Uploading team logo for team:', teamId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${teamId}/logo-${Date.now()}.${fileExt}`;
      
      // Upload the file to the team-logos bucket
      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Logo upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName);

      console.log('Logo uploaded successfully, URL:', data.publicUrl);
      return data.publicUrl;
    },
    onSuccess: (logoUrl) => {
      console.log('Logo upload successful, updating team settings with URL:', logoUrl);
      updateTeamMutation.mutate({ 
        name: name.trim(),
        description: description.trim(),
        logoUrl 
      });
    },
    onError: (error: any) => {
      console.error('Error uploading logo:', error);
      const errorMessage = error?.message || 'Failed to upload logo';
      
      if (errorMessage.includes('policy')) {
        toast.error('You do not have permission to upload team logos');
      } else {
        toast.error(errorMessage);
      }
    }
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    console.log('Saving team settings - Logo file:', logoFile, 'Name:', name, 'Description:', description);
    
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    } else {
      updateTeamMutation.mutate({
        name: name.trim(),
        description: description.trim()
      });
    }
  };

  const hasChanges = name !== teamName || description !== (teamDescription || '') || logoFile !== null;
  const isLoading = updateTeamMutation.isPending || uploadLogoMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Team Settings</h3>
        <p className="text-sm text-muted-foreground">
          Update your team's basic information and appearance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Team Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>

          <div>
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="team-logo">Team Logo</Label>
            <div className="space-y-4">
              {logoPreview && (
                <div className="flex items-center gap-4">
                  <img 
                    src={logoPreview} 
                    alt="Team logo preview" 
                    className="w-16 h-16 rounded-lg object-cover border"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current logo
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <Input
                  id="team-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('team-logo') as HTMLInputElement;
                    input?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSaveSettings}
            disabled={!hasChanges || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
