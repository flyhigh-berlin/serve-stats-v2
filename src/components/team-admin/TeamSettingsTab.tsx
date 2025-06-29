
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Upload, Trash2, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

interface TeamSettingsTabProps {
  teamId: string;
}

export function TeamSettingsTab({ teamId }: TeamSettingsTabProps) {
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data: teamInfo, isLoading } = useQuery({
    queryKey: ['team-settings', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setTeamName(data.name || "");
      setTeamDescription(data.description || "");
      setLogoPreview(data.logo_url || null);
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      let logoUrl = teamInfo?.logo_url;
      
      // Upload logo if a new file is selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${teamId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('team-logos')
          .upload(fileName, logoFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('team-logos')
          .getPublicUrl(uploadData.path);
        
        logoUrl = publicUrl;
      }
      
      const { data, error } = await supabase.rpc('update_team_settings', {
        team_id_param: teamId,
        team_name: teamName.trim() || null,
        team_description: teamDescription.trim() || null,
        team_logo_url: logoUrl
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-settings', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-analytics', teamId] });
      setLogoFile(null);
      toast.success('Team settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings: ' + error.message);
    }
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const hasChanges = 
    teamName !== (teamInfo?.name || "") ||
    teamDescription !== (teamInfo?.description || "") ||
    logoFile !== null;

  if (isLoading) {
    return <div className="text-center py-8">Loading team settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your team's information and branding
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              maxLength={100}
            />
          </div>
          
          <div>
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Brief description of your team (optional)"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {teamDescription.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Team Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Team Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            {logoPreview && (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Team logo preview"
                  className="w-24 h-24 rounded-lg object-cover border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0"
                  onClick={removeLogo}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <div className="flex-1">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a team logo (max 5MB)
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasChanges && "You have unsaved changes"}
        </div>
        <Button
          onClick={() => updateSettingsMutation.mutate()}
          disabled={!hasChanges || updateSettingsMutation.isPending || !teamName.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Reset Team Data</h4>
                <p className="text-sm text-muted-foreground">
                  Remove all games and serves while keeping members and players
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Reset Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Team Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all games, serves, and statistics for this team.
                      Members and players will be preserved. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground">
                      Reset Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
