
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, UserPlus, Copy, Clock } from "lucide-react";
import { toast } from "sonner";

interface AdminAssignment {
  email: string;
  type: 'existing' | 'invitation';
  inviteCode?: string;
  expiresAt?: string;
}

interface AdminAssignmentSectionProps {
  adminAssignments: AdminAssignment[];
  onAdminAssignmentsChange: (assignments: AdminAssignment[]) => void;
}

export function AdminAssignmentSection({ 
  adminAssignments, 
  onAdminAssignmentsChange 
}: AdminAssignmentSectionProps) {
  const [emailInput, setEmailInput] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<{
    code: string;
    email: string;
    expiresAt: string;
  } | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addAdminEmail = () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!isValidEmail(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const emailExists = adminAssignments.some(
      admin => admin.email.toLowerCase() === emailInput.toLowerCase()
    );

    if (emailExists) {
      toast.error("This email has already been added");
      return;
    }

    const newAssignment: AdminAssignment = {
      email: emailInput.trim(),
      type: 'existing' // Will be determined during team creation
    };

    onAdminAssignmentsChange([...adminAssignments, newAssignment]);
    setEmailInput("");
  };

  const removeAdminEmail = (email: string) => {
    const filtered = adminAssignments.filter(admin => admin.email !== email);
    onAdminAssignmentsChange(filtered);
  };

  const generateInviteCode = () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email address first");
      return;
    }

    if (!isValidEmail(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Generate a mock invite code for preview (real one will be generated server-side)
    const mockInviteCode = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    setGeneratedInvite({
      code: mockInviteCode,
      email: emailInput.trim(),
      expiresAt
    });

    const newAssignment: AdminAssignment = {
      email: emailInput.trim(),
      type: 'invitation',
      inviteCode: mockInviteCode,
      expiresAt
    };

    onAdminAssignmentsChange([...adminAssignments, newAssignment]);
    setEmailInput("");
    toast.success("Admin invitation prepared");
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invitation code copied to clipboard");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAdminEmail();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="admin-email">Assign Team Administrators</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Add users by email to assign as team administrators. At least one admin is required.
        </p>
        
        <div className="flex gap-2">
          <Input
            id="admin-email"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter admin email address"
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={addAdminEmail}
            disabled={!emailInput.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={generateInviteCode}
            disabled={!emailInput.trim()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Generate Invite
          </Button>
        </div>
      </div>

      {adminAssignments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assigned Administrators ({adminAssignments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {adminAssignments.map((admin, index) => (
              <div key={admin.email} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium">{admin.email}</div>
                    {admin.type === 'invitation' && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Invitation expires {new Date(admin.expiresAt!).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.type === 'existing' ? 'default' : 'secondary'}>
                    {admin.type === 'existing' ? 'Direct Assignment' : 'Invitation'}
                  </Badge>
                  {admin.inviteCode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteCode(admin.inviteCode!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdminEmail(admin.email)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {adminAssignments.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
          <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No administrators assigned yet</p>
          <p className="text-sm">Add at least one admin email to create the team</p>
        </div>
      )}
    </div>
  );
}
