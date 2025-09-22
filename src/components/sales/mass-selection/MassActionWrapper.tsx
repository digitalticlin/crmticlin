import { ReactElement, cloneElement } from "react";
import { MassSelectionCoordinatedReturn } from "@/hooks/useMassSelectionCoordinated";
import { KanbanLead } from "@/types/kanban";

interface MassActionWrapperProps {
  children: ReactElement;
  massSelection: MassSelectionCoordinatedReturn;
  onSuccess: () => void;
}

export const MassActionWrapper = ({ children, massSelection, onSuccess }: MassActionWrapperProps) => {
  // Verificar se massSelection está definido
  if (!massSelection) {
    console.error('[MassActionWrapper] ❌ massSelection é undefined');
    return children;
  }

  const { clearSelection, exitSelectionMode } = massSelection;

  const handleSuccess = async () => {
    // Limpar seleções e sair do modo seleção
    clearSelection();
    exitSelectionMode();
    
    // Executar callback original
    await onSuccess();
  };

  // Não passar onSuccess para elementos DOM nativos (div)
  // Apenas para componentes React que esperam essa prop
  if (typeof children.type === 'string') {
    // É um elemento DOM nativo (div, span, etc.) - não passar onSuccess
    return children;
  }

  return cloneElement(children, {
    ...children.props,
    onSuccess: handleSuccess
  });
};