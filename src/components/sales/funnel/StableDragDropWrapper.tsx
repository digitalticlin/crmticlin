
import { ReactNode } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { AdvancedErrorTracker } from "./AdvancedErrorTracker";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import "@/utils/suppressDragDropWarnings";

interface StableDragDropWrapperProps {
  children: ReactNode;
  onDragStart?: () => void;
  onDragEnd?: (result: any) => void;
}

export const StableDragDropWrapper = ({ 
  children, 
  onDragStart = () => {},
  onDragEnd = () => {}
}: StableDragDropWrapperProps) => {
  console.log('[StableDragDropWrapper] 🔄 Renderizando wrapper otimizado');

  const handleErrorCaptured = (error: Error, errorInfo: any) => {
    console.group('🚨 [StableDragDropWrapper] ERRO CRÍTICO CAPTURADO');
    console.error('❌ Erro no Drag and Drop Context:', error);
    console.error('🎯 Props recebidas:', { 
      hasOnDragStart: !!onDragStart,
      hasOnDragEnd: !!onDragEnd,
      childrenType: typeof children 
    });
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
          Ocorreu um erro durante a operação de arrastar e soltar. Verifique o console para mais detalhes.
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
    console.log('[StableDragDropWrapper] 🎯 Inicializando DragDropContext otimizado');
    
    return (
      <AdvancedErrorTracker 
        componentName="StableDragDropWrapper"
        fallback={dragDropErrorFallback}
        onErrorCaptured={handleErrorCaptured}
      >
        <DragDropContext
          onDragStart={(initial) => {
            console.log('[StableDragDropWrapper] 🟢 Drag iniciado:', initial);
            // Ensure body doesn't scroll during drag
            document.body.style.overflow = 'hidden';
            onDragStart();
          }}
          onDragEnd={(result) => {
            console.log('[StableDragDropWrapper] 🟢 Drag finalizado:', result);
            // Restore body scroll
            document.body.style.overflow = 'unset';
            onDragEnd(result);
          }}
        >
          {children}
        </DragDropContext>
      </AdvancedErrorTracker>
    );
  } catch (error) {
    console.error('[StableDragDropWrapper] ❌ Erro ao renderizar:', error);
    return dragDropErrorFallback;
  }
};
