
import { ReactNode } from "react";
import { FunnelLoadingState } from "./FunnelLoadingState";
import { FunnelEmptyState } from "./FunnelEmptyState";
import { Funnel } from "@/types/funnel";

interface SalesFunnelStateHandlerProps {
  funnelLoading: boolean;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  setSelectedFunnel: (funnel: Funnel) => void;
  createFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin: boolean;
  children: ReactNode;
}

export const SalesFunnelStateHandler = ({
  funnelLoading,
  funnels,
  selectedFunnel,
  setSelectedFunnel,
  createFunnel,
  isAdmin,
  children
}: SalesFunnelStateHandlerProps) => {
  // Estado de carregamento
  if (funnelLoading) {
    console.log('[SalesFunnel] ⏳ Carregando funis...');
    return <FunnelLoadingState />;
  }

  // Empty state - mostrar apenas se realmente não houver funis após o carregamento
  if (!selectedFunnel && funnels.length === 0 && !funnelLoading) {
    console.log('[SalesFunnel] ❌ Nenhum funil encontrado, mostrando empty state');
    return <FunnelEmptyState />;
  }

  // Se tem funis mas nenhum selecionado, selecionar o primeiro
  if (funnels.length > 0 && !selectedFunnel) {
    console.log('[SalesFunnel] 🔄 Selecionando primeiro funil disponível:', funnels[0]);
    setSelectedFunnel(funnels[0]);
    return <FunnelLoadingState />;
  }

  return <>{children}</>;
};
