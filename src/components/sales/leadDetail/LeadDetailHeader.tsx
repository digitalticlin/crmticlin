
import { KanbanLead } from "@/types/kanban";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { PencilLine, Phone } from "lucide-react";
import { useState } from "react";

interface LeadDetailHeaderProps {
  selectedLead: KanbanLead;
  onUpdateName?: (name: string) => void;
}

export const LeadDetailHeader = ({ selectedLead, onUpdateName }: LeadDetailHeaderProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(selectedLead.name);
  
  // Reset name value when lead changes
  if (nameValue !== selectedLead.name) {
    setNameValue(selectedLead.name);
  }
  
  const isNewLead = selectedLead.name.startsWith("ID:");
  
  const handleSave = () => {
    if (isEditingName && onUpdateName) {
      onUpdateName(nameValue);
      setIsEditingName(false);
    }
  };
  
  return (
    <>
      <div className="flex items-center justify-between">
        {isEditingName ? (
          <div className="flex gap-2 items-center w-full">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="Nome do lead"
              className="text-xl font-semibold w-full"
              autoFocus
            />
            <Button 
              size="sm" 
              variant="default" 
              onClick={handleSave}
              disabled={!nameValue.trim()}
            >
              Salvar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <SheetTitle className="text-xl font-semibold">
              {selectedLead.name}
            </SheetTitle>
            {isNewLead && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                Editar nome
              </Badge>
            )}
            <Button 
              size="icon" 
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsEditingName(true)}
            >
              <PencilLine className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <SheetDescription className="flex items-center gap-1">
        <Phone className="h-4 w-4" />
        {selectedLead.phone}
      </SheetDescription>
    </>
  );
};
