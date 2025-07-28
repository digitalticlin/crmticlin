
import React from 'react';
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Settings, Trash2 } from "lucide-react";

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange: (columns: KanbanColumn[]) => void;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (column: KanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat: (lead: KanbanLead) => void;
  onMoveToWonLost: (lead: KanbanLead, status: "won" | "lost") => void;
  wonStageId?: string;
  lostStageId?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onColumnsChange,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  wonStageId,
  lostStageId
}) => {
  const LeadCard = ({ lead }: { lead: KanbanLead }) => (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{lead.phone}</p>
          </div>
          {lead.unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {lead.unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-1">
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
            variant="ghost"
            onClick={() => onOpenLeadDetail(lead)}
          >
            Ver
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const Column = ({ column }: { column: KanbanColumn }) => (
    <div className="flex-shrink-0 w-80">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              {column.title}
              <Badge variant="outline" className="ml-2">
                {column.leads.length}
              </Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => onColumnUpdate(column)}>
                <Settings className="h-3 w-3" />
              </Button>
              {!column.isFixed && (
                <Button size="sm" variant="ghost" onClick={() => onColumnDelete(column.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {column.leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
            {column.leads.length === 0 && (
              <p className="text-muted-foreground text-center py-8 text-sm">
                Nenhum lead nesta etapa
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => (
        <Column key={column.id} column={column} />
      ))}
    </div>
  );
};
