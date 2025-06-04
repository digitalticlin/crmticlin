
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
import { VPSVersionDiagnostic } from "./vps/VPSVersionDiagnostic";
import { VPSComprehensiveDiagnostic } from "./vps/VPSComprehensiveDiagnostic";
import { VPSMessageTester } from "./vps/VPSMessageTester";
import { VPSTokenDiscovery } from "./vps/VPSTokenDiscovery";
import { HostingerTokenForm } from "./hostinger/HostingerTokenForm";
import { WhatsAppTokenGenerator } from "./vps/WhatsAppTokenGenerator";
import { VPSSecretManager } from "./vps/VPSSecretManager";
import { VPSSupabaseSyncTest } from "./VPSSupabaseSyncTest";
import { VPSTokenSynchronizer } from "./vps/VPSTokenSynchronizer";
import { VPSInstanceCreationTester } from "./vps/VPSInstanceCreationTester";
import { VPSEndpointDiscovery as VPSEndpointDiscoveryNew } from "./vps/VPSEndpointDiscovery";

export const VPSTestPanel = () => {
  return (
    <div className="space-y-6">
      {/* NOVO: Descoberta Automática de Endpoints VPS - FERRAMENTA PRINCIPAL */}
      <VPSEndpointDiscoveryNew />

      {/* NOVO: Sincronização e Correção de Token VPS - FERRAMENTA PRINCIPAL */}
      <VPSTokenSynchronizer />

      {/* NOVO: Teste de Criação de Instância - FERRAMENTA PRINCIPAL */}
      <VPSInstanceCreationTester />

      {/* NOVO: Teste Completo de Sincronização VPS-Supabase - FERRAMENTA PRINCIPAL */}
      <VPSSupabaseSyncTest />

      {/* NOVO: Gerenciador de Secrets e Diagnósticos Automatizados - FERRAMENTA PRINCIPAL */}
      <VPSSecretManager />

      {/* Deploy Inteligente - Primeira seção */}
      <AutoDeployButton />

      {/* NOVO: Configuração de Tokens - SEÇÃO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HostingerTokenForm />
        <WhatsAppTokenGenerator />
      </div>

      {/* NOVO: Descoberta de Token WhatsApp - FERRAMENTA PRINCIPAL */}
      <VPSTokenDiscovery />

      {/* Diagnóstico Abrangente */}
      <VPSComprehensiveDiagnostic />

      {/* Teste de Mensagens em Tempo Real */}
      <VPSMessageTester />

      {/* Diagnóstico de Versão */}
      <VPSVersionDiagnostic />

      {/* Investigação Técnica Profunda */}
      <VPSDeepInvestigation />

      {/* Descoberta de Endpoints */}
      <VPSEndpointDiscovery />

      {/* Diagnóstico Completo VPS */}
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

      {/* Diagnóstico Avançado */}
      <VPSAdvancedDiagnostic />

      {/* Diagnóstico Básico - Seção final */}
      <PortTestDiagnostic />
    </div>
  );
};
