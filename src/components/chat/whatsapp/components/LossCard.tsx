import { DealHistoryItem } from "@/types/chat";

interface LossCardProps {
  deal: DealHistoryItem;
}

export const LossCard = ({ deal }: LossCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-400/40 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span className="text-red-300 font-semibold text-sm">💔 PERDA</span>
        </div>
        <span className="text-xs text-white/60">{formatDate(deal.date)}</span>
      </div>
      
      <div className="text-lg font-semibold text-red-300 mb-1">
        Oportunidade Perdida
      </div>
      
      <div className="text-sm text-white/80 mb-2">
        <span className="text-white/60">Perdido em: </span>
        <span className="font-medium">{deal.stage}</span>
      </div>

      {deal.notes && (
        <div className="text-xs text-white/70 bg-red-500/10 rounded-lg p-2 mt-2">
          {deal.notes}
        </div>
      )}
    </div>
  );
};