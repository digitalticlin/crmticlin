
import { Deal } from "@/types/chat";
import { DealHistory } from "@/components/chat/DealHistory";

interface SalesHistorySectionProps {
  deals: Deal[];
}

export const SalesHistorySection = ({ deals }: SalesHistorySectionProps) => {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Vendas</h3>
      <DealHistory deals={deals} />
    </div>
  );
};
