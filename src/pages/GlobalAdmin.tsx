
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlobalAdminSidebar from "@/components/admin/GlobalAdminSidebar";
import CompaniesPanel from "@/components/admin/CompaniesPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import PlansPanel from "@/components/admin/PlansPanel";
import WhatsAppPanel from "@/components/admin/WhatsAppPanel";
import LogsPanel from "@/components/admin/LogsPanel";
import SupportPanel from "@/components/admin/SupportPanel";
import ConfigPanel from "@/components/admin/ConfigPanel";
import DeploymentGuidePanel from "@/components/admin/DeploymentGuidePanel";

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
            <TabsList className="grid grid-cols-8 w-full">
              <TabsTrigger value="companies">Empresas</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="plans">Planos</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="support">Suporte</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
              <TabsTrigger value="deployment">Produção</TabsTrigger>
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
              <WhatsAppPanel />
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

            <TabsContent value="deployment">
              <DeploymentGuidePanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
