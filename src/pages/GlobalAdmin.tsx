
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
              <TabsTrigger value="sync">Sincronização</TabsTrigger>
              <TabsTrigger value="sync-logs">Logs Sync</TabsTrigger>
              <TabsTrigger value="vps">VPS</TabsTrigger>
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
                  <h2 className="text-xl font-semibold mb-2">Teste VPS Hostinger</h2>
                  <p className="text-muted-foreground mb-6">
                    Testar conectividade com o servidor VPS e gerar scripts de instalação do WhatsApp Web.js
                  </p>
                </div>
                <VPSTestPanel />
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
