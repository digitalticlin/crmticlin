// Componentes DnD Kanban - Sistema moderno de drag & drop
export { DndKanbanWrapper } from './DndKanbanWrapper';
export { DndDropZone } from './DndDropZone';
export { DndDraggableCard } from './DndDraggableCard';

// Estilos CSS
import './dnd-kanban.css';

// Hook personalizado
export { useDndKanban } from '../../hooks/dnd/useDndKanban';

// Types para TypeScript
export interface DndKanbanItem {
  id: string;
  columnId: string;
  [key: string]: any;
}

export interface DndKanbanColumn {
  id: string;
  title: string;
  items: DndKanbanItem[];
  [key: string]: any;
}