
import { useState, useEffect, useRef, useCallback } from "react";
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
import { AIToggleSwitch } from "./ai/AIToggleSwitch";
import { useAIStageControl } from "@/hooks/salesFunnel/useAIStageControl";
import { toast } from "sonner";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  
  // Estados para scroll infinito
  const [visibleLeadsCount, setVisibleLeadsCount] = useState(25);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook para controle de IA
  const { toggleAI, isLoading: isTogglingAI } = useAIStageControl();

  const isFixedStage = column.title === "GANHO" || column.title === "PERDIDO" || column.title === "Entrada de Leads" || column.isFixed;
  
  // Verificar se a IA está habilitada (padrão OFF)
  const aiEnabled = column.ai_enabled === true;

  console.log('[KanbanColumn] 🔍 Status da IA:', {
    columnTitle: column.title,
    aiEnabled,
    columnAiEnabled: column.ai_enabled,
    isFixedStage
  });

  // Leads visíveis baseado no scroll infinito
  const visibleLeads = column.leads.slice(0, visibleLeadsCount);
  const hasMoreLeads = column.leads.length > visibleLeadsCount;

  console.log('[KanbanColumn] 📊 Estado:', {
    columnTitle: column.title,
    totalLeads: column.leads.length,
    visibleLeads: visibleLeads.length,
    hasMoreLeads
  });

  // Função para carregar mais leads
  const loadMoreLeads = useCallback(() => {
    if (isLoadingMore || !hasMoreLeads) return;
    
    setIsLoadingMore(true);
    console.log('[KanbanColumn] 📥 Carregando mais leads para:', column.title);
    
    // Simular um pequeno delay para UX melhor
    setTimeout(() => {
      setVisibleLeadsCount(prev => Math.min(prev + 25, column.leads.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreLeads, column.leads.length, column.title]);

  // Detectar scroll para carregar mais leads
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    
    // Carregar quando estiver próximo do final (80% do scroll)
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8 && hasMoreLeads && !isLoadingMore) {
      loadMoreLeads();
    }
  }, [hasMoreLeads, isLoadingMore, loadMoreLeads]);

  // Resetar contagem quando a coluna mudar
  useEffect(() => {
    setVisibleLeadsCount(25);
  }, [column.id, column.leads.length]);

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== column.title && onUpdateColumn) {
      try {
        await onUpdateColumn({ ...column, title: editTitle.trim() });
        setIsEditing(false);
      } catch (error: any) {
        toast.error(error.message || "Erro ao atualizar estágio");
        setEditTitle(column.title);
      }
    } else {
      setIsEditing(false);
      setEditTitle(column.title);
    }
  };

  const handleDelete = async () => {
    if (onDeleteColumn) {
      try {
        await onDeleteColumn(column.id);
      } catch (error: any) {
        toast.error(error.message || "Erro ao deletar estágio");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(column.title);
    }
  };

  const handleAIToggle = (enabled: boolean) => {
    console.log('[KanbanColumn] 🎛️ Toggle AI clicado:', {
      columnId: column.id,
      columnTitle: column.title,
      currentEnabled: aiEnabled,
      newEnabled: enabled
    });
    toggleAI(column.id, aiEnabled);
  };

  return (
    <div className="bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl px-1.5 py-3 min-w-[300px] max-w-[300px] flex flex-col h-full transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg">
      {/* Header com IA Toggle no canto direito */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 flex-1">
          {isFixedStage && <Lock className="h-4 w-4 text-gray-500" />}
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyPress}
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

        {/* Área direita com IA Toggle e Menu de Ações */}
        <div className="flex items-center gap-2">
          {/* Toggle da IA - sempre visível para etapas não fixas */}
          {!isFixedStage && !isWonLostView && (
            <AIToggleSwitch
              enabled={aiEnabled}
              onToggle={handleAIToggle}
              isLoading={isTogglingAI}
              size="sm"
              showIcon={false}
              className="flex-shrink-0"
            />
          )}

          {/* Menu de ações */}
          {!isFixedStage && !isWonLostView && (onUpdateColumn || onDeleteColumn) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onUpdateColumn && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDeleteColumn && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Color bar */}
      <div
        className="h-1 rounded-full mb-4 mx-1"
        style={{ backgroundColor: column.color || "#e0e0e0" }}
      />

      {/* Droppable otimizado para RBD com scroll infinito */}
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
            
            {/* Indicador de carregamento */}
            {isLoadingMore && (
              <div className="p-3 text-center text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded mx-1 mb-2">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                Carregando mais leads...
              </div>
            )}
            
            {/* Status quando há mais leads */}
            {hasMoreLeads && !isLoadingMore && (
              <div className="p-2 text-center text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded mx-1 mb-2">
                Mostrando {visibleLeads.length} de {column.leads.length} leads
                <br />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadMoreLeads}
                  className="text-xs mt-1 h-6"
                >
                  Carregar mais
                </Button>
              </div>
            )}
            
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
