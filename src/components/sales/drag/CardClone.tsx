
import React from "react";
import { KanbanLead } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { LeadCardContent } from "../lead/LeadCardContent";
import { LeadCardTags } from "../lead/LeadCardTags";

interface CardCloneProps {
  lead: KanbanLead;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}

export const CardClone = ({ lead, position, size }: CardCloneProps) => {
  return (
    <div
      className={cn(
        // Base IDÊNTICA ao card original - glassmorphism
        "bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg rounded-xl p-4",
        
        // Clone - sem efeitos pesados, aparência natural
        "opacity-100 pointer-events-none",
        
        // Sombra sutil para indicar estado de drag
        "shadow-[0_8px_16px_rgba(0,0,0,0.1)] ring-1 ring-blue-400/30",
        
        // SEM animações - performance otimizada
        "transition-none"
      )}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        // usar translate3d para performance e manter preso ao cursor
        transform: 'translate3d(0, 0, 0)',
        pointerEvents: 'none',
        width: size?.width ? `${size.width}px` : undefined,
        height: size?.height ? `${size.height}px` : undefined,
        willChange: 'transform'
      }}
    >
      {/* Glassmorphism overlay IDÊNTICO ao card original */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl pointer-events-none" />
      
      {/* Content IDÊNTICO ao card original */}
      <div className="relative z-20">
        <LeadCardContent lead={lead} isWonLostView={false} />
        
        {/* Tags Footer IDÊNTICO ao original */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/30">
          <div className="flex-1 min-w-0">
            <LeadCardTags tags={lead.tags} />
          </div>
        </div>
      </div>
    </div>
  );
};
