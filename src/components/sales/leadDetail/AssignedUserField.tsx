
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserCheck, Edit, Save, X } from "lucide-react";

interface AssignedUserFieldProps {
  assignedUser?: string;
  onUpdateAssignedUser?: (user: string) => void;
}

export const AssignedUserField = ({
  assignedUser,
  onUpdateAssignedUser
}: AssignedUserFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(assignedUser || "");

  const handleSave = () => {
    onUpdateAssignedUser?.(user);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setUser(assignedUser || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-gray-700 font-medium flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-blue-600" />
          Responsável
        </Label>
        {onUpdateAssignedUser && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="bg-blue-500/30 hover:bg-blue-500/40 text-blue-700 border border-blue-300/50 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <Input
            placeholder="Nome do responsável"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="bg-white/60 border-white/50 focus:border-blue-400 focus:ring-blue-400/20 backdrop-blur-sm shadow-sm"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-blue-500/30 hover:bg-blue-500/40 text-blue-700 border border-blue-300/50 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              className="bg-red-500/30 hover:bg-red-500/40 text-red-700 border border-red-300/50 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-white/30 shadow-sm">
          <div className="text-gray-800 font-medium">
            {assignedUser || "Não atribuído"}
          </div>
        </div>
      )}
    </div>
  );
};
