
import { ReactNode, useEffect } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { AdvancedErrorTracker } from "./AdvancedErrorTracker";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@/utils/suppressDragDropWarnings";

interface StableDragDropWrapperProps {
  children: ReactNode;
  onDragStart?: (initial: any) => void;
  onDragEnd?: (result: any) => void;
}

export const StableDragDropWrapper = ({ 
  children, 
  onDragStart = () => {},
  onDragEnd = () => {}
}: StableDragDropWrapperProps) => {
  console.log('[StableDragDropWrapper] 🔄 RADICAL - Wrapper otimizado com clone visual');

  // Rastrear posição do clique inicial
  useEffect(() => {
    let initialClickOffset: { x: number; y: number } | null = null;
    
    const handleMouseDown = (e: MouseEvent) => {
      // Salvar posição do clique
      (window as any).__lastMouse = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const draggingCard = document.querySelector('[data-rbd-drag-handle-dragging="true"]') as HTMLElement;
      if (draggingCard) {
        // Calcular offset apenas na primeira vez
        if (!initialClickOffset) {
          const rect = draggingCard.getBoundingClientRect();
          const lastMouse = (window as any).__lastMouse;
          if (lastMouse) {
            initialClickOffset = {
              x: lastMouse.x - rect.left,
              y: lastMouse.y - rect.top
            };
          }
        }
        
        // Manter card na posição do clique
        if (initialClickOffset) {
          draggingCard.style.left = `${e.clientX - initialClickOffset.x}px`;
          draggingCard.style.top = `${e.clientY - initialClickOffset.y}px`;
          draggingCard.style.position = 'fixed';
          draggingCard.style.zIndex = '99999';
        }
      } else {
        // Reset quando drag termina
        initialClickOffset = null;
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // AUTO-SCROLL APENAS DURANTE DRAG AND DROP
  const handleGlobalMouseMove = (ev: MouseEvent) => {
    // Verificar se há um elemento sendo arrastado
    const isDragging = document.body.classList.contains('rbd-dragging');
    if (!isDragging) return;

    const scrollContainer = document.querySelector('[data-kanban-board]') as HTMLElement;
    if (!scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const threshold = 100; // Pixels da borda para ativar auto-scroll
    const scrollSpeed = 15;

    // Auto-scroll horizontal
    if (ev.clientX < containerRect.left + threshold) {
      // Scroll para esquerda
      scrollContainer.scrollLeft -= scrollSpeed;
    } else if (ev.clientX > containerRect.right - threshold) {
      // Scroll para direita
      scrollContainer.scrollLeft += scrollSpeed;
    }
  };

  const handleErrorCaptured = (error: Error, errorInfo: any) => {
    console.group('🚨 [StableDragDropWrapper] ERRO CRÍTICO CAPTURADO');
    console.error('❌ Erro no Drag and Drop Context:', error);
    console.error('📊 ErrorInfo:', errorInfo);
    console.groupEnd();
  };

  const dragDropErrorFallback = (
    <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-dashed border-red-300 p-6">
      <div className="text-center space-y-4">
        <div className="text-red-600">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-900">
          Erro no Sistema de Drag and Drop
        </h3>
        <p className="text-red-700 text-sm max-w-md">
          Ocorreu um erro durante a operação de arrastar e soltar.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar Página
          </Button>
        </div>
      </div>
    </div>
  );

  try {
    console.log('[StableDragDropWrapper] 🎯 RADICAL - Inicializando DragDropContext com clone visual');
    
    return (
      <AdvancedErrorTracker 
        componentName="StableDragDropWrapper"
        fallback={dragDropErrorFallback}
        onErrorCaptured={handleErrorCaptured}
      >
        <DragDropContext
          onDragStart={(initial) => {
            console.log('[StableDragDropWrapper] 🟢 Drag iniciado:', initial.draggableId);
            
            // Configurar ambiente básico para drag
            const body = document.body;
            body.style.userSelect = 'none';
            body.style.cursor = 'grabbing';
            body.classList.add('rbd-dragging');
            
            // Auto-scroll durante drag
            window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
            
            onDragStart(initial);
          }}
          onDragEnd={(result) => {
            console.log('[StableDragDropWrapper] 🟢 Drag finalizado:', result.draggableId, '->', result.destination?.droppableId);
            
            // Restaurar comportamento da página
            const body = document.body;
            body.style.userSelect = '';
            body.style.cursor = '';
            body.classList.remove('rbd-dragging');
            
            // Remover listener de auto-scroll
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            
            onDragEnd(result);
          }}
          onDragUpdate={() => { 
            // Mantido simples - auto-scroll via mousemove apenas
          }}
        >
          {children}
          
          {/* Clone customizado removido - usando apenas o nativo */}
        </DragDropContext>
      </AdvancedErrorTracker>
    );
  } catch (error) {
    console.error('[StableDragDropWrapper] ❌ Erro ao renderizar:', error);
    return dragDropErrorFallback;
  }
};
