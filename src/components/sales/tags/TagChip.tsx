
import { useState } from "react";
import { KanbanTag } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TagChipProps {
  tag: KanbanTag;
  onEdit: (tagId: string, name: string, color: string) => void;
  onDelete: (tagId: string) => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
}

export const TagChip = ({ 
  tag, 
  onEdit, 
  onDelete, 
  isEditing = false,
  onStartEdit,
  onCancelEdit
}: TagChipProps) => {
  const [editName, setEditName] = useState(tag.name);
  const [editColor, setEditColor] = useState(tag.color);

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onEdit(tag.id, editName.trim(), editColor);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditName(tag.name);
      setEditColor(tag.color);
      onCancelEdit?.();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="h-8 text-sm bg-white/20 border-white/30"
          autoFocus
        />
        <div 
          className="w-6 h-6 rounded-full border-2 border-white/50 cursor-pointer"
          style={{ backgroundColor: editColor }}
          onClick={() => setEditColor(editColor === "#ef4444" ? "#3b82f6" : "#ef4444")}
        />
        <button
          onClick={handleSaveEdit}
          className="text-xs px-2 py-1 bg-green-500/80 text-white rounded hover:bg-green-600/80 transition-colors"
        >
          ✓
        </button>
        <button
          onClick={onCancelEdit}
          className="text-xs px-2 py-1 bg-red-500/80 text-white rounded hover:bg-red-600/80 transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-all duration-200 hover:scale-105"
         style={{ backgroundColor: `${tag.color}cc` }}>
      <span>{tag.name}</span>
      
      {/* Hover Actions */}
      <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
        <button
          onClick={onStartEdit}
          className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
          <Edit2 className="w-2.5 h-2.5 text-white" />
        </button>
        <button
          onClick={() => onDelete(tag.id)}
          className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <Trash2 className="w-2.5 h-2.5 text-white" />
        </button>
      </div>
    </div>
  );
};
