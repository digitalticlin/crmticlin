
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientDeals, useCreateDeal, useDeleteDeal } from "@/hooks/clients/useClientDeals";
import { DealsHistoryHeader } from "./DealsHistory/DealsHistoryHeader";
import { DealsList } from "./DealsHistory/DealsList";
import { DealsSummary } from "./DealsHistory/DealsSummary";
import { DealsLoadingState } from "./DealsHistory/DealsLoadingState";
import { AddDealModal } from "./DealsHistory/AddDealModal";

interface DealsHistorySectionProps {
  clientId: string;
}

export function DealsHistorySection({ clientId }: DealsHistorySectionProps) {
  const { data: deals = [], isLoading, error } = useClientDeals(clientId);
  const createDealMutation = useCreateDeal();
  const deleteDealMutation = useDeleteDeal();
  const [showAddDeal, setShowAddDeal] = useState(false);

  const handleAddDeal = async (dealData: { status: "won" | "lost"; value: number; note?: string }) => {
    try {
      await createDealMutation.mutateAsync({
        ...dealData,
        lead_id: clientId,
        date: new Date().toISOString(),
      });
      setShowAddDeal(false);
    } catch (error) {
      console.error("Erro ao adicionar deal:", error);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await deleteDealMutation.mutateAsync(dealId);
    } catch (error) {
      console.error("Erro ao deletar deal:", error);
    }
  };

  if (error) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
        <CardContent className="p-6">
          <p className="text-red-400">Erro ao carregar histórico de deals</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
      <CardHeader>
        <DealsHistoryHeader 
          onAddDeal={() => setShowAddDeal(true)}
          isLoading={createDealMutation.isPending}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <DealsSummary deals={deals} />
        
        {isLoading ? (
          <DealsLoadingState />
        ) : (
          <DealsList 
            deals={deals} 
            onDeleteDeal={handleDeleteDeal}
            isDeleting={deleteDealMutation.isPending}
          />
        )}
        
        <AddDealModal
          open={showAddDeal}
          onClose={() => setShowAddDeal(false)}
          onSubmit={handleAddDeal}
          isLoading={createDealMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
