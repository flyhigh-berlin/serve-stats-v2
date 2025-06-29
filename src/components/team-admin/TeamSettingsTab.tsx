
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

export function TeamSettingsTab({ teamId, teamName, teamDescription, teamLogoUrl }: TeamSettingsTabProps) {
  const [name, setName] = useState(teamName);
  const [description, setDescription] = useState(teamDescription || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(teamLogoUrl || null);
  const queryClient = useQueryClient();

  const updateTeamMutation = useMutation({
    mutationFn: async (updates: { name?: string; description?: string; logoUrl?: string }) => {
      const { error } = await supabase
        .from('teams')
        .update({
          name: updates.name,
          description: updates.description,
          logo_url: updates.logoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-info', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-analytics', teamId] });
      // Refresh team context
      window.dispatchEvent(new CustomEvent('teamUpdated'));
      toast.success('Team settings updated successfully');
    },
    onError: (error) => {
      console.error('Error updating team settings:', error);
      toast.error('Failed to update settings');
    }
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${teamId}/logo-${Date.now()}.${fileExt}`;
      
      // Create team-logos bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'team-logos');
      
      if (!bucketExists) {
        await supabase.storage.createBucket('team-logos', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
      }
      
      const { error: uploadError } = await supabase.storage
        .from('team-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('team-logos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    },
    onSuccess: (logoUrl) => {
      updateTeamMutation.mutate({ 
        name: name.trim(),
        description: description.trim(),
        logoUrl 
      });
    },
    onError: (error) => {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
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
