
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { User } from "lucide-react";

interface AssignedUserFieldProps {
  assignedUser?: string;
  onUpdateAssignedUser?: (assignedUser: string) => void;
}

export const AssignedUserField = ({ 
  assignedUser = "", 
  onUpdateAssignedUser 
}: AssignedUserFieldProps) => {
  const [userValue, setUserValue] = useState(assignedUser);
  
  // Update local state when prop changes
  useEffect(() => {
    setUserValue(assignedUser || "");
  }, [assignedUser]);
  
  const handleAssignedUserChange = () => {
    if (!onUpdateAssignedUser) return;
    onUpdateAssignedUser(userValue);
  };
  
  if (!onUpdateAssignedUser) return null;
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <User className="h-4 w-4 mr-1" /> Responsável
      </h3>
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Atribuir responsável"
          value={userValue}
          onChange={(e) => setUserValue(e.target.value)}
          className="w-full"
        />
        <Button size="sm" onClick={handleAssignedUserChange}>
          Salvar
        </Button>
      </div>
    </div>
  );
};
