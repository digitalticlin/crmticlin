import { useState } from "react";
import { Trash2, Edit2, Save, X, Lock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "@/types/kanban";
import { AIToggleSwitchEnhanced } from "../../../ai/AIToggleSwitchEnhanced";
import { useAIStageControl } from "@/hooks/salesFunnel/useAIStageControl";
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
  const { toggleAI, isLoading: isTogglingAI } = useAIStageControl();

  // Verificar se o estágio é fixo
  const isFixedStage = stage.title === "GANHO" || stage.title === "PERDIDO" || stage.title === "Entrada de Leads" || stage.isFixed;

  // Verificar se é etapa GANHO ou PERDIDO (não devem ter controle de IA)
  const isWonLostStage = stage.title === "GANHO" || stage.title === "PERDIDO";

  // ✅ Usar diretamente das props - React Query invalida e atualiza automaticamente
  const aiEnabled = stage.ai_enabled === true;

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

  // Handler para toggle AI
  const handleAIToggle = async (enabled: boolean) => {
    if (!isWonLostStage) {
      // ✅ React Query vai invalidar o cache e re-renderizar automaticamente
      await toggleAI(stage.id, aiEnabled);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg border transition-all duration-200",
      isFixedStage ? "bg-gray-50/80 border-gray-200" : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
    )}>
      {/* Color indicator */}
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
        style={{ backgroundColor: editColor }}
      />

      {/* Stage info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Nome do estágio"
              className="text-sm"
              disabled={isLoading}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 min-w-[30px]">Cor:</span>
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="w-8 h-6 rounded border cursor-pointer"
                disabled={isLoading}
              />
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="#RRGGBB"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isFixedStage && <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />}
            <span className={cn(
              "text-sm font-medium truncate",
              isFixedStage ? "text-gray-600" : "text-gray-900"
            )}>
              {stage.title}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0">
              ({stage.leads.length} leads)
            </span>
          </div>
        )}
      </div>

      {/* AI Control - Aparece em todas as etapas EXCETO GANHO e PERDIDO */}
      {!isWonLostStage && !isEditing && (
        <div className="flex-shrink-0">
          <AIToggleSwitchEnhanced
            enabled={aiEnabled}
            onToggle={handleAIToggle}
            isLoading={isTogglingAI}
            size="sm"
            variant="compact"
            showLabel={false}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isEditing ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
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
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
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
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
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
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  disabled={isLoading}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
