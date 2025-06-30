
import React from "react";
import { KanbanLead } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { LeadCardContent } from "../lead/LeadCardContent";
import { LeadCardTags } from "../lead/LeadCardTags";

interface CardCloneProps {
  lead: KanbanLead;
  position: { x: number; y: number };
}

export const CardClone = ({ lead, position }: CardCloneProps) => {
  return (
    <div
      className={cn(
        // Base do clone - estilo glassmórfico mais transparente
        "bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-xl p-4",
        "w-[380px] max-w-[380px]",
        
        // Efeito de clone - mais transparente e elevado
        "opacity-90 scale-105 pointer-events-none",
        
        // Sombra e efeitos especiais para clone
        "shadow-[0_20px_40px_rgba(0,0,0,0.3)] ring-2 ring-blue-400/30",
        
        // Animação suave
        "transition-transform duration-75 ease-out"
      )}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        transform: 'translate(0, 0)', // Posição já calculada
        pointerEvents: 'none'
      }}
    >
      {/* Overlay especial para clone */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-xl pointer-events-none" />
      
      {/* Content do clone */}
      <div className="relative z-10">
        <LeadCardContent lead={lead} isWonLostView={false} />
        
        {/* Tags Footer */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/30">
          <div className="flex-1 min-w-0">
            <LeadCardTags tags={lead.tags} />
          </div>
        </div>
      </div>
      
      {/* Indicador visual de "arrastando" */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-lg" />
    </div>
  );
};
