import { useState } from "react";
import { Trash2, Edit2, Save, X, Lock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "@/types/kanban";
import { toast } from "sonner";

interface StageListItemProps {
  stage: KanbanColumn;
  onUpdate: (stage: KanbanColumn) => Promise<void>;
  onDelete: (stageId: string) => Promise<void>;
  onMoveUp?: (stageId: string) => Promise<void>;
  onMoveDown?: (stageId: string) => Promise<void>;
  isFirst?: boolean;
  isLast?: boolean;
}

export const StageListItem = ({ stage, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: StageListItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(stage.title);
  const [editColor, setEditColor] = useState(stage.color || "#e0e0e0");
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se o estágio é fixo
  const isFixedStage = stage.title === "GANHO" || stage.title === "PERDIDO" || stage.title === "Entrada de Leads" || stage.isFixed;

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("O título não pode estar vazio");
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate({
        ...stage,
        title: editTitle.trim(),
        color: editColor
      });
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar estágio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(stage.title);
    setEditColor(stage.color || "#e0e0e0");
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o estágio "${stage.title}"?`)) {
      setIsLoading(true);
      try {
        await onDelete(stage.id);
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir estágio");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      isFixedStage ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200"
    )}>
      {/* Color indicator */}
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: editColor }}
      />

      {/* Stage info */}
      <div className="flex-1">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Nome do estágio"
              className="text-sm"
              disabled={isLoading}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Cor:</span>
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="w-8 h-6 rounded border cursor-pointer"
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isFixedStage && <Lock className="h-3 w-3 text-gray-400" />}
            <span className={cn(
              "text-sm font-medium",
              isFixedStage ? "text-gray-600" : "text-gray-900"
            )}>
              {stage.title}
            </span>
            <span className="text-xs text-gray-500">
              ({stage.leads.length} leads)
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            {!isFixedStage && (
              <>
                {/* Botões de reordenação */}
                {onMoveUp && !isFirst && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMoveUp(stage.id)}
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                    disabled={isLoading}
                    title="Mover para cima"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                )}
                {onMoveDown && !isLast && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMoveDown(stage.id)}
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                    disabled={isLoading}
                    title="Mover para baixo"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                  disabled={isLoading}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {isFixedStage && (
              <span className="text-xs text-gray-400 px-2">
                Estágio fixo
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
