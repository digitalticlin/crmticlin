import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, History } from "lucide-react";
import { WinCard } from "../components/WinCard";
import { LossCard } from "../components/LossCard";
import { DealHistoryItem } from "@/types/chat";

interface DealHistorySectionProps {
  dealHistory?: DealHistoryItem[];
}

export const DealHistorySection = ({ dealHistory = [] }: DealHistorySectionProps) => {
  const wins = dealHistory.filter(deal => deal.type === 'win');
  const losses = dealHistory.filter(deal => deal.type === 'loss');
  
  const totalWinValue = wins.reduce((total, win) => total + (win.value || 0), 0);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const sortedHistory = dealHistory.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
      <div className="flex items-center gap-2 mb-6">
        <History className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-800">📊 Histórico de Negociações</h3>
      </div>

      {dealHistory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Nenhum histórico de negociações ainda</p>
        </div>
      ) : (
        <>
          {/* Estatísticas resumidas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-green-300 font-medium">GANHOS</span>
              </div>
              <div className="text-xl font-bold text-green-300">{wins.length}</div>
              <div className="text-sm text-green-200">{formatCurrency(totalWinValue)}</div>
            </div>

            <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-4 border border-red-400/40">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-xs text-red-300 font-medium">PERDAS</span>
              </div>
              <div className="text-xl font-bold text-red-300">{losses.length}</div>
              <div className="text-sm text-red-200">Oportunidades</div>
            </div>

            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/40">
              <div className="flex items-center gap-2 mb-1">
                <History className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-blue-300 font-medium">TOTAL</span>
              </div>
              <div className="text-xl font-bold text-blue-300">{dealHistory.length}</div>
              <div className="text-sm text-blue-200">Negociações</div>
            </div>
          </div>

          {/* Lista do histórico */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Histórico Completo</h4>
            <ScrollArea className="h-64">
              <div className="space-y-3 pr-4">
                {sortedHistory.map((deal) => (
                  <div key={deal.id}>
                    {deal.type === 'win' ? (
                      <WinCard deal={deal} />
                    ) : (
                      <LossCard deal={deal} />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};