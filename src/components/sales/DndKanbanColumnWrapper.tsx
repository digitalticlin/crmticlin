import React, { useState, useCallback, useEffect } from 'react';
import { DndDropZone } from '@/components/dnd';
import { DndLeadCardWrapper } from './DndLeadCardWrapper';
import { KanbanColumn as KanbanColumnType, KanbanLead } from '@/types/kanban';
import { MassSelectionReturn } from '@/hooks/useMassSelection';
import { AIToggleSwitchEnhanced } from './ai/AIToggleSwitchEnhanced';
import { useAIStageControl } from '@/hooks/salesFunnel/useAIStageControl';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndSortableLeadCard } from './DndSortableLeadCard';
import { useInfiniteScroll } from '@/hooks/salesFunnel/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

interface DndKanbanColumnWrapperProps {
  column: KanbanColumnType;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: 'won' | 'lost') => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionReturn;
  // Novo sistema DnD
  enableDnd?: boolean;
  className?: string;
}

/**
 * Wrapper para KanbanColumn que suporta o novo sistema @dnd-kit
 * Mantém compatibilidade total com funcionalidades existentes
 */
const LEADS_PER_PAGE = 30; // Paginação otimizada para escalabilidade

export const DndKanbanColumnWrapper: React.FC<DndKanbanColumnWrapperProps> = ({
  column,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection,
  enableDnd = false,
  className
}) => {
  const { toggleAI, isLoading: isTogglingAI, canToggleAI } = useAIStageControl();
  
  // Estado para scroll infinito - inicia com 30 leads
  const [visibleCount, setVisibleCount] = useState(LEADS_PER_PAGE);

  // Verificar se é etapa GANHO ou PERDIDO (não devem ter controle de IA)
  const isWonLostStage = column.title === "GANHO" || column.title === "PERDIDO";

  // Handler para toggle AI
  const handleAIToggle = (enabled: boolean) => {
    console.log('[DndKanbanColumnWrapper] 🎛️ Toggle AI:', {
      columnId: column.id,
      columnTitle: column.title,
      currentEnabled: column.ai_enabled === true,
      newEnabled: enabled
    });
    
    if (!isWonLostStage) {
      toggleAI(column.id, column.ai_enabled === true);
    }
  };
  // Lógica de scroll infinito
  const visibleLeads = column.leads.slice(0, visibleCount);
  const hasMoreLeads = column.leads.length > visibleCount;
  
  // Função para carregar mais leads
  const loadMoreLeads = useCallback(async () => {
    console.log('[DndKanbanColumnWrapper] 📜 Carregando mais leads:', {
      currentVisible: visibleCount,
      totalLeads: column.leads.length,
      columnTitle: column.title
    });
    
    // Simular pequeno delay para UX
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setVisibleCount(prevCount => 
      Math.min(prevCount + LEADS_PER_PAGE, column.leads.length)
    );
  }, [visibleCount, column.leads.length, column.title]);

  // Hook de scroll infinito
  const infiniteScroll = useInfiniteScroll({
    hasMore: hasMoreLeads,
    onLoadMore: loadMoreLeads,
    threshold: 100,
    rootMargin: '0px 0px 100px 0px'
  });

  // Reset scroll infinito quando os leads da coluna mudam drasticamente
  useEffect(() => {
    // Se o total de leads mudou significativamente ou se temos menos leads do que estamos mostrando
    if (column.leads.length < visibleCount) {
      console.log('[DndKanbanColumnWrapper] 🔄 Resetando scroll infinito - leads alterados:', {
        totalLeads: column.leads.length,
        visibleCount,
        columnTitle: column.title
      });
      setVisibleCount(Math.min(LEADS_PER_PAGE, column.leads.length));
    }
  }, [column.leads.length, visibleCount, column.title]);

  // IDs dos leads para o SortableContext
  const leadIds = visibleLeads.map(lead => lead.id);

  // Calcular valor total em negociação
  const totalValue = column.leads.reduce((sum, lead) => {
    // Tentar ambas as propriedades: purchase_value e purchaseValue
    const value = lead.purchase_value || lead.purchaseValue || 0;
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return sum + (isNaN(numericValue) ? 0 : numericValue);
  }, 0);

  console.log(`[DndKanbanColumnWrapper] 💰 Calculando valor total para ${column.title}:`, {
    leadsCount: column.leads.length,
    totalValue,
    leadsSample: column.leads.slice(0, 3).map(l => ({
      id: l.id,
      name: l.name,
      purchase_value: l.purchase_value,
      purchaseValue: l.purchaseValue
    }))
  });

  const renderLeadCard = (lead: KanbanLead, index: number) => (
    <DndSortableLeadCard
      key={lead.id}
      lead={lead}
      onOpenLeadDetail={onOpenLeadDetail}
      onOpenChat={onOpenChat}
      onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(lead, 'won') : undefined}
      onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(lead, 'lost') : undefined}
      onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
      isWonLostView={isWonLostView}
      wonStageId={wonStageId}
      lostStageId={lostStageId}
      massSelection={massSelection}
      enableDnd={enableDnd}
      className="mb-2"
    />
  );

  // Conteúdo da coluna
  const columnContent = (
    <div className="flex flex-col h-full">
      {/* Header da coluna - aparência original */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <h3 
              className="text-sm font-medium text-gray-900 truncate"
              style={{ color: column.color }}
            >
              {column.title}
            </h3>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              {column.leads.length}
            </span>
          </div>
          
        </div>
        
        {/* Toggle de IA - Não mostrar para etapas GANHO e PERDIDO */}
        {!isWonLostStage && (
          <AIToggleSwitchEnhanced
            enabled={column.ai_enabled === true}
            onToggle={handleAIToggle}
            isLoading={isTogglingAI}
            disabled={!canToggleAI}
            size="sm"
            variant="compact"
            showLabel={true}
            className="flex-shrink-0"
          />
        )}
      </div>

      {/* Color bar - aparência original */}
      <div
        className="h-1 rounded-full mb-2 mx-1"
        style={{ backgroundColor: column.color || "#e0e0e0" }}
      />

      {/* Lista de leads com SortableContext - aparência original */}
      <div
        className="flex-1 rounded-xl px-0.5 pt-1 pb-0 kanban-column-scrollbar overflow-y-auto overflow-x-hidden"
        style={{
          minHeight: "400px",
          maxHeight: "calc(100svh - 190px)",
          scrollbarColor: "#ffffff66 transparent"
        }}
      >
        {enableDnd ? (
          <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
            {visibleLeads.map((lead, index) => renderLeadCard(lead, index))}
          </SortableContext>
        ) : (
          visibleLeads.map((lead, index) => renderLeadCard(lead, index))
        )}
        
        {/* Sentinel para scroll infinito */}
        {hasMoreLeads && (
          <div 
            ref={infiniteScroll.sentinelRef}
            className="p-4 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2"
          >
            {infiniteScroll.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-blue-600">Carregando mais leads...</span>
              </>
            ) : (
              <>
                <div className="text-gray-400">
                  {visibleCount} de {column.leads.length} leads
                </div>
                <div className="text-xs text-gray-300">
                  Role para carregar mais
                </div>
              </>
            )}
          </div>
        )}
        
        {column.leads.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 opacity-50">
                📋
              </div>
              Nenhum lead nesta etapa
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar valor em negociação acima da coluna
  const valueDisplay = (
    <div className="mb-2 text-center px-2">
      <div className="text-sm font-medium text-black">
        💰 Em negociação: {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(totalValue)}
      </div>
    </div>
  );

  // Se DnD habilitado, envolver em DndDropZone (aparência original)
  if (enableDnd) {
    return (
      <div className="flex flex-col">
        {valueDisplay}
        <DndDropZone 
          id={`column-${column.id}`}
          className={`bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl px-1.5 pt-1.5 pb-0 min-w-[300px] w-[300px] flex flex-col h-full transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg ${className || ''}`}
        >
          {columnContent}
        </DndDropZone>
      </div>
    );
  }

  // Sem DnD - renderização normal (aparência original)
  return (
    <div className="flex flex-col">
      {valueDisplay}
      <div className={`bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl px-1.5 pt-1.5 pb-0 min-w-[300px] w-[300px] flex flex-col h-full transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg ${className || ''}`}>
        {columnContent}
      </div>
    </div>
  );
};