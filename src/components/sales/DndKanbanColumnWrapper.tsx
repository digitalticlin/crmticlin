import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DndDropZone } from '@/components/dnd';
import { DndLeadCardWrapper } from './DndLeadCardWrapper';
import { KanbanColumn as KanbanColumnType, KanbanLead } from '@/types/kanban';
import { MassSelectionReturn } from '@/hooks/useMassSelection';
import { AIToggleSwitchEnhanced } from './ai/AIToggleSwitchEnhanced';
import { useAIStageControl } from '@/hooks/salesFunnel/useAIStageControl';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndSortableLeadCard } from './DndSortableLeadCard';
import { useInfiniteScroll } from '@/hooks/salesFunnel/useInfiniteScroll';
import { useStageLeadCount } from '@/hooks/salesFunnel/stages/useStageLeadCount';
import { useStageInfiniteScroll } from '@/hooks/salesFunnel/stages/useStageInfiniteScroll';
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
  funnelId?: string | null;
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
  funnelId,
  enableDnd = false,
  className
}) => {
  const { toggleAI, isLoading: isTogglingAI, canToggleAI } = useAIStageControl();

  // Hook para contar total de leads na etapa no banco de dados
  const { getStageCount } = useStageLeadCount({
    funnelId,
    enabled: !!funnelId
  });

  // ✅ HOOK ISOLADO para scroll infinito por etapa - carrega dados do servidor
  const {
    leads: stageLeads,
    isLoading: isLoadingStageLeads,
    isFetchingNextPage,
    hasNextPage,
    loadMore: loadMoreFromServer
  } = useStageInfiniteScroll({
    stageId: column.id,
    funnelId,
    enabled: !!funnelId && !!column.id,
    pageSize: 20 // 20 leads por página
  });

  // Estado para scroll infinito local (apenas visual) - mantido para compatibilidade
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
  // ✅ NOVA LÓGICA: Usar leads do hook isolado ou fallback para leads da coluna
  const leadsToShow = stageLeads.length > 0 ? stageLeads : column.leads;
  const visibleLeads = leadsToShow.slice(0, visibleCount);
  const hasMoreLeadsLocal = leadsToShow.length > visibleCount;

  // ✅ NOVA FUNÇÃO: Carregar mais leads do servidor OU mostrar mais leads locais
  const loadMoreLeads = useCallback(async () => {
    console.log('[DndKanbanColumnWrapper] 📜 Carregando mais leads:', {
      currentVisible: visibleCount,
      stageLeadsFromServer: stageLeads.length,
      columnLeadsLocal: column.leads.length,
      hasNextPageServer: hasNextPage,
      columnTitle: column.title
    });

    // Prioridade 1: Se há mais páginas no servidor, carregar do servidor
    if (hasNextPage && !isFetchingNextPage) {
      console.log('[DndKanbanColumnWrapper] 🌐 Carregando próxima página do servidor...');
      loadMoreFromServer();
    }
    // Prioridade 2: Se não há mais no servidor mas temos leads locais não mostrados
    else if (hasMoreLeadsLocal) {
      console.log('[DndKanbanColumnWrapper] 📄 Mostrando mais leads locais...');
      await new Promise(resolve => setTimeout(resolve, 200));
      setVisibleCount(prevCount =>
        Math.min(prevCount + LEADS_PER_PAGE, leadsToShow.length)
      );
    }
  }, [visibleCount, stageLeads.length, column.leads.length, column.title, hasNextPage, isFetchingNextPage, loadMoreFromServer, hasMoreLeadsLocal, leadsToShow.length]);

  // Hook de scroll infinito
  const hasMoreLeads = hasNextPage || hasMoreLeadsLocal;
  const infiniteScroll = useInfiniteScroll({
    hasMore: hasMoreLeads,
    onLoadMore: loadMoreLeads,
    threshold: 100,
    rootMargin: '0px 0px 100px 0px'
  });

  // Reset scroll infinito quando os leads da fonte principal mudam drasticamente
  useEffect(() => {
    const currentLeadsCount = leadsToShow.length;
    // Se o total de leads mudou significativamente ou se temos menos leads do que estamos mostrando
    if (currentLeadsCount < visibleCount) {
      console.log('[DndKanbanColumnWrapper] 🔄 Resetando scroll infinito - leads alterados:', {
        leadsFromServer: stageLeads.length,
        leadsFromColumn: column.leads.length,
        totalLeadsToShow: currentLeadsCount,
        visibleCount,
        columnTitle: column.title
      });
      setVisibleCount(Math.min(LEADS_PER_PAGE, currentLeadsCount));
    }
  }, [leadsToShow.length, stageLeads.length, column.leads.length, visibleCount, column.title]);

  // IDs dos leads para o SortableContext
  const leadIds = visibleLeads.map(lead => lead.id);

  // Calcular valor total em negociação com useMemo para evitar recálculos
  const totalValue = useMemo(() => {
    return column.leads.reduce((sum, lead) => {
      const value = lead.purchase_value || lead.purchaseValue || 0;
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      return sum + (isNaN(numericValue) ? 0 : numericValue);
    }, 0);
  }, [column.leads]);

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
              {getStageCount(column.id)}
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
        
        {/* Sentinel para scroll infinito - ATUALIZADO com novo hook */}
        {hasMoreLeads && (
          <div
            ref={infiniteScroll.sentinelRef}
            className="p-4 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2"
          >
            {(infiniteScroll.isLoading || isFetchingNextPage) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-blue-600">
                  {isFetchingNextPage ? 'Buscando no servidor...' : 'Carregando mais leads...'}
                </span>
              </>
            ) : (
              <>
                <div className="text-gray-400">
                  {visibleCount} de {leadsToShow.length} leads
                  {hasNextPage && ' (+ mais no servidor)'}
                </div>
                <div className="text-xs text-gray-300">
                  Role para carregar mais
                </div>
              </>
            )}
          </div>
        )}
        
        {leadsToShow.length === 0 && !isLoadingStageLeads && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 opacity-50">
                📋
              </div>
              Nenhum lead nesta etapa
            </div>
          </div>
        )}

        {isLoadingStageLeads && leadsToShow.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            <div className="text-center">
              <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-blue-500" />
              <div>Carregando leads...</div>
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