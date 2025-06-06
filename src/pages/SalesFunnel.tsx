
import { SalesFunnelProvider } from "@/components/sales/funnel/SalesFunnelProvider";
import { SalesFunnelContent } from "@/components/sales/funnel/SalesFunnelContent";
import { WhatsAppFunnelIntegrationStatus } from "@/components/sales/funnel/WhatsAppFunnelIntegrationStatus";

export default function SalesFunnel() {
  return (
    <SalesFunnelProvider>
      <div className="space-y-6">
        {/* Status da integração WhatsApp */}
        <WhatsAppFunnelIntegrationStatus />
        
        {/* Conteúdo principal do funil */}
        <SalesFunnelContent />
      </div>
    </SalesFunnelProvider>
  );
}
