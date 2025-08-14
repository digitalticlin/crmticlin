import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  PointerEvent,
} from "react";
import { useSalesFunnelContext } from "@/components/sales/funnel/SalesFunnelProvider";
import { ColumnHeader } from "@/components/sales/column/ColumnHeader";
import { ColumnContent } from "@/components/sales/column/ColumnContent";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { KanbanLead } from "@/types/kanban";
import { KanbanColumn } from "@/types/kanban";
import { DragCloneLayer } from "../drag/DragCloneLayer";
import { useDragClone } from "@/hooks/kanban/useDragClone";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyFunnel } from "./EmptyFunnel";
import { WonLostFunnel } from "./WonLostFunnel";
import { AIToggleSwitchEnhanced } from "../ai/AIToggleSwitchEnhanced";
import { useToast } from "@/components/ui/use-toast";
import { useAIColumnMutation } from "@/hooks/kanban/useAIColumnMutation";

interface BoardContentOptimizedProps {
  isWonLostView?: boolean;
}

export const BoardContentOptimized = ({ isWonLostView = false }: BoardContentOptimizedProps) => {
  const {
    loading,
    columns,
    setColumns,
    selectedFunnel,
    openLeadDetail,
    moveLeadToStage,
    refetchLeads,
    isAdmin,
    wonStageId,
    lostStageId,
    leads
  } = useSalesFunnelContext();
  const { toast } = useToast();

  // AI Column Mutation
  const {
    isAIEnabled,
    setIsAIEnabled,
    isLoadingAI,
    toggleAIColumn
  } = useAIColumnMutation();

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const { cloneState, updateClonePosition, resetClone } = useDragClone();
  const boardRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: any) => {
    setIsDragging(false);
    resetClone();

    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = columns.find((col) => col.id === source.droppableId);
    const end = columns.find((col) => col.id === destination.droppableId);

    if (!start || !end) {
      console.error("❌ Coluna de início ou fim não encontrada!");
      return;
    }

    if (start === end) {
      // Reordenação na mesma coluna (opcional, dependendo dos requisitos)
      const newLeads = Array.from(leads);
      const [removed] = newLeads.splice(source.index, 1);
      newLeads.splice(destination.index, 0, removed);

      // Atualizar o estado local (opcional)
      // setColumns(
      //   columns.map((col) =>
      //     col.id === start.id ? { ...col, leads: newLeads } : col
      //   )
      // );
      return;
    }

    // Mover o lead para outra coluna
    const leadId = draggableId;
    const targetColumnId = destination.droppableId;

    try {
      const leadToMove = leads.find((lead) => lead.id === leadId);
      if (!leadToMove) {
        console.error("❌ Lead não encontrado!");
        return;
      }

      await moveLeadToStage(leadToMove, targetColumnId);
      toast({
        title: "Lead movido!",
        description: `O lead ${leadToMove.name} foi movido para a coluna ${end.title}.`,
      });
    } catch (error) {
      console.error("❌ Erro ao mover lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao mover lead!",
        description: "Ocorreu um erro ao mover o lead. Por favor, tente novamente.",
      });
    } finally {
      await refetchLeads();
    }
  };

  const renderClone = useCallback(
    (provided: any, snapshot: any, item: any) => {
      if (!item.id) return null;

      const lead = leads.find((l) => l.id === item.draggableId);

      if (!lead) {
        console.warn(
          "[BoardContentOptimized] ⚠️ Lead não encontrado para clonar:",
          item.draggableId
        );
        return null;
      }

      return (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
        >
          {/* Renderize o clone do cartão aqui */}
          {cloneState.isVisible && cloneState.lead ? (
            cloneState.lead.name
          ) : (
            <div>Clone Indisponível</div>
          )}
        </div>
      );
    },
    [cloneState.isVisible, cloneState.lead, leads]
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Convert React.PointerEvent to native PointerEvent
    const nativeEvent = e.nativeEvent as PointerEvent;
    updateClonePosition(nativeEvent);
  };

  useEffect(() => {
    if (isDragging && boardRef.current) {
      const handlePointerDown = (e: PointerEvent) => {
        const element = e.target as HTMLElement;
        if (element && element.closest(".kanban-card")) {
          const leadId = element.closest(".kanban-card")?.id;
          if (!leadId) {
            console.warn("[BoardContentOptimized] ⚠️ Lead ID não encontrado");
            return;
          }

          const lead = leads.find((l) => l.id === leadId);
          if (!lead) {
            console.warn("[BoardContentOptimized] ⚠️ Lead não encontrado:", leadId);
            return;
          }

          updateClonePosition(e);
          cloneState.setLead(lead);
          cloneState.setIsVisible(true);
        } else {
          cloneState.setIsVisible(false);
          cloneState.setLead(null);
        }
      };

      window.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);

      return () => {
        window.removeEventListener("pointerdown", handlePointerDown);
        window.removeEventListener("pointermove", handlePointerMove);
      };
    }
  }, [isDragging, leads, updateClonePosition, cloneState]);

  if (loading) {
    return (
      <div className="flex flex-1 overflow-x-auto w-full gap-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-80 flex-shrink-0 rounded-2xl overflow-hidden">
            <Skeleton className="h-10 w-full rounded-t-2xl" />
            <div className="flex-1 flex flex-col">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-24 w-full my-2 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!selectedFunnel) {
    return <EmptyFunnel />;
  }

  if (isWonLostView) {
    return <WonLostFunnel />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI Toggle (apenas para administradores) */}
      {isAdmin && (
        <div className="flex justify-end items-center p-4 bg-gray-100/50 backdrop-blur-sm rounded-t-2xl border-b border-gray-200/50">
          <AIToggleSwitchEnhanced
            enabled={isAIEnabled}
            onToggle={toggleAIColumn}
            isLoading={isLoadingAI}
            size="md"
            variant="prominent"
            label="IA Colunas"
            showLabel={true}
          />
        </div>
      )}

      <div
        className="flex flex-1 overflow-x-auto gap-4 p-4"
        ref={boardRef}
        style={{
          minHeight: "200px",
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          {columns.map((column) => (
            <div
              key={column.id}
              className="w-80 flex-shrink-0 rounded-2xl overflow-hidden flex flex-col"
            >
              <ColumnHeader column={column} />
              <ColumnContent
                columnId={column.id}
                leads={leads.filter((lead) => lead.stage_id === column.id)}
                onOpenLeadDetail={openLeadDetail}
                renderClone={renderClone}
                wonStageId={wonStageId}
                lostStageId={lostStageId}
              />
            </div>
          ))}
        </DragDropContext>
      </div>

      <DragCloneLayer cloneState={cloneState} />
    </div>
  );
};
