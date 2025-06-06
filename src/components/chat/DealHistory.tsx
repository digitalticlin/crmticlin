
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
      <div className="text-center py-4 text-sm text-gray-600">
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
            className={`p-3 border rounded-md transition-all backdrop-blur-sm ${
              deal.status === "won" 
                ? "bg-green-500/20 border-green-400/40" 
                : "bg-red-500/20 border-red-400/40"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <Badge 
                variant={deal.status === "won" ? "default" : "destructive"}
                className={`flex items-center gap-1 ${
                  deal.status === "won"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {deal.status === "won" ? (
                  <><Check className="h-3 w-3" /> Ganho</>
                ) : (
                  <><X className="h-3 w-3" /> Perdido</>
                )}
              </Badge>
              <span className="text-xs text-gray-700">{deal.date}</span>
            </div>
            
            <div className={`font-semibold ${
              deal.status === "won" ? "text-green-800" : "text-red-800"
            }`}>
              {formatCurrency(deal.value)}
            </div>
            
            {deal.note && (
              <p className="text-sm text-gray-700 mt-1">{deal.note}</p>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
