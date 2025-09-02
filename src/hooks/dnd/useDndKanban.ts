import { useState, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

interface KanbanItem {
  id: string;
  columnId: string;
  [key: string]: any;
}

interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  [key: string]: any;
}

interface UseDndKanbanProps {
  initialColumns: KanbanColumn[];
  onItemMove?: (itemId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  onColumnReorder?: (columnId: string, newIndex: number) => void;
}

interface UseDndKanbanReturn {
  columns: KanbanColumn[];
  setColumns: React.Dispatch<React.SetStateAction<KanbanColumn[]>>;
  handleDragEnd: (event: DragEndEvent) => void;
  moveItem: (itemId: string, toColumnId: string, newIndex?: number) => void;
  addItem: (item: KanbanItem, columnId: string) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<KanbanItem>) => void;
}

export const useDndKanban = ({
  initialColumns,
  onItemMove,
  onColumnReorder
}: UseDndKanbanProps): UseDndKanbanReturn => {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);

  // Encontrar item e sua coluna
  const findItemAndColumn = useCallback((itemId: string, searchColumns: KanbanColumn[] = columns) => {
    for (const column of searchColumns) {
      const itemIndex = column.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        return {
          column,
          item: column.items[itemIndex],
          index: itemIndex
        };
      }
    }
    return null;
  }, [columns]);

  // Mover item entre colunas ou dentro da mesma coluna
  const moveItem = useCallback((itemId: string, toColumnId: string, newIndex?: number) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const fromData = findItemAndColumn(itemId);
      
      if (!fromData) {
        console.warn(`Item ${itemId} não encontrado`);
        return prevColumns;
      }

      const toColumnIndex = newColumns.findIndex(col => col.id === toColumnId);
      if (toColumnIndex === -1) {
        console.warn(`Coluna ${toColumnId} não encontrada`);
        return prevColumns;
      }

      const { column: fromColumn, item, index: fromIndex } = fromData;
      const toColumn = newColumns[toColumnIndex];

      // Remover item da coluna original
      const fromColumnIndex = newColumns.findIndex(col => col.id === fromColumn.id);
      newColumns[fromColumnIndex] = {
        ...fromColumn,
        items: fromColumn.items.filter(i => i.id !== itemId)
      };

      // Atualizar columnId do item
      const updatedItem = { ...item, columnId: toColumnId };

      // Adicionar item na nova coluna
      const targetIndex = newIndex !== undefined ? newIndex : toColumn.items.length;
      const newItems = [...toColumn.items];
      newItems.splice(targetIndex, 0, updatedItem);

      newColumns[toColumnIndex] = {
        ...toColumn,
        items: newItems
      };

      // Callback para ações externas
      if (onItemMove && fromColumn.id !== toColumnId) {
        onItemMove(itemId, fromColumn.id, toColumnId, targetIndex);
      }

      return newColumns;
    });
  }, [findItemAndColumn, onItemMove]);

  // Handler principal do drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Usar as colunas mais recentes via callback
    setColumns(currentColumns => {
      const activeData = findItemAndColumn(activeId, currentColumns);
      
      if (activeData) {
        // É um item sendo movido
        const overColumn = currentColumns.find(col => col.id === overId);
        if (overColumn) {
          if (activeData.column.id === overId) {
            return currentColumns; // Mesma coluna, não fazer nada
          }
          
          // Criar novas colunas com o item movido
          const newColumns = [...currentColumns];
          
          // Remover da coluna origem
          const fromColumnIndex = newColumns.findIndex(col => col.id === activeData.column.id);
          newColumns[fromColumnIndex] = {
            ...newColumns[fromColumnIndex],
            items: newColumns[fromColumnIndex].items.filter(item => item.id !== activeId)
          };
          
          // Adicionar na coluna destino
          const toColumnIndex = newColumns.findIndex(col => col.id === overId);
          const updatedItem = { ...activeData.item, columnId: overId };
          newColumns[toColumnIndex] = {
            ...newColumns[toColumnIndex],
            items: [...newColumns[toColumnIndex].items, updatedItem]
          };
          
          // Callback para ações externas
          if (onItemMove) {
            onItemMove(activeId, activeData.column.id, overId, newColumns[toColumnIndex].items.length - 1);
          }
          
          return newColumns;
        }
      }
      
      return currentColumns;
    });
  }, [findItemAndColumn, onItemMove]);

  // Adicionar item
  const addItem = useCallback((item: KanbanItem, columnId: string) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const columnIndex = newColumns.findIndex(col => col.id === columnId);
      
      if (columnIndex === -1) return prevColumns;
      
      newColumns[columnIndex] = {
        ...newColumns[columnIndex],
        items: [...newColumns[columnIndex].items, { ...item, columnId }]
      };
      
      return newColumns;
    });
  }, []);

  // Remover item
  const removeItem = useCallback((itemId: string) => {
    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        items: column.items.filter(item => item.id !== itemId)
      }));
    });
  }, []);

  // Atualizar item
  const updateItem = useCallback((itemId: string, updates: Partial<KanbanItem>) => {
    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        items: column.items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      }));
    });
  }, []);

  return {
    columns,
    setColumns,
    handleDragEnd,
    moveItem,
    addItem,
    removeItem,
    updateItem
  };
};