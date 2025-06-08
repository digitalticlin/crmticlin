
import { AutoDeployButton } from "./hostinger/AutoDeployButton";
import { PortTestDiagnostic } from "./vps/PortTestDiagnostic";
import { VPSInfoCard } from "./vps/VPSInfoCard";
import { PortsServicesCard } from "./vps/PortsServicesCard";
import { ServersCard } from "./vps/ServersCard";
import { AdminActionsCard } from "./vps/AdminActionsCard";
import { VPSAdvancedDiagnostic } from "./vps/VPSAdvancedDiagnostic";
import { VPSConnectivityTest } from "./VPSConnectivityTest";
import { VPSConnectionDiagnostic } from "./VPSConnectionDiagnostic";
import { VPSEndpointDiscoveryPanel } from "./VPSEndpointDiscovery";
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
import { VPSInfrastructureAnalyzer } from "./vps/VPSInfrastructureAnalyzer";
import { VPSInstanceManager } from "./vps/VPSInstanceManager";
import { VPSDiscoveryPanel } from "./vps/VPSDiscoveryPanel";
import { ManualWhatsAppInstanceCreator } from "../settings/whatsapp/ManualWhatsAppInstanceCreator";

export const VPSTestPanel = () => {
  return (
    <div className="space-y-6">
      {/* FERRAMENTA TÉCNICA: Sistema Manual de Criação de Instâncias WhatsApp */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          🔧 Sistema Técnico - Criação Manual de Instâncias
        </h3>
        <p className="text-sm text-blue-600 mb-4">
          Ferramenta avançada para administradores criarem e testarem instâncias WhatsApp manualmente
        </p>
        <ManualWhatsAppInstanceCreator />
      </div>

      {/* NOVO: Gerenciador de Instâncias Manual - FERRAMENTA PRINCIPAL */}
      <VPSInstanceManager />

      {/* NOVO: Painel de Descoberta VPS - FERRAMENTA PRINCIPAL */}
      <VPSDiscoveryPanel />

      {/* Análise Completa da Infraestrutura VPS - FERRAMENTA PRINCIPAL */}
      <VPSInfrastructureAnalyzer />

      {/* Descoberta Automática de Endpoints VPS - FERRAMENTA PRINCIPAL */}
      <VPSEndpointDiscoveryNew />

      {/* Sincronização e Correção de Token VPS - FERRAMENTA PRINCIPAL */}
      <VPSTokenSynchronizer />

      {/* Teste de Criação de Instância - FERRAMENTA PRINCIPAL */}
      <VPSInstanceCreationTester />

      {/* Teste Completo de Sincronização VPS-Supabase - FERRAMENTA PRINCIPAL */}
      <VPSSupabaseSyncTest />

      {/* Gerenciador de Secrets e Diagnósticos Automatizados - FERRAMENTA PRINCIPAL */}
      <VPSSecretManager />

      {/* Deploy Inteligente */}
      <AutoDeployButton />

      {/* Configuração de Tokens - SEÇÃO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HostingerTokenForm />
        <WhatsAppTokenGenerator />
      </div>

      {/* Descoberta de Token WhatsApp - FERRAMENTA PRINCIPAL */}
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
      <VPSEndpointDiscoveryPanel />

      {/* Diagnóstico Completo VPS */}
      <VPSConnectionDiagnostic />

      {/* Teste de Conectividade WhatsApp Web.js */}
      <VPSConnectivityTest />

      {/* Grid de Card Principal - VPSInfoCard only */}
      <VPSInfoCard />

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
