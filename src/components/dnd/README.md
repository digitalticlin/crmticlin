# 🎯 Sistema DnD Kanban Moderno

Sistema de drag & drop para Kanban boards usando **@dnd-kit** - moderno, leve e com UX premium.

## ✨ Características

- ✅ **Auto-scroll horizontal** inteligente
- ✅ **Performance otimizada** (~10KB vs ~100KB)
- ✅ **Compatível React 18+**
- ✅ **Acessibilidade nativa**
- ✅ **Visual feedback** rico
- ✅ **TypeScript completo**
- ✅ **CSS modular isolado**

## 🚀 Uso Básico

```tsx
import { 
  DndKanbanWrapper, 
  DndDropZone, 
  DndDraggableCard,
  useDndKanban 
} from '@/components/dnd';

function MyKanban() {
  const { columns, handleDragEnd } = useDndKanban({
    initialColumns: myColumns,
    onItemMove: (itemId, fromCol, toCol, index) => {
      // Salvar no backend
    }
  });

  return (
    <DndKanbanWrapper onDragEnd={handleDragEnd}>
      {columns.map(column => (
        <DndDropZone key={column.id} id={column.id}>
          {column.items.map(item => (
            <DndDraggableCard key={item.id} id={item.id}>
              <MyCard item={item} />
            </DndDraggableCard>
          ))}
        </DndDropZone>
      ))}
    </DndKanbanWrapper>
  );
}
```

## 🏗️ Componentes

### `DndKanbanWrapper`
Container principal com auto-scroll.

```tsx
<DndKanbanWrapper 
  onDragEnd={handleDragEnd}
  className="custom-styles"
>
  {children}
</DndKanbanWrapper>
```

### `DndDropZone` 
Zona droppable (colunas).

```tsx
<DndDropZone 
  id="column-1"
  className="min-h-[400px]"
  disabled={false}
>
  {cards}
</DndDropZone>
```

### `DndDraggableCard`
Card arrastável.

```tsx
<DndDraggableCard 
  id="card-1"
  data={cardData}
  disabled={false}
>
  <MyCardContent />
</DndDraggableCard>
```

## 🎨 Estados Visuais

| Estado | Descrição | Visual |
|--------|-----------|--------|
| **Normal** | Card em repouso | Transparente, hover suave |
| **Dragging** | Sendo arrastado | Sombra azul, rotação 3° |
| **Ghost** | Posição original | Opacity 30%, padrão pontilhado |
| **Drop Active** | Zona disponível | Borda azul tracejada |
| **Drop Over** | Hover na zona | Animação de pulse |

## 🔄 Auto-Scroll

O sistema detecta automaticamente quando o cursor se aproxima das bordas:

- **100px da esquerda** → Scroll automático para esquerda
- **100px da direita** → Scroll automático para direita
- **Indicadores visuais** → Setas e sombras azuis
- **Performance otimizada** → requestAnimationFrame

## 🛠️ Hook `useDndKanban`

```tsx
const {
  columns,          // Estado atual das colunas
  setColumns,       // Setter manual (se necessário)
  handleDragEnd,    // Handler principal
  moveItem,         // Mover item programaticamente
  addItem,          // Adicionar novo item
  removeItem,       // Remover item
  updateItem        // Atualizar item
} = useDndKanban({
  initialColumns,   // Dados iniciais
  onItemMove,       // Callback de movimento
  onColumnReorder   // Callback reordenação coluna (futuro)
});
```

## 🎯 Integração com Projeto Atual

### 1. Substituir imports atuais:
```tsx
// ❌ Antes
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// ✅ Depois  
import { DndKanbanWrapper, DndDropZone, DndDraggableCard } from '@/components/dnd';
```

### 2. Atualizar componente LeadCard:
```tsx
// No KanbanColumn
<DndDropZone id={column.id}>
  {leads.map(lead => (
    <DndDraggableCard key={lead.id} id={lead.id} data={lead}>
      <LeadCard 
        lead={lead}
        // Remover props: provided, isDragging, etc.
      />
    </DndDraggableCard>
  ))}
</DndDropZone>
```

### 3. Atualizar KanbanBoard:
```tsx
// Substituir StableDragDropWrapper
<DndKanbanWrapper onDragEnd={handleDragEnd}>
  <BoardContentOptimized columns={columns} />
</DndKanbanWrapper>
```

## 🎨 Customização CSS

O CSS está isolado em `dnd-kanban.css` com classes específicas:
- `.dnd-draggable-card`
- `.dnd-drop-zone` 
- `.kanban-dnd-container`
- `.drag-card--dragging`
- `.drop-zone--over`

## 📱 Responsivo & Acessibilidade

- ✅ Touch/mobile suportado
- ✅ Navegação por teclado
- ✅ Screen readers
- ✅ `prefers-reduced-motion`
- ✅ Focus states adequados

## 🔧 Configuração

Ajustar configurações em `DndKanbanWrapper.tsx`:

```tsx
const SCROLL_CONFIG = {
  triggerZone: 100,     // Zona de trigger (px)
  scrollSpeed: 15,      // Velocidade (px/frame)
  maxScrollSpeed: 25,   // Velocidade máxima
};
```

## 🐛 Debugging

1. **Verificar console** para logs de movimento
2. **Data attributes** nos elementos: `data-draggable-id`, `data-drop-zone-id`
3. **CSS classes dinâmicas** para inspecionar estados

## 🚀 Performance

- **Lightweight**: ~10KB total
- **Zero deps extras**: Usa apenas @dnd-kit
- **requestAnimationFrame**: Scroll otimizado
- **Memoização**: Componentes otimizados

---

**Pronto para usar!** 🎉

Sistema completamente isolado e pronto para substituir o react-beautiful-dnd.