
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Trophy, Target } from "lucide-react";
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
      <div className="text-center py-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
        <div className="text-white/60 text-sm flex items-center justify-center gap-2">
          <Target className="h-4 w-4 text-lime-400" />
          Nenhum histórico de negociação registrado.
        </div>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[300px] pr-2">
      <div className="space-y-4">
        {deals.map((deal) => (
          <div 
            key={deal.id} 
            className={`relative overflow-hidden rounded-2xl backdrop-blur-lg border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group ${
              deal.status === "won" 
                ? "bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/20 border-emerald-400/50 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-400/40" 
                : "bg-gradient-to-br from-rose-500/20 via-red-500/15 to-pink-500/20 border-rose-400/50 shadow-xl shadow-rose-500/20 hover:shadow-rose-400/40"
            }`}
          >
            {/* Animated glow effect */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-all duration-500 group-hover:w-32 group-hover:h-32 ${
              deal.status === "won" ? "bg-emerald-400/30" : "bg-rose-400/30"
            }`} />
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
            
            <div className="relative p-5">
              <div className="flex justify-between items-start mb-4">
                <Badge className={`${
                  deal.status === "won"
                    ? "bg-gradient-to-r from-emerald-500/90 to-green-600/90 text-white border-emerald-400/60 shadow-lg shadow-emerald-500/30"
                    : "bg-gradient-to-r from-rose-500/90 to-red-600/90 text-white border-rose-400/60 shadow-lg shadow-rose-500/30"
                } backdrop-blur-sm border-2 px-3 py-1.5 rounded-full font-semibold transition-all duration-200 hover:scale-105`}>
                  {deal.status === "won" ? (
                    <>
                      <Trophy className="h-3 w-3 mr-1" />
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Ganho
                    </>
                  ) : (
                    <>
                      <Target className="h-3 w-3 mr-1" />
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Perdido
                    </>
                  )}
                </Badge>
                
                <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                  <span className="text-xs text-white/90 font-medium">
                    {deal.date}
                  </span>
                </div>
              </div>
              
              {/* Value with enhanced styling */}
              <div className={`text-3xl font-bold mb-4 drop-shadow-2xl transition-all duration-200 ${
                deal.status === "won" ? "text-emerald-300" : "text-rose-300"
              }`}>
                {formatCurrency(deal.value)}
              </div>
              
              {/* Progress bar effect */}
              <div className={`w-full h-1 rounded-full mb-4 ${
                deal.status === "won" ? "bg-emerald-400/30" : "bg-rose-400/30"
              }`}>
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    deal.status === "won" ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-rose-400 to-red-500"
                  }`}
                  style={{ width: deal.status === "won" ? "100%" : "60%" }}
                />
              </div>
              
              {deal.note && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-inner">
                  <p className="text-sm text-white/90 leading-relaxed font-medium">
                    {deal.note}
                  </p>
                </div>
              )}
              
              {/* Decorative elements */}
              <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full ${
                deal.status === "won" ? "bg-emerald-400/20" : "bg-rose-400/20"
              } blur-sm`} />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
