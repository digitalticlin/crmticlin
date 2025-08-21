import React, { useRef, useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StageCard } from './StageCard';
import { KanbanStage } from '@/types';
import { useKanbanStore } from '@/store/kanbanStore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUpdateKanbanStageMutation } from '@/hooks/sales/useKanbanStages';
import { Skeleton } from '@/components/ui/skeleton';

interface BoardContentProps {
  stage: KanbanStage;
  index: number;
}

export function BoardContentOptimized({ stage, index }: BoardContentProps) {
  const { user } = useAuth();
  const { items, setItemStage } = useKanbanStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const { mutate: updateStage, isLoading: isUpdating } = useUpdateKanbanStageMutation();

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({
    id: stage.id,
    data: {
      stage
    },
    disabled: isScrolling
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const scrollAmount = e.deltaY * 0.5; // Adjust scroll speed here
      container.scrollLeft += scrollAmount;
      setScrollLeft(container.scrollLeft);
    };

    const container = containerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [isMounted]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    setScrollLeft(container.scrollLeft);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Fix: Use React.PointerEvent instead of native PointerEvent
    e.preventDefault();
    setIsDragging(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsScrolling(false);
    setScrollSpeed(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    // Adjust sensitivity and activation threshold as needed
    const speedX = dx * 0.1; // Reduced sensitivity
    const speedY = dy * 0.1; // Reduced sensitivity

    // Check if the drag is primarily horizontal
    if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
      setIsScrolling(true);
      setScrollSpeed(speedX);
      container.scrollLeft -= speedX;
    } else {
      setIsScrolling(false);
      setScrollSpeed(0);
    }
  };

  const stageItems = items.filter((item) => item.kanban_stage_id === stage.id);

  const updateStageTitle = async (newTitle: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    updateStage({
      id: stage.id,
      title: newTitle,
      created_by_user_id: user.id,
      funnel_id: stage.funnel_id,
      order_position: stage.order_position
    });
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      style={style}
      className="kanban-column"
      {...attributes}
    >
      <StageCard
        stage={stage}
        listeners={listeners}
        isUpdating={isUpdating}
        updateStageTitle={updateStageTitle}
      />
      <div
        className="board-content"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onScroll={handleScroll}
      >
        {stageItems.length === 0 && !isDragging ? (
          <p className="text-center text-gray-500 p-4">
            Arraste os cards para cá
          </p>
        ) : (
          stageItems.map((item) => (
            <div key={item.id}>
              <KanbanItem id={item.id} item={item} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanItemProps {
  id: string;
  item: any;
}

import { useSortable as useDndKitSortable } from '@dnd-kit/sortable';
import { CSS as DndKitCSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, MessageSquare, PhoneCall, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton as ItemSkeleton } from '@/components/ui/skeleton';
import { useLead } from '@/hooks/leads/useLead';
import { useNavigate } from 'react-router-dom';

function KanbanItem({ id, item }: KanbanItemProps) {
  const navigate = useNavigate();
  const { lead, isLoading } = useLead(item.id);
  const { setDraggingItem } = useKanbanStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useDndKitSortable({
    id: id,
    data: {
      item
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/clients/${item.id}`);
  };

  if (isLoading || !lead) {
    return (
      <div className="kanban-item" style={style} ref={setNodeRef} {...attributes} {...listeners}>
        <ItemSkeleton />
      </div>
    );
  }

  return (
    <div
      className="kanban-item"
      style={style}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleItemClick}
    >
      <div className="flex items-center space-x-2">
        <Avatar>
          <AvatarImage src={lead?.avatar_url} />
          <AvatarFallback>{lead?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">{lead?.name}</p>
          <p className="text-sm text-muted-foreground">
            {lead?.phone}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-1">
          {lead?.funnel?.name && (
            <Badge variant="secondary">
              {lead?.funnel?.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-gray-500" />
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <PhoneCall className="h-4 w-4 text-gray-500" />
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {lead?.last_message && (
          <p className="truncate">
            {lead?.last_message}
          </p>
        )}
        <p>
          {lead?.last_message_time && format(new Date(lead?.last_message_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
