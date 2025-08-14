
import React from 'react';
import { KanbanLead } from '@/types/kanban';
import { Card, CardContent } from '@/components/ui/card';

interface LeadCardProps {
  lead: KanbanLead;
  onClick: () => void;
  isWonLostView?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onClick,
  isWonLostView = false
}) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{lead.name}</h4>
          <p className="text-xs text-gray-600">{lead.phone}</p>
          {lead.lastMessage && (
            <p className="text-xs text-gray-500 truncate">{lead.lastMessage}</p>
          )}
          {lead.purchaseValue && (
            <p className="text-xs font-medium text-green-600">
              R$ {lead.purchaseValue.toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
