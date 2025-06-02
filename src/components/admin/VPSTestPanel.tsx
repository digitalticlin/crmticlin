import { AutoDeployButton } from "./hostinger/AutoDeployButton";
import { PortTestDiagnostic } from "./vps/PortTestDiagnostic";
import { VPSInfoCard } from "./vps/VPSInfoCard";
import { VPSStatusCard } from "./vps/VPSStatusCard";
import { PortsServicesCard } from "./vps/PortsServicesCard";
import { ServersCard } from "./vps/ServersCard";
import { AdminActionsCard } from "./vps/AdminActionsCard";
import { VPSAdvancedDiagnostic } from "./vps/VPSAdvancedDiagnostic";
import { VPSConnectivityTest } from "./VPSConnectivityTest";
import { VPSConnectionDiagnostic } from "./VPSConnectionDiagnostic";
import { VPSEndpointDiscovery } from "./VPSEndpointDiscovery";
import { VPSDeepInvestigation } from "./vps/VPSDeepInvestigation";

export const VPSTestPanel = () => {
  return (
    <div className="space-y-6">
      {/* Deploy Inteligente - Primeira seção */}
      <AutoDeployButton />

      {/* Investigação Técnica Profunda - NOVA SEÇÃO PRIORITÁRIA */}
      <VPSDeepInvestigation />

      {/* Descoberta de Endpoints - seção anterior */}
      <VPSEndpointDiscovery />

      {/* Diagnóstico Completo VPS - Nova seção para Fase 1 */}
      <VPSConnectionDiagnostic />

      {/* Teste de Conectividade WhatsApp Web.js */}
      <VPSConnectivityTest />

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VPSInfoCard />
        <VPSStatusCard />
      </div>

      {/* Grid de Cards de Serviços */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortsServicesCard />
        <ServersCard />
      </div>

      {/* Ações Administrativas */}
      <AdminActionsCard />

      {/* Diagnóstico Avançado - Nova seção para análise 503 */}
      <VPSAdvancedDiagnostic />

      {/* Diagnóstico Básico - Seção final */}
      <PortTestDiagnostic />
    </div>
  );
};
