
import { useCallback, useMemo } from "react";
import { KanbanLead } from "@/types/kanban";

interface UseDragHandlersOptimizedProps {
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
}

export const useDragHandlersOptimized = ({
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel
}: UseDragHandlersOptimizedProps) => {
  
  // Handlers estáveis memoizados para evitar re-renders
  const createLeadDetailHandler = useCallback((lead: KanbanLead) => {
    return () => onOpenLeadDetail(lead);
  }, [onOpenLeadDetail]);

  const createChatHandler = useCallback((lead: KanbanLead) => {
    return onOpenChat ? () => onOpenChat(lead) : undefined;
  }, [onOpenChat]);

  const createWonHandler = useCallback((lead: KanbanLead) => {
    return onMoveToWonLost ? () => onMoveToWonLost(lead, "won") : undefined;
  }, [onMoveToWonLost]);

  const createLostHandler = useCallback((lead: KanbanLead) => {
    return onMoveToWonLost ? () => onMoveToWonLost(lead, "lost") : undefined;
  }, [onMoveToWonLost]);

  const createReturnHandler = useCallback((lead: KanbanLead) => {
    return onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined;
  }, [onReturnToFunnel]);

  // Cache de handlers por lead ID para evitar recriações
  const handlerCache = useMemo(() => new Map(), []);

  const getOptimizedHandlers = useCallback((lead: KanbanLead) => {
    const cacheKey = `${lead.id}-${lead.columnId}`;
    
    if (!handlerCache.has(cacheKey)) {
      handlerCache.set(cacheKey, {
        onDetailClick: createLeadDetailHandler(lead),
        onChatClick: createChatHandler(lead),
        onWonClick: createWonHandler(lead),
        onLostClick: createLostHandler(lead),
        onReturnClick: createReturnHandler(lead)
      });
    }

    return handlerCache.get(cacheKey);
  }, [
    handlerCache,
    createLeadDetailHandler,
    createChatHandler,
    createWonHandler,
    createLostHandler,
    createReturnHandler
  ]);

  return { getOptimizedHandlers };
};
