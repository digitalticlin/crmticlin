import { useState } from "react";
import { MassSelectionCoordinatedReturn } from "@/hooks/useMassSelectionCoordinated";
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

interface MassSelectionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onMove: () => void;
  onTag: () => void;
  onAssignUser: () => void;
  onClearSelection: () => void;
}

export const MassSelectionToolbar = ({
  selectedCount,
  onDelete,
  onMove,
  onTag,
  onAssignUser,
  onClearSelection
}: MassSelectionToolbarProps) => {

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
      "bg-white/90 backdrop-blur-lg border border-white/30 shadow-2xl rounded-2xl",
      "px-6 py-4 flex items-center gap-4",
      "transition-all duration-300 animate-in slide-in-from-bottom-4"
    )}>
      {/* Contador */}
      <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
        <span>
          {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Divisor */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Ações */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onMove}
          className="flex items-center gap-2 bg-white/50 hover:bg-white/70"
        >
          <Move size={16} />
          Mover
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onTag}
          className="flex items-center gap-2 bg-white/50 hover:bg-white/70"
        >
          <Tag size={16} />
          Tags
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onAssignUser}
          className="flex items-center gap-2 bg-white/50 hover:bg-white/70"
        >
          <User size={16} />
          Responsável
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
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
        onClick={onClearSelection}
        className="p-1 h-auto text-gray-500 hover:text-gray-700"
      >
        <X size={16} />
      </Button>
    </div>
  );
};