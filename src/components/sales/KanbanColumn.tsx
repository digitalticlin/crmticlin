import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { MoreVertical, Edit, Trash2, Plus, Lock } from "lucide-react";
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

// Hook customizado para gerenciar scroll infinito
const useInfiniteScroll = (totalItems: number, initialCount: number = 25) => {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  
  const hasMore = totalItems > visibleCount;
  
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 25, totalItems));
      setIsLoading(false);
    }, 300);
  }, [isLoading, hasMore, totalItems]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8 && hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [totalItems, initialCount]);

  return {
    visibleCount,
    isLoading,
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
  titleEditor
}: ColumnHeaderProps) => {
  // Verificar se é etapa GANHO ou PERDIDO (essas não devem ter controle de IA)
  const isWonLostStage = column.title === "GANHO" || column.title === "PERDIDO";
  
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex items-center gap-2 flex-1">
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
          {column.leads.length}
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
  lostStageId
}: KanbanColumnProps) {
  // Hooks customizados
  const { toggleAI, isLoading: isTogglingAI } = useAIStageControl();
  const {
    visibleCount,
    isLoading: isLoadingMore,
    hasMore,
    loadMore,
    handleScroll
  } = useInfiniteScroll(column.leads.length);

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
  
  const visibleLeads = useMemo(() => 
    column.leads.slice(0, visibleCount),
    [column.leads, visibleCount]
  );

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
    <div className="bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl px-1.5 py-3 min-w-[300px] max-w-[300px] flex flex-col h-full transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg">
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
        titleEditor={titleEditor}
      />

      {/* Color bar */}
      <div
        className="h-1 rounded-full mb-4 mx-1"
        style={{ backgroundColor: column.color || "#e0e0e0" }}
      />

      {/* Droppable com scroll infinito otimizado */}
      <Droppable droppableId={column.id} type="lead">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-xl px-0.5 py-2 kanban-column-scrollbar overflow-y-auto",
              snapshot.isDraggingOver && "bg-blue-50/50 border-2 border-dashed border-blue-400/70 transition-all duration-150"
            )}
            style={{
              minHeight: "400px",
              maxHeight: "calc(100vh - 200px)"
            }}
            onScroll={handleScroll}
          >
            {/* Renderizar leads visíveis */}
            {visibleLeads.map((lead, leadIndex) => (
              <Draggable key={lead.id} draggableId={lead.id} index={leadIndex}>
                {(provided, snapshot) => (
                  <LeadCard
                    lead={lead}
                    provided={provided}
                    onClick={() => onOpenLeadDetail(lead)}
                    onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
                    onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(lead, "won") : undefined}
                    onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(lead, "lost") : undefined}
                    onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
                    isWonLostView={isWonLostView}
                    wonStageId={wonStageId}
                    lostStageId={lostStageId}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* Indicadores de scroll */}
            <ScrollIndicators
              isLoading={isLoadingMore}
              hasMore={hasMore}
              visibleCount={visibleLeads.length}
              totalCount={column.leads.length}
              onLoadMore={loadMore}
            />
            
            {/* Indicador de drop otimizado */}
            {snapshot.isDraggingOver && column.leads.length === 0 && (
              <div className="flex items-center justify-center h-20 text-blue-500/70 text-sm font-medium border-2 border-dashed border-blue-300/50 rounded-lg bg-blue-50/30">
                ↓ Solte o card aqui ↓
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
