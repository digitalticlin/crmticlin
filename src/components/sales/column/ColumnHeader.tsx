
import { useState } from "react";
import { MoreVertical, Edit, Trash2, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KanbanColumn, FIXED_COLUMN_IDS } from "@/types/kanban";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AIToggleSwitchEnhanced } from "../ai/AIToggleSwitchEnhanced";
import { useAIStageControl } from "@/hooks/salesFunnel/useAIStageControl";
import { MassSelectionCoordinatedReturn as MassSelectionReturn } from "@/hooks/useMassSelectionCoordinated";
import { useStageLeadCount } from "@/hooks/salesFunnel/stages/useStageLeadCount";

interface ColumnHeaderProps {
  column: KanbanColumn;
  isHovered: boolean;
  canEdit: boolean;
  onUpdate: (field: keyof KanbanColumn, value: any) => void;
  onDelete: () => void;
  massSelection?: MassSelectionReturn;
  funnelId?: string | null;
}

export const ColumnHeader = ({
  column,
  isHovered,
  canEdit,
  onUpdate,
  onDelete,
  massSelection,
  funnelId
}: ColumnHeaderProps) => {
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const { toggleAI, isLoading: isTogglingAI } = useAIStageControl();

  // Hook para contar total de leads na etapa no banco de dados
  const { getStageCount } = useStageLeadCount({
    funnelId,
    enabled: !!funnelId
  });
  
  // Usar massSelection via props ou valores padrão
  const effectiveMassSelection = massSelection || {
    isSelectionMode: false,
    selectStage: () => {},
    getStageSelectionState: () => 'none' as const
  };

  const { isSelectionMode, selectStage, getStageSelectionState } = effectiveMassSelection;
  
  const updateColumn = () => {
    if (!editingColumn || !editingColumn.title.trim()) return;
    onUpdate('title', editingColumn.title);
    if (editingColumn.color) {
      onUpdate('color', editingColumn.color);
    }
    setEditingColumn(null);
  };
  
  const isFixed = column.isFixed === true;
  const displayTitle = column.id === FIXED_COLUMN_IDS.NEW_LEAD ? "Entrada de leads" : column.title;
  
  // Verificar se é etapa GANHO ou PERDIDO (não devem ter controle de IA)
  const isWonLostStage = column.title === "GANHO" || column.title === "PERDIDO";
  const aiEnabled = column.ai_enabled === true;

  // Handler para toggle AI
  const handleAIToggle = async (enabled: boolean) => {
    console.log('[ColumnHeader] 🎛️ Toggle AI INICIADO:', {
      columnId: column.id,
      columnTitle: column.title,
      currentEnabled: aiEnabled,
      newEnabled: enabled,
      isWonLostStage,
      isLoading: isTogglingAI
    });
    
    if (!isWonLostStage && !isTogglingAI) {
      const success = await toggleAI(column.id, enabled);
      console.log('[ColumnHeader] ✅ Toggle AI RESULTADO:', { success });
    } else {
      console.log('[ColumnHeader] ❌ Toggle AI BLOQUEADO:', { isWonLostStage, isTogglingAI });
    }
  };

  // Calcular valor total da etapa
  const totalValue = column.leads.reduce((total, lead) => {
    const value = lead.purchaseValue || lead.purchase_value || 0;
    return total + value;
  }, 0);

  // Formatação monetária brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Estados da seleção de etapa
  const stageSelectionState = isSelectionMode ? getStageSelectionState(column.leads) : 'none';
  const hasLeads = column.leads.length > 0;

  // Handler para seleção de etapa completa
  const handleStageSelection = () => {
    if (hasLeads) {
      selectStage(column.leads);
    }
  };

  return (
    <div className="p-4 flex items-center justify-between border-b border-slate-200/15 bg-transparent">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Checkbox de seleção de etapa - aparece apenas no modo seleção */}
        {isSelectionMode && hasLeads && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded border-2 transition-all hover:scale-105",
              stageSelectionState === 'all' 
                ? "bg-blue-600 border-blue-600 text-white" 
                : stageSelectionState === 'some'
                  ? "bg-blue-100 border-blue-600 text-blue-600"
                  : "bg-white border-gray-400 hover:border-blue-400"
            )}
            onClick={handleStageSelection}
          >
            {stageSelectionState === 'all' ? (
              <Check className="h-3 w-3" />
            ) : stageSelectionState === 'some' ? (
              <Minus className="h-3 w-3" />
            ) : null}
          </Button>
        )}
        
        <h3 className="font-semibold font-inter text-lg truncate text-gray-900">{displayTitle}</h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Contador de leads - total no banco de dados */}
          <span className="bg-gray-100 text-gray-800 font-bold rounded-xl px-3 py-0.5 text-xs border border-gray-300">
            {getStageCount(column.id)}
          </span>
          
          {/* Valor total da etapa */}
          {totalValue > 0 && (
            <span className="bg-green-100 text-green-800 font-bold rounded-xl px-3 py-0.5 text-xs border border-green-300 flex items-center gap-1">
              💰 {formatCurrency(totalValue)}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Controle de IA aprimorado - Aparece em todas as etapas EXCETO GANHO e PERDIDO */}
        {!isWonLostStage && (
          <AIToggleSwitchEnhanced
            enabled={aiEnabled}
            onToggle={handleAIToggle}
            isLoading={isTogglingAI}
            size="md"
            variant="prominent"
            showLabel={true}
            className="flex-shrink-0"
          />
        )}

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-600 hover:bg-gray-100 transition-all">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Etapa</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="column-title" className="text-sm font-medium block mb-2">
                        Nome da etapa
                      </label>
                      <Input
                        id="column-title"
                        placeholder="Nome da etapa"
                        value={editingColumn?.title || column.title}
                        onChange={(e) => setEditingColumn({
                          ...(editingColumn || column),
                          title: e.target.value
                        })}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="column-color" className="text-sm font-medium block mb-2">
                        Cor da etapa
                      </label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="column-color"
                          type="color"
                          className="w-12 h-10 p-1 cursor-pointer"
                          value={editingColumn?.color || column.color || "#e5e7eb"}
                          onChange={(e) => setEditingColumn({
                            ...(editingColumn || column),
                            color: e.target.value
                          })}
                        />
                        <div className="flex-1">
                          <Input
                            type="text"
                            placeholder="#RRGGBB"
                            value={editingColumn?.color || column.color || "#e5e7eb"}
                            onChange={(e) => setEditingColumn({
                              ...(editingColumn || column),
                              color: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="mt-6">
                    <DialogClose asChild>
                      <Button variant="outline" onClick={() => setEditingColumn(null)}>
                        Cancelar
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button 
                        className="bg-ticlin hover:bg-ticlin/90 text-black"
                        onClick={updateColumn}
                      >
                        Salvar
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir Etapa</DialogTitle>
                  </DialogHeader>
                  <p className="mt-4">
                    Tem certeza que deseja excluir a etapa "{column.title}"? 
                    Todos os leads nesta etapa também serão excluídos.
                  </p>
                  <DialogFooter className="mt-4">
                    <DialogClose asChild>
                      <Button variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button 
                        variant="destructive"
                        onClick={onDelete}
                      >
                        Excluir
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
