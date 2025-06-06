
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Total Ganho</span>
        </div>
        <p className="text-xl font-bold text-green-900">{formatCurrency(totalWon)}</p>
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">Total Perdido</span>
        </div>
        <p className="text-xl font-bold text-red-900">{formatCurrency(totalLost)}</p>
      </div>
    </div>
  );
}
