
import React from "react";
import { createPortal } from "react-dom";
import { CardClone } from "./CardClone";
import { useDragClone } from "@/hooks/kanban/useDragClone";

interface DragCloneLayerProps {
  cloneState: ReturnType<typeof useDragClone>['cloneState'];
}

export const DragCloneLayer = ({ cloneState }: DragCloneLayerProps) => {
  // Só renderizar se estiver visível e tiver lead
  if (!cloneState.isVisible || !cloneState.lead) {
    return null;
  }

  console.log('[DragCloneLayer] 🎯 Renderizando clone na posição:', cloneState.position);

  // Usar portal para renderizar fora da hierarquia normal
  return createPortal(
    <CardClone 
      lead={cloneState.lead} 
      position={cloneState.position} 
      size={cloneState.size}
    />,
    document.body
  );
};
