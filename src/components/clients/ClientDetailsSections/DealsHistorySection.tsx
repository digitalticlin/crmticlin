
import { useState } from "react";
import { useClientDeals, useCreateDeal, useDeleteDeal } from "@/hooks/clients/useClientDeals";
import { DealsHistoryHeader } from "./DealsHistory/DealsHistoryHeader";
import { DealsSummary } from "./DealsHistory/DealsSummary";
import { DealsList } from "./DealsHistory/DealsList";
import { AddDealModal } from "./DealsHistory/AddDealModal";
import { DealsLoadingState } from "./DealsHistory/DealsLoadingState";

interface DealsHistorySectionProps {
  clientId: string;
}

export function DealsHistorySection({ clientId }: DealsHistorySectionProps) {
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);

  const { data: deals = [], isLoading } = useClientDeals(clientId);
  const createDealMutation = useCreateDeal(clientId);
  const deleteDealMutation = useDeleteDeal(clientId);

  const handleAddDeal = async (dealData: { status: "won" | "lost"; value: number; note?: string }) => {
    await createDealMutation.mutateAsync(dealData);
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await deleteDealMutation.mutateAsync(dealId);
    } catch (error) {
      console.error("Erro ao deletar deal:", error);
    }
  };

  if (isLoading) {
    return <DealsLoadingState />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <DealsHistoryHeader 
        dealsCount={deals.length}
        onAddDealClick={() => setIsAddDealOpen(true)}
      />

      <DealsSummary deals={deals} />

      <DealsList 
        deals={deals}
        onDeleteDeal={handleDeleteDeal}
        isDeleting={deleteDealMutation.isPending}
      />

      <AddDealModal
        isOpen={isAddDealOpen}
        onOpenChange={setIsAddDealOpen}
        onAddDeal={handleAddDeal}
        isCreating={createDealMutation.isPending}
      />
    </div>
  );
}
