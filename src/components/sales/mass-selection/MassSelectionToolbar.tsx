import { useState } from "react";
import { MassSelectionReturn } from "@/hooks/useMassSelection";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Move, 
  Tag, 
  User, 
  X, 
  CheckSquare,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanLead } from "@/types/kanban";

interface MassSelectionToolbarProps {
  allLeads: KanbanLead[];
  massSelection: MassSelectionReturn;
  onDelete: (selectedLeads: KanbanLead[]) => void;
  onMove: (selectedLeads: KanbanLead[]) => void;
  onAssignTags: (selectedLeads: KanbanLead[]) => void;
  onAssignUser: (selectedLeads: KanbanLead[]) => void;
}

export const MassSelectionToolbar = ({
  allLeads,
  massSelection,
  onDelete,
  onMove,
  onAssignTags,
  onAssignUser
}: MassSelectionToolbarProps) => {

  const { 
    selectedLeads, 
    isSelectionMode,
    selectedCount,
    clearSelection, 
    exitSelectionMode,
    getSelectedLeadsData,
    selectAll
  } = massSelection;
  const selectedLeadsData = getSelectedLeadsData(allLeads);
  const allSelected = allLeads.length > 0 && selectedLeads.size === allLeads.length;

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(allLeads);
    }
  };

  if (!isSelectionMode) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
      "bg-white/90 backdrop-blur-lg border border-white/30 shadow-2xl rounded-2xl",
      "px-6 py-4 flex items-center gap-4",
      "transition-all duration-300 animate-in slide-in-from-bottom-4"
    )}>
      {/* Contador e seleção */}
      <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="p-1 h-auto"
        >
          {allSelected ? (
            <CheckSquare size={16} className="text-blue-500" />
          ) : (
            <Square size={16} className="text-gray-400" />
          )}
        </Button>
        <span>
          {selectedCount} de {allLeads.length} selecionado{selectedCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Divisor */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Ações */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMove(selectedLeadsData)}
          className="flex items-center gap-2 bg-white/50 hover:bg-white/70"
        >
          <Move size={16} />
          Mover
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAssignTags(selectedLeadsData)}
          className="flex items-center gap-2 bg-white/50 hover:bg-white/70"
        >
          <Tag size={16} />
          Tags
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onAssignUser(selectedLeadsData)}
          className="flex items-center gap-2 bg-white/50 hover:bg-white/70"
        >
          <User size={16} />
          Responsável
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(selectedLeadsData)}
          className="flex items-center gap-2 text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50/70"
        >
          <Trash2 size={16} />
          Excluir
        </Button>
      </div>

      {/* Fechar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={exitSelectionMode}
        className="p-1 h-auto text-gray-500 hover:text-gray-700"
      >
        <X size={16} />
      </Button>
    </div>
  );
};