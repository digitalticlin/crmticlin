
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface Deal {
  id: string;
  status: "won" | "lost";
  value: number;
  date: string;
  note?: string;
}

interface DealHistoryProps {
  deals: Deal[];
}

export const DealHistory = ({ deals }: DealHistoryProps) => {
  if (deals.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Nenhum histórico de negociação registrado.
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-3">
        {deals.map((deal) => (
          <div 
            key={deal.id} 
            className="p-3 border rounded-md bg-background"
          >
            <div className="flex justify-between items-center mb-2">
              <Badge 
                variant={deal.status === "won" ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {deal.status === "won" ? (
                  <><Check className="h-3 w-3" /> Ganho</>
                ) : (
                  <><X className="h-3 w-3" /> Perdido</>
                )}
              </Badge>
              <span className="text-xs text-muted-foreground">{deal.date}</span>
            </div>
            
            <div className="font-semibold">
              {formatCurrency(deal.value)}
            </div>
            
            {deal.note && (
              <p className="text-sm text-muted-foreground mt-1">{deal.note}</p>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
