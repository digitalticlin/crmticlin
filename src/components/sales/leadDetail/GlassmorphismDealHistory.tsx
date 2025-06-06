
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
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
      <div className="text-center py-8 bg-white/40 backdrop-blur-md rounded-xl border border-white/30 shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-gray-100/50 backdrop-blur-sm rounded-full">
            <TrendingUp className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-gray-600 text-sm font-medium">
            Nenhum histórico de negociação registrado.
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[280px] pr-2">
      <div className="space-y-4">
        {deals.map((deal) => (
          <div 
            key={deal.id} 
            className={`relative overflow-hidden rounded-2xl backdrop-blur-md border-2 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
              deal.status === "won" 
                ? "bg-gradient-to-br from-green-400/30 to-green-600/20 border-green-400/60 hover:from-green-400/40 hover:to-green-600/30" 
                : "bg-gradient-to-br from-red-400/30 to-red-600/20 border-red-400/60 hover:from-red-400/40 hover:to-red-600/30"
            }`}
          >
            {/* Background pattern overlay */}
            <div className={`absolute inset-0 opacity-10 ${
              deal.status === "won" ? "bg-green-500" : "bg-red-500"
            }`} style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
              backgroundSize: '20px 20px'
            }} />
            
            <div className="relative p-5">
              {/* Header com status e data */}
              <div className="flex justify-between items-start mb-4">
                <Badge 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border-2 shadow-lg font-semibold transition-all duration-200 hover:scale-105 ${
                    deal.status === "won"
                      ? "bg-green-500/90 text-white border-green-300/70 hover:bg-green-600/90"
                      : "bg-red-500/90 text-white border-red-300/70 hover:bg-red-600/90"
                  }`}
                >
                  {deal.status === "won" ? (
                    <>
                      <Check className="h-4 w-4" />
                      <TrendingUp className="h-4 w-4" />
                      Ganho
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      <TrendingDown className="h-4 w-4" />
                      Perdido
                    </>
                  )}
                </Badge>
                
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border shadow-sm ${
                  deal.status === "won"
                    ? "bg-green-100/80 text-green-800 border-green-200/70"
                    : "bg-red-100/80 text-red-800 border-red-200/70"
                }`}>
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs font-medium">{deal.date}</span>
                </div>
              </div>
              
              {/* Valor da negociação */}
              <div className={`flex items-center gap-3 mb-4 p-4 rounded-xl backdrop-blur-sm border ${
                deal.status === "won"
                  ? "bg-green-50/60 border-green-200/50"
                  : "bg-red-50/60 border-red-200/50"
              }`}>
                <div className={`p-2 rounded-lg ${
                  deal.status === "won" ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  <DollarSign className={`h-5 w-5 ${
                    deal.status === "won" ? "text-green-600" : "text-red-600"
                  }`} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 font-medium mb-1">Valor da Negociação</div>
                  <div className={`font-bold text-xl ${
                    deal.status === "won" ? "text-green-700" : "text-red-700"
                  }`}>
                    {formatCurrency(deal.value)}
                  </div>
                </div>
              </div>
              
              {/* Nota da negociação */}
              {deal.note && (
                <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-white/40 shadow-sm">
                  <div className="text-xs text-gray-500 font-medium mb-2">Observações</div>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{deal.note}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
