
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ClientDeal } from "@/hooks/clients/useClientDeals";

interface DealsSummaryProps {
  deals: ClientDeal[];
}

export function DealsSummary({ deals }: DealsSummaryProps) {
  const totalWon = deals.filter(d => d.status === "won").reduce((sum, d) => sum + d.value, 0);
  const totalLost = deals.filter(d => d.status === "lost").reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-300" />
          <span className="text-sm font-medium text-green-200">Total Ganho</span>
        </div>
        <p className="text-xl font-bold text-green-100">{formatCurrency(totalWon)}</p>
      </div>
      
      <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-4 w-4 text-red-300" />
          <span className="text-sm font-medium text-red-200">Total Perdido</span>
        </div>
        <p className="text-xl font-bold text-red-100">{formatCurrency(totalLost)}</p>
      </div>
    </div>
  );
}
