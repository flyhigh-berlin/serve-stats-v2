
import React, { useState } from "react";
import { useVolleyball } from "../context/VolleyballContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function GameTypeManager() {
  const { getAllGameTypes, addCustomGameType, updateGameType, removeCustomGameType, customGameTypes, gameTypes } = useVolleyball();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newAbbreviation, setNewAbbreviation] = useState("");
  const [newName, setNewName] = useState("");
  const [editingType, setEditingType] = useState<string | null>(null);

  const allGameTypes = getAllGameTypes();

  const handleAddGameType = () => {
    if (!newAbbreviation.trim() || !newName.trim()) {
      toast.error("Please fill in both abbreviation and name");
      return;
    }

    if (newAbbreviation in allGameTypes) {
      toast.error("Game type abbreviation already exists");
      return;
    }

    addCustomGameType(newAbbreviation.toUpperCase(), newName);
    setNewAbbreviation("");
    setNewName("");
    setIsAddDialogOpen(false);
    toast.success("Game type added successfully!");
  };

  const handleEditGameType = () => {
    if (!editingType || !newName.trim()) {
      toast.error("Please provide a name");
      return;
    }

    updateGameType(editingType, newName);
    setEditingType(null);
    setNewName("");
    setIsEditDialogOpen(false);
    toast.success("Game type updated successfully!");
  };

  const handleDeleteGameType = (abbreviation: string) => {
    if (abbreviation in gameTypes) {
      toast.error("Cannot delete default game types");
      return;
    }

    removeCustomGameType(abbreviation);
    toast.success("Game type deleted successfully!");
  };

  const startEdit = (abbreviation: string) => {
    setEditingType(abbreviation);
    setNewName(allGameTypes[abbreviation]);
    setIsEditDialogOpen(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Game Types
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Game Types</span>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Game Type</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="abbreviation">Abbreviation</Label>
                    <Input
                      id="abbreviation"
                      value={newAbbreviation}
                      onChange={(e) => setNewAbbreviation(e.target.value)}
                      placeholder="e.g., CUP"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g., Cup Tournament"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddGameType}>Add Game Type</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-1">
            {Object.entries(allGameTypes).map(([abbreviation, name]) => (
              <div key={abbreviation} className="flex items-center justify-between p-1 rounded hover:bg-muted">
                <span className="text-xs">
                  [{abbreviation}] {name}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(abbreviation)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  {!(abbreviation in gameTypes) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGameType(abbreviation)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Game Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Abbreviation</Label>
              <Input value={editingType || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Game type name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGameType}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
