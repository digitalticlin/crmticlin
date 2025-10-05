/**
 * 📱 MOBILE FUNNEL VIEW
 *
 * View alternativa mobile-first para o funil de vendas
 * Substitui o Kanban horizontal por uma lista vertical com cards expansíveis
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanLead } from "@/types/kanban";

interface MobileFunnelViewProps {
  stages: Array<{
    id: string;
    name: string;
    color: string;
    leads: KanbanLead[];
  }>;
  onLeadClick: (lead: KanbanLead) => void;
  onAddLead?: (stageId: string) => void;
  onMoveLeadToStage?: (leadId: string, newStageId: string) => void;
}

export function MobileFunnelView({
  stages,
  onLeadClick,
  onAddLead,
  onMoveLeadToStage
}: MobileFunnelViewProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(stages.map(s => s.id)) // Todas expandidas por padrão
  );

  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  return (
    <div className="space-y-3 pb-4">
      {stages.map((stage) => {
        const isExpanded = expandedStages.has(stage.id);
        const leadCount = stage.leads?.length || 0;

        return (
          <div
            key={stage.id}
            className="rounded-2xl bg-white/90 backdrop-blur-lg border border-gray-200 shadow-md overflow-hidden"
          >
            {/* Header da etapa - sempre visível */}
            <button
              onClick={() => toggleStage(stage.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Indicador de cor da etapa */}
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />

                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-base text-gray-900">
                    {stage.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {leadCount} {leadCount === 1 ? 'lead' : 'leads'}
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex items-center gap-2">
                {onAddLead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddLead(stage.id);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}

                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Lista de leads - colapsável */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {leadCount === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Nenhum lead nesta etapa</p>
                  </div>
                ) : (
                  stage.leads.map((lead) => (
                    <LeadCardMobile
                      key={lead.id}
                      lead={lead}
                      onClick={() => onLeadClick(lead)}
                      stageColor={stage.color}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Card de lead otimizado para mobile
interface LeadCardMobileProps {
  lead: KanbanLead;
  onClick: () => void;
  stageColor: string;
}

function LeadCardMobile({ lead, onClick, stageColor }: LeadCardMobileProps) {
  // Extrair primeira letra do nome para avatar
  const initials = lead.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl bg-white border border-gray-200",
        "hover:border-gray-300 hover:shadow-md",
        "transition-all duration-200",
        "active:scale-[0.98]" // Feedback táctil
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex items-center justify-center h-12 w-12 rounded-full text-white font-semibold text-sm flex-shrink-0"
          style={{ backgroundColor: stageColor }}
        >
          {initials}
        </div>

        {/* Informações do lead */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base text-gray-900 truncate">
            {lead.name}
          </h4>

          {lead.phone && (
            <p className="text-sm text-gray-600 truncate">
              {lead.phone}
            </p>
          )}

          {lead.email && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {lead.email}
            </p>
          )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.tags.slice(0, 2).map((tag: any) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                >
                  {tag.name}
                </Badge>
              ))}
              {lead.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{lead.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Indicador de valor (se houver) */}
        {lead.value && (
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-green-600">
              R$ {lead.value.toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
