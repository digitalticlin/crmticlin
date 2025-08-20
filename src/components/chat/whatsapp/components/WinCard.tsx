import { DealHistoryItem } from "@/types/chat";

interface WinCardProps {
  deal: DealHistoryItem;
}

export const WinCard = ({ deal }: WinCardProps) => {
  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/40 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-300 font-semibold text-sm">🏆 GANHO</span>
        </div>
        <span className="text-xs text-white/60">{formatDate(deal.date)}</span>
      </div>
      
      <div className="text-2xl font-bold text-green-300 mb-1">
        {formatCurrency(deal.value)}
      </div>
      
      <div className="text-sm text-white/80 mb-2">
        <span className="text-white/60">Fechado em: </span>
        <span className="font-medium">{deal.stage}</span>
      </div>

      {deal.notes && (
        <div className="text-xs text-white/70 bg-green-500/10 rounded-lg p-2 mt-2">
          {deal.notes}
        </div>
      )}
    </div>
  );
};