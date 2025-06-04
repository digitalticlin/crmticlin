
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlobalAdminSidebar from "@/components/admin/GlobalAdminSidebar";
import CompaniesPanel from "@/components/admin/CompaniesPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import PlansPanel from "@/components/admin/PlansPanel";
import WhatsAppWebAdminPanel from "@/components/admin/WhatsAppWebAdminPanel";
import LogsPanel from "@/components/admin/LogsPanel";
import SupportPanel from "@/components/admin/SupportPanel";
import ConfigPanel from "@/components/admin/ConfigPanel";
import { WhatsAppSyncTest } from "@/components/admin/WhatsAppSyncTest";
import { SyncLogsPanel } from "@/components/admin/SyncLogsPanel";
import { VPSTestPanel } from "@/components/admin/VPSTestPanel";
import { DeployManager } from "@/components/admin/deploy/DeployManager";
import { WhatsAppDiagnostic } from "@/components/settings/whatsapp/WhatsAppDiagnostic";
import { VPSHealthDiagnostic } from "@/components/settings/whatsapp/VPSHealthDiagnostic";

export default function GlobalAdmin() {
  const [activeTab, setActiveTab] = useState("companies");

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <GlobalAdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Painel Administrativo Global</h1>
            <p className="text-muted-foreground">Gerenciamento central da plataforma Ticlin</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-12 w-full">
              <TabsTrigger value="companies">Empresas</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="plans">Planos</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
              <TabsTrigger value="sync">Sincronização</TabsTrigger>
              <TabsTrigger value="sync-logs">Logs Sync</TabsTrigger>
              <TabsTrigger value="vps">Deploy VPS</TabsTrigger>
              <TabsTrigger value="deploy">Deploy Auto</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="support">Suporte</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="companies">
              <CompaniesPanel />
            </TabsContent>
            
            <TabsContent value="users">
              <UsersPanel />
            </TabsContent>
            
            <TabsContent value="plans">
              <PlansPanel />
            </TabsContent>
            
            <TabsContent value="whatsapp">
              <WhatsAppWebAdminPanel />
            </TabsContent>
            
            <TabsContent value="diagnostic">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Diagnóstico WhatsApp</h2>
                  <p className="text-muted-foreground mb-6">
                    Ferramentas de diagnóstico e sincronização do sistema WhatsApp
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <WhatsAppDiagnostic />
                  <VPSHealthDiagnostic />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sync">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Sincronização Manual WhatsApp Web.js</h2>
                  <p className="text-muted-foreground mb-6">
                    Executar sincronização manual das instâncias do servidor VPS com o banco de dados da plataforma
                  </p>
                </div>
                <WhatsAppSyncTest />
              </div>
            </TabsContent>
            
            <TabsContent value="sync-logs">
              <SyncLogsPanel />
            </TabsContent>
            
            <TabsContent value="vps">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Deploy VPS WhatsApp Server</h2>
                  <p className="text-muted-foreground mb-6">
                    Deploy automatizado do servidor WhatsApp Web.js via SSH na VPS
                  </p>
                </div>
                <VPSTestPanel />
              </div>
            </TabsContent>
            
            <TabsContent value="deploy">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Deploy Automático</h2>
                  <p className="text-muted-foreground mb-6">
                    Sistema de deploy automático para ambientes de teste e produção
                  </p>
                </div>
                <DeployManager />
              </div>
            </TabsContent>
            
            <TabsContent value="logs">
              <LogsPanel />
            </TabsContent>
            
            <TabsContent value="support">
              <SupportPanel />
            </TabsContent>
            
            <TabsContent value="config">
              <ConfigPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
