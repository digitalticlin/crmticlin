
import React from 'react';
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, RotateCcw } from "lucide-react";

interface WonLostViewProps {
  columns: KanbanColumn[];
  stages: KanbanStage[];
  leads: KanbanLead[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onReturnToFunnel: (lead: KanbanLead) => void;
  onOpenChat: (lead: KanbanLead) => void;
  wonStageId?: string;
  lostStageId?: string;
  searchTerm: string;
}

export const WonLostView: React.FC<WonLostViewProps> = ({
  columns,
  stages,
  leads,
  onOpenLeadDetail,
  onReturnToFunnel,
  onOpenChat,
  wonStageId,
  lostStageId,
  searchTerm
}) => {
  const wonLeads = leads.filter(lead => lead.kanban_stage_id === wonStageId);
  const lostLeads = leads.filter(lead => lead.kanban_stage_id === lostStageId);

  const filteredWonLeads = wonLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  );

  const filteredLostLeads = lostLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  );

  const LeadCard = ({ lead, type }: { lead: KanbanLead; type: 'won' | 'lost' }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{lead.phone}</p>
          </div>
          <Badge variant={type === 'won' ? 'default' : 'destructive'}>
            {type === 'won' ? 'Ganho' : 'Perdido'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChat(lead)}
            className="gap-1"
          >
            <MessageSquare className="h-3 w-3" />
            Chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReturnToFunnel(lead)}
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Retornar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenLeadDetail(lead)}
          >
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Leads Ganhos */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-green-700">
          Leads Ganhos ({filteredWonLeads.length})
        </h3>
        <div className="space-y-3">
          {filteredWonLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} type="won" />
          ))}
          {filteredWonLeads.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Nenhum lead ganho encontrado
            </p>
          )}
        </div>
      </div>

      {/* Leads Perdidos */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-red-700">
          Leads Perdidos ({filteredLostLeads.length})
        </h3>
        <div className="space-y-3">
          {filteredLostLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} type="lost" />
          ))}
          {filteredLostLeads.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Nenhum lead perdido encontrado
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
