
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
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
  const totalWon = deals.filter(d => d.status === "won").reduce((sum, d) => sum + d.value, 0);
  const totalLost = deals.filter(d => d.status === "lost").reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter(d => d.status === "won");
  const lostDeals = deals.filter(d => d.status === "lost");

  return (
    <div className="space-y-6">
      {/* Resumo de Totais */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-400/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30 shadow-lg shadow-green-400/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">Total Ganho</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(totalWon)}</p>
          <p className="text-xs text-green-300">{wonDeals.length} negociações</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-500/20 to-pink-400/20 backdrop-blur-sm rounded-xl p-4 border border-red-400/30 shadow-lg shadow-red-400/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">Total Perdido</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(totalLost)}</p>
          <p className="text-xs text-red-300">{lostDeals.length} negociações</p>
        </div>
      </div>

      {/* Lista de Deals */}
      {deals.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {deals.map((deal) => (
            <div 
              key={deal.id} 
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {deal.status === "won" ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    deal.status === "won" ? "text-green-300" : "text-red-300"
                  }`}>
                    {deal.status === "won" ? "Negócio Ganho" : "Negócio Perdido"}
                  </span>
                </div>
                
                <span className="text-lg font-bold text-white">
                  {formatCurrency(deal.value)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                <Calendar className="h-3 w-3" />
                <span>{new Date(deal.date).toLocaleDateString('pt-BR')}</span>
              </div>
              
              {deal.note && (
                <p className="text-sm text-gray-300 bg-white/5 rounded-lg p-2 border border-white/10">
                  {deal.note}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma negociação registrada</p>
        </div>
      )}
    </div>
  );
};
