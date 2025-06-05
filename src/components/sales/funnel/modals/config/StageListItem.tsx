
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Save, X, GripVertical } from "lucide-react";
import { KanbanColumn } from "@/types/kanban";

interface StageListItemProps {
  stage: KanbanColumn;
  onUpdate: (stage: KanbanColumn) => Promise<void>;
  onDelete: (stageId: string) => Promise<void>;
}

export const StageListItem = ({ stage, onUpdate, onDelete }: StageListItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(stage.title);
  const [editColor, setEditColor] = useState(stage.color || "#3b82f6");

  const handleSave = async () => {
    try {
      await onUpdate({
        ...stage,
        title: editTitle,
        color: editColor
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar estágio:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(stage.title);
    setEditColor(stage.color || "#3b82f6");
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta etapa?")) return;
    await onDelete(stage.id);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
      <div className="cursor-move">
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>
      
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1"
          />
          <input
            type="color"
            value={editColor}
            onChange={(e) => setEditColor(e.target.value)}
            className="w-10 h-10 rounded border border-white/20"
          />
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: stage.color }}
            />
            <span className="font-medium">{stage.title}</span>
            <Badge variant="secondary" className="ml-2">
              {stage.leads?.length || 0} leads
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            {!stage.isFixed && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
