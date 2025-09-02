import React from 'react';
import { 
  DndKanbanWrapper, 
  DndDropZone, 
  DndDraggableCard,
  useDndKanban,
  DndKanbanItem,
  DndKanbanColumn 
} from './index';

// Dados de exemplo
const initialColumns: DndKanbanColumn[] = [
  {
    id: 'todo',
    title: 'A Fazer',
    items: [
      { id: '1', columnId: 'todo', title: 'Tarefa 1', description: 'Descrição da tarefa 1' },
      { id: '2', columnId: 'todo', title: 'Tarefa 2', description: 'Descrição da tarefa 2' },
    ]
  },
  {
    id: 'doing',
    title: 'Fazendo',
    items: [
      { id: '3', columnId: 'doing', title: 'Tarefa 3', description: 'Descrição da tarefa 3' },
    ]
  },
  {
    id: 'done',
    title: 'Concluído',
    items: [
      { id: '4', columnId: 'done', title: 'Tarefa 4', description: 'Descrição da tarefa 4' },
    ]
  }
];

// Componente de card personalizado
const TaskCard: React.FC<{ item: DndKanbanItem }> = ({ item }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-2 group">
    <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
    <p className="text-sm text-gray-600">{item.description}</p>
    
    {/* Tags ou badges podem ir aqui */}
    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
      <span>#{item.id}</span>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        <span>Ativo</span>
      </div>
    </div>
  </div>
);

// Componente de coluna personalizado
const KanbanColumn: React.FC<{ 
  column: DndKanbanColumn; 
  children: React.ReactNode;
}> = ({ column, children }) => (
  <div className="flex flex-col w-80 bg-gray-50 rounded-xl p-4">
    {/* Header da coluna */}
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-gray-800">{column.title}</h2>
      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
        {column.items.length}
      </span>
    </div>
    
    {/* Zona droppable */}
    <DndDropZone 
      id={column.id}
      className="flex-1 min-h-[400px] space-y-2"
    >
      {children}
    </DndDropZone>
    
    {/* Botão adicionar (opcional) */}
    <button className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Adicionar card
    </button>
  </div>
);

// Componente principal do exemplo
export const KanbanExample: React.FC = () => {
  const { columns, handleDragEnd } = useDndKanban({
    initialColumns,
    onItemMove: (itemId, fromColumnId, toColumnId, newIndex) => {
      console.log(`Item ${itemId} movido de ${fromColumnId} para ${toColumnId} na posição ${newIndex}`);
    }
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Kanban com @dnd-kit
        </h1>
        <p className="text-gray-600">
          Sistema moderno de drag & drop com auto-scroll horizontal
        </p>
      </div>

      <DndKanbanWrapper 
        onDragEnd={handleDragEnd}
        className="pb-6"
      >
        <div className="flex gap-6 min-w-max">
          {columns.map(column => (
            <KanbanColumn key={column.id} column={column}>
              {column.items.map(item => (
                <DndDraggableCard
                  key={item.id}
                  id={item.id}
                  data={item}
                >
                  <TaskCard item={item} />
                </DndDraggableCard>
              ))}
            </KanbanColumn>
          ))}
        </div>
      </DndKanbanWrapper>
    </div>
  );
};

export default KanbanExample;