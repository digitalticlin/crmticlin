
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlobalAdminSidebar from "@/components/admin/GlobalAdminSidebar";
import CompaniesPanel from "@/components/admin/CompaniesPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import PlansPanel from "@/components/admin/PlansPanel";
import { ModernWhatsAppPanel } from "@/components/admin/ModernWhatsAppPanel";
import LogsPanel from "@/components/admin/LogsPanel";
import SupportPanel from "@/components/admin/SupportPanel";
import ConfigPanel from "@/components/admin/ConfigPanel";
import { WhatsAppSyncTest } from "@/components/admin/WhatsAppSyncTest";
import { SyncLogsPanel } from "@/components/admin/SyncLogsPanel";
import { SimpleVPSDiagnostic } from "@/components/admin/SimpleVPSDiagnostic";
import { VPSInstancesSimplified } from "@/components/admin/VPSInstancesSimplified";
import { VPSDiagnosticPanel } from "@/components/admin/VPSDiagnosticPanel";
import { OrphanInstanceManager } from "@/components/settings/whatsapp/OrphanInstanceManager";

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
            <TabsList className="grid grid-cols-10 w-full">
              <TabsTrigger value="companies">Empresas</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="plans">Planos</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="instances">Instâncias</TabsTrigger>
              <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
              <TabsTrigger value="sync">Sincronização</TabsTrigger>
              <TabsTrigger value="sync-logs">Logs Sync</TabsTrigger>
              <TabsTrigger value="vps">VPS</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
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
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Gerenciamento WhatsApp</h2>
                  <p className="text-muted-foreground mb-6">
                    Painel moderno para monitorar e gerenciar todas as conexões WhatsApp da plataforma
                  </p>
                </div>
                <ModernWhatsAppPanel />
              </div>
            </TabsContent>
            
            <TabsContent value="instances">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Gerenciamento de Instâncias WhatsApp</h2>
                  <p className="text-muted-foreground mb-6">
                    Painel completo para gerenciar instâncias órfãs e vinculações de usuário
                  </p>
                </div>
                
                {/* Painel de Órfãs - NOVO */}
                <OrphanInstanceManager />
                
                {/* Painel Simplificado - Existente */}
                <VPSInstancesSimplified />
              </div>
            </TabsContent>

            <TabsContent value="diagnostic">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Diagnóstico Completo VPS ↔ Supabase</h2>
                  <p className="text-muted-foreground mb-6">
                    Ferramentas avançadas para investigar e corrigir problemas de sincronização entre VPS e Supabase
                  </p>
                </div>
                <VPSDiagnosticPanel />
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
                  <h2 className="text-xl font-semibold mb-2">Teste VPS WhatsApp Server</h2>
                  <p className="text-muted-foreground mb-6">
                    Verificar se a conexão com o servidor VPS está funcionando corretamente
                  </p>
                </div>
                <SimpleVPSDiagnostic />
              </div>
            </TabsContent>
            
            <TabsContent value="logs">
              <LogsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
