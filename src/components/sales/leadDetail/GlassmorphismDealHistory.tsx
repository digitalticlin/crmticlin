
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Deal {
  id: string;
  status: "won" | "lost";
  value: number;
  date: string;
  note?: string;
}

interface GlassmorphismDealHistoryProps {
  deals: Deal[];
}

export const GlassmorphismDealHistory = ({ deals }: GlassmorphismDealHistoryProps) => {
  if (deals.length === 0) {
    return (
      <div className="text-center py-6 bg-white/20 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="text-gray-600 text-sm">
          Nenhum histórico de negociação registrado.
        </div>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-3">
        {deals.map((deal) => (
          <div 
            key={deal.id} 
            className={`p-4 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-200 hover:scale-[1.02] ${
              deal.status === "won" 
                ? "bg-green-100/40 border-green-300/50 hover:bg-green-100/60" 
                : "bg-red-100/40 border-red-300/50 hover:bg-red-100/60"
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <Badge 
                className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm border shadow-sm ${
                  deal.status === "won"
                    ? "bg-green-500/80 text-white border-green-400/50 hover:bg-green-600/80"
                    : "bg-red-500/80 text-white border-red-400/50 hover:bg-red-600/80"
                }`}
              >
                {deal.status === "won" ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    <Check className="h-3 w-3" />
                    Ganho
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3" />
                    <X className="h-3 w-3" />
                    Perdido
                  </>
                )}
              </Badge>
              <span className={`text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm ${
                deal.status === "won"
                  ? "bg-green-200/60 text-green-800"
                  : "bg-red-200/60 text-red-800"
              }`}>
                {deal.date}
              </span>
            </div>
            
            <div className={`font-bold text-lg mb-2 ${
              deal.status === "won" ? "text-green-700" : "text-red-700"
            }`}>
              {formatCurrency(deal.value)}
            </div>
            
            {deal.note && (
              <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <p className="text-sm text-gray-700 leading-relaxed">{deal.note}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
