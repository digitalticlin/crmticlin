
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ClientDeal } from "@/hooks/clients/useClientDeals";

interface DealsListProps {
  deals: ClientDeal[];
  onDeleteDeal: (dealId: string) => void;
  isDeleting: boolean;
}

export function DealsList({ deals, onDeleteDeal, isDeleting }: DealsListProps) {
  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma negociação registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {deals.map((deal) => (
        <div 
          key={deal.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <Badge 
              variant={deal.status === "won" ? "default" : "destructive"}
              className={deal.status === "won" 
                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                : "bg-red-100 text-red-800 hover:bg-red-200"
              }
            >
              {deal.status === "won" ? "Ganho" : "Perdido"}
            </Badge>
            
            <div>
              <p className="font-medium text-gray-900">{formatCurrency(deal.value)}</p>
              <p className="text-xs text-gray-500">
                {new Date(deal.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            {deal.note && (
              <p className="text-sm text-gray-600 max-w-xs truncate">
                {deal.note}
              </p>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteDeal(deal.id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
