
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ModernPageHeader } from '@/components/layout/ModernPageHeader';
import { SalesFunnelContextProvider } from '@/components/sales/funnel/SalesFunnelContextProvider';
import { SalesFunnelContent } from '@/components/sales/funnel/SalesFunnelContent';

export default function SalesFunnel() {
  return (
    <PageLayout>
      <ModernPageHeader
        title="Funil de Vendas"
        description="Gerencie seus leads e acompanhe o progresso das vendas"
      />
      
      <SalesFunnelContextProvider>
        <SalesFunnelContent />
      </SalesFunnelContextProvider>
    </PageLayout>
  );
}
