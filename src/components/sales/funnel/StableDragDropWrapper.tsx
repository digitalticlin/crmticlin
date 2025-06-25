
import { ReactNode } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erro no sistema de arrastar e soltar
            </h3>
            <p className="text-gray-600">
              Recarregue a página para restaurar a funcionalidade
            </p>
          </div>
        </div>
      }
    >
      <DragDropContext
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {children}
      </DragDropContext>
    </ErrorBoundary>
  );
};
