import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MoreVertical, Edit, Trash2, Plus, Lock, CheckSquare, Square, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LeadCard } from "./LeadCard";
import { KanbanColumn as KanbanColumnType, KanbanLead } from "@/types/kanban";
import { AIToggleSwitchEnhanced } from "./ai/AIToggleSwitchEnhanced";
import { useAIStageControl } from "@/hooks/salesFunnel/useAIStageControl";
import { toast } from "sonner";
import { MassSelectionReturn } from "@/hooks/useMassSelection";
import { useStageLeadCount } from "@/hooks/salesFunnel/stages/useStageLeadCount";

// Hook para scroll infinito real conectado ao banco
const useInfiniteScrollDatabase = (
  stageId: string,
  totalInMemory: number,
  totalInDatabase: number,
  onLoadMoreFromDatabase: (stageId: string) => void
) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sempre mostrar todos os leads carregados em memória
  const visibleCount = totalInMemory;

  // Há mais leads no banco se o total em memória < total no banco
  const hasMore = totalInMemory < totalInDatabase;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      await onLoadMoreFromDatabase(stageId);
    } catch (error) {
      console.error('[useInfiniteScrollDatabase] Erro ao carregar mais:', error);
    } finally {
      // Aguardar um pouco para a UI atualizar
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 300);
    }
  }, [isLoadingMore, hasMore, stageId, onLoadMoreFromDatabase]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Trigger quando chegar a 90% do scroll E houver mais leads no banco
    if (scrollPercentage > 0.9 && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  return {
    visibleCount,
    isLoading: isLoadingMore,
    hasMore,
    loadMore,
    handleScroll
  };
};

// Hook customizado para edição de título
const useTitleEditor = (
  initialTitle: string,
  onSave: (title: string) => Promise<void>
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialTitle);

  const handleSave = useCallback(async () => {
    if (editTitle.trim() && editTitle !== initialTitle) {
      try {
        await onSave(editTitle.trim());
        setIsEditing(false);
      } catch (error: any) {
        toast.error(error.message || "Erro ao atualizar estágio");
        setEditTitle(initialTitle);
      }
    } else {
      setIsEditing(false);
      setEditTitle(initialTitle);
    }
  }, [editTitle, initialTitle, onSave]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(initialTitle);
    }
  }, [handleSave, initialTitle]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditTitle(initialTitle);
  }, [initialTitle]);

  return {
    isEditing,
    editTitle,
    setEditTitle,
    handleSave,
    handleKeyPress,
    startEditing
  };
};

// Componente para o header da coluna
interface ColumnHeaderProps {
  column: KanbanColumnType;
  isFixedStage: boolean;
  aiEnabled: boolean;
  isWonLostView: boolean;
  isTogglingAI: boolean;
  onToggleAI: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  massSelection?: MassSelectionReturn;
  funnelId?: string | null;
  titleEditor: {
    isEditing: boolean;
    editTitle: string;
    setEditTitle: (title: string) => void;
    handleSave: () => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
  };
}

const ColumnHeader = ({
  column,
  isFixedStage,
  aiEnabled,
  isWonLostView,
  isTogglingAI,
  onToggleAI,
  onEdit,
  onDelete,
  massSelection,
  funnelId,
  titleEditor
}: ColumnHeaderProps) => {
  // Verificar se é etapa GANHO ou PERDIDO (essas não devem ter controle de IA)
  const isWonLostStage = column.title === "GANHO" || column.title === "PERDIDO";

  // Hook para contar total de leads na etapa no banco de dados
  const { getStageCount } = useStageLeadCount({
    funnelId,
    enabled: !!funnelId
  });

  // Lógica para seleção de etapa
  const stageSelectionState = massSelection?.getStageSelectionState(column.leads) || 'none';
  const handleStageSelection = () => {
    if (massSelection) {
      massSelection.selectStage(column.leads);
    }
  };
  
  // Calcular o valor total dos purchase_values dos leads
  const totalPurchaseValue = useMemo(() => {
    const total = column.leads.reduce((sum, lead) => {
      const value = Number(lead.purchase_value) || 0;
      return sum + value;
    }, 0);
    
    // Formatar como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(total);
  }, [column.leads]);
  
  // Só mostrar se houver valor
  const hasValue = column.leads.some(lead => Number(lead.purchase_value) > 0);
  
  return (
    <div className="mb-4 px-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {massSelection?.isSelectionMode && (
            <button
              onClick={handleStageSelection}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors mr-1"
              title="Selecionar/Deselecionar todos os leads desta etapa"
            >
              {stageSelectionState === 'all' ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          )}

          {isFixedStage && <Lock className="h-4 w-4 text-gray-500" />}
          {titleEditor.isEditing ? (
            <Input
              value={titleEditor.editTitle}
              onChange={(e) => titleEditor.setEditTitle(e.target.value)}
              onBlur={titleEditor.handleSave}
              onKeyDown={titleEditor.handleKeyPress}
              className="text-sm font-medium bg-white"
              autoFocus
            />
          ) : (
            <h3 
              className={cn(
                "text-sm font-medium text-gray-900 truncate",
                isFixedStage && "text-gray-600"
              )}
              style={{ color: column.color }}
            >
              {column.title}
            </h3>
          )}
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {getStageCount(column.id)}
          </span>
        </div>

        <div className="flex items-center gap-2">
        {/* Controle de IA - Aparece em todas as etapas EXCETO GANHO e PERDIDO */}
        {!isWonLostStage && !isWonLostView && (
          <AIToggleSwitchEnhanced
            enabled={aiEnabled}
            onToggle={onToggleAI}
            isLoading={isTogglingAI}
            size="sm"
            variant="prominent"
            showLabel={false}
            className="flex-shrink-0"
            label="IA"
          />
        )}

        {/* Menu de ações - Só aparece para etapas não fixas e não em visão GANHO/PERDIDO */}
        {!isFixedStage && !isWonLostView && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      </div>
      
      {/* Mostrar valor total se houver */}
      {hasValue && (
        <div className="mt-2 px-1">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Total negociações:</span>
              <span className="text-sm font-bold text-green-700">{totalPurchaseValue}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para indicadores de scroll
interface ScrollIndicatorsProps {
  isLoading: boolean;
  hasMore: boolean;
  visibleCount: number;
  totalCount: number;
  onLoadMore: () => void;
}

const ScrollIndicators = ({ 
  isLoading, 
  hasMore, 
  visibleCount, 
  totalCount, 
  onLoadMore 
}: ScrollIndicatorsProps) => (
  <>
    {isLoading && (
      <div className="p-3 text-center text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded mx-1 mb-2">
        <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
        Carregando mais leads...
      </div>
    )}
    
    {hasMore && !isLoading && (
      <div className="p-2 text-center text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded mx-1 mb-2">
        Mostrando {visibleCount} de {totalCount} leads
        <br />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLoadMore}
          className="text-xs mt-1 h-6"
        >
          Carregar mais
        </Button>
      </div>
    )}
  </>
);

interface KanbanColumnProps {
  column: KanbanColumnType;
  index: number;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onUpdateColumn?: (column: KanbanColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionReturn;
  funnelId?: string | null;
  onLoadMoreFromDatabase?: (stageId: string) => void;
}

export function KanbanColumn({
  column,
  index,
  onOpenLeadDetail,
  onUpdateColumn,
  onDeleteColumn,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection,
  funnelId,
  onLoadMoreFromDatabase
}: KanbanColumnProps) {

  // 🔍 DEBUG: Log para verificar se os leads estão chegando filtrados
  console.log(`[KanbanColumn] 📊 Stage "${column.title}":`, {
    totalLeads: column.leads?.length || 0,
    leadsIds: column.leads?.slice(0, 3).map(l => l.id) || [],
    timestamp: new Date().toISOString().slice(11, 19)
  });
  
  // Hooks customizados
  const { toggleAI, isLoading: isTogglingAI } = useAIStageControl();
  const {
    visibleCount,
    isLoading: isLoadingMore,
    hasMore,
    loadMore,
    handleScroll
  } = useInfiniteScrollDatabase(
    column.id,
    column.leads.length, // Total em memória
    totalCount, // Total no banco (do useStageLeadCount)
    onLoadMoreFromDatabase || (() => {}) // Fallback se não houver função
  );

  // Memoização de valores computados - ATUALIZADA para incluir controle de IA em "Entrada de Leads"
  const isFixedStage = useMemo(() => 
    column.title === "GANHO" || 
    column.title === "PERDIDO" || 
    column.title === "Entrada de Leads" || 
    column.isFixed,
    [column.title, column.isFixed]
  );

  const aiEnabled = useMemo(() => column.ai_enabled === true, [column.ai_enabled]);
  // Estado local para atualização otimista do toggle de IA
  const [aiEnabledUI, setAiEnabledUI] = useState<boolean>(aiEnabled);
  useEffect(() => {
    setAiEnabledUI(aiEnabled);
  }, [aiEnabled]);
  
  // ✅ CORREÇÃO: Garantir que visibleLeads seja sempre correto
  const visibleLeads = useMemo(() => {
    // Se não há leads, retornar array vazio
    if (!column.leads || column.leads.length === 0) {
      return [];
    }

    // Se há menos leads que visibleCount, mostrar todos
    if (column.leads.length <= visibleCount) {
      return column.leads;
    }

    // Caso normal: slice até visibleCount
    const result = column.leads.slice(0, visibleCount);

    // 🔍 DEBUG: Log dos leads visíveis
    console.log(`[KanbanColumn] 👁️ Stage "${column.title}" visibleLeads:`, {
      totalLeads: column.leads.length,
      visibleCount,
      showingLeads: result.length,
      leadNames: result.slice(0, 2).map(l => l.name)
    });

    return result;
  }, [column.leads, visibleCount, column.title]);

  // Handler para salvar título
  const handleSaveTitle = useCallback(async (newTitle: string) => {
    if (onUpdateColumn) {
      await onUpdateColumn({ ...column, title: newTitle });
    }
  }, [column, onUpdateColumn]);

  // Hook para edição de título
  const titleEditor = useTitleEditor(column.title, handleSaveTitle);

  // Handler para deletar coluna
  const handleDelete = useCallback(async () => {
    if (onDeleteColumn) {
      try {
        await onDeleteColumn(column.id);
      } catch (error: any) {
        toast.error(error.message || "Erro ao deletar estágio");
      }
    }
  }, [column.id, onDeleteColumn]);

  // Handler para toggle AI - ATUALIZADO para funcionar em todas as etapas
  const handleAIToggle = useCallback((enabled: boolean) => {
    console.log('[KanbanColumn] 🎛️ Toggle AI:', {
      columnId: column.id,
      columnTitle: column.title,
      currentEnabled: aiEnabled,
      newEnabled: enabled,
      isFixedStage,
      isWonLostView
    });
    
    // Permitir controle de IA em todas as etapas, exceto GANHO e PERDIDO
    const isWonLostStage = column.title === "GANHO" || column.title === "PERDIDO";
    if (!isWonLostStage) {
      // Atualização otimista imediata na UI
      setAiEnabledUI(enabled);
      toggleAI(column.id, aiEnabled);
    }
  }, [column.id, column.title, aiEnabled, isFixedStage, isWonLostView, toggleAI]);

  // Logging otimizado
  console.log('[KanbanColumn] 📊 Renderização com controle de IA aprimorado:', {
    columnTitle: column.title,
    totalLeads: column.leads.length,
    visibleLeads: visibleLeads.length,
    hasMore,
    aiEnabled,
    isFixedStage,
    canControlAI: column.title !== "GANHO" && column.title !== "PERDIDO"
  });

  return (
    <div className="bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl px-1.5 pt-1.5 pb-0 min-w-[300px] w-[300px] flex flex-col h-full transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg">
      {/* Header com controle de IA aprimorado */}
      <ColumnHeader
        column={column}
        isFixedStage={isFixedStage}
        aiEnabled={aiEnabledUI}
        isWonLostView={isWonLostView}
        isTogglingAI={isTogglingAI}
        onToggleAI={handleAIToggle}
        onEdit={titleEditor.startEditing}
        onDelete={handleDelete}
        massSelection={massSelection}
        funnelId={funnelId}
        titleEditor={titleEditor}
      />

      {/* Color bar */}
      <div
        className="h-1 rounded-full mb-2 mx-1"
        style={{ backgroundColor: column.color || "#e0e0e0" }}
      />

      {/* Lista de leads sem drag and drop */}
      <div
        className="flex-1 rounded-xl px-0.5 pt-1 pb-0 kanban-column-scrollbar overflow-y-auto overflow-x-hidden"
        style={{
          minHeight: "400px",
          maxHeight: "calc(100svh - 190px)",
          scrollbarColor: "#ffffff66 transparent"
        }}
        onScroll={handleScroll}
      >
        {/* Renderizar leads visíveis */}
        {visibleLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onOpenLeadDetail(lead)}
            onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
            onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(lead, "won") : undefined}
            onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(lead, "lost") : undefined}
            onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
            isWonLostView={isWonLostView}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
            massSelection={massSelection}
          />
        ))}
        
        {/* Indicadores de scroll */}
        <ScrollIndicators
          isLoading={isLoadingMore}
          hasMore={hasMore}
          visibleCount={visibleLeads.length}
          totalCount={column.leads.length}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  );
}
