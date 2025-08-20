import { ReactElement, cloneElement } from "react";
import { MassSelectionReturn } from "@/hooks/useMassSelection";
import { KanbanLead } from "@/types/kanban";

interface MassActionWrapperProps {
  children: ReactElement;
  massSelection: MassSelectionReturn;
  onSuccess: () => void;
}

export const MassActionWrapper = ({ children, massSelection, onSuccess }: MassActionWrapperProps) => {
  const { clearSelection, exitSelectionMode } = massSelection;

  const handleSuccess = async () => {
    // Limpar seleções e sair do modo seleção
    clearSelection();
    exitSelectionMode();
    
    // Executar callback original
    await onSuccess();
  };

  return cloneElement(children, {
    ...children.props,
    onSuccess: handleSuccess
  });
};