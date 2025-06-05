
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Database, Globe, TestTube, Wrench, Link, Activity, BarChart3, Cog } from "lucide-react";
import { OrphanInstanceManager } from "@/components/admin/OrphanInstanceManager";
import { VPSInstanceCorrection } from "@/components/admin/VPSInstanceCorrection";
import { WhatsAppDiagnostic } from "@/components/settings/whatsapp/WhatsAppDiagnostic";
import { GlobalInstanceSync } from "@/components/admin/GlobalInstanceSync";
import { TestSyncButton } from "@/components/admin/TestSyncButton";
import { WhatsAppAdminPanel } from "@/components/admin/WhatsAppAdminPanel";
import { OrphanInstanceLinker } from "@/components/admin/OrphanInstanceLinker";
import { AutoSyncMonitor } from "@/components/admin/AutoSyncMonitor";
import { AutoSyncConfigManager } from "@/components/admin/AutoSyncConfigManager";
import { SystemHealthDashboard } from "@/components/admin/SystemHealthDashboard";
import { GlobalWebhookManager } from "@/components/admin/GlobalWebhookManager";

export const UnifiedWhatsAppPanel = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão WhatsApp Global</h1>
        <p className="text-gray-600 mt-1">
          Administração completa das instâncias WhatsApp com sincronização automática
        </p>
      </div>

      {/* Ferramentas de Administração Globais */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Wrench className="h-5 w-5" />
            Ferramentas de Administração Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="webhook" className="gap-2">
                <Globe className="h-4 w-4" />
                Webhook
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Cog className="h-4 w-4" />
                Config
              </TabsTrigger>
              <TabsTrigger value="monitor" className="gap-2">
                <Activity className="h-4 w-4" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value="test" className="gap-2">
                <TestTube className="h-4 w-4" />
                Teste
              </TabsTrigger>
              <TabsTrigger value="sync" className="gap-2">
                <Globe className="h-4 w-4" />
                Sync
              </TabsTrigger>
              <TabsTrigger value="linker" className="gap-2">
                <Link className="h-4 w-4" />
                Vincular
              </TabsTrigger>
              <TabsTrigger value="orphans" className="gap-2">
                <Database className="h-4 w-4" />
                Órfãs
              </TabsTrigger>
              <TabsTrigger value="correction" className="gap-2">
                <Settings className="h-4 w-4" />
                Correção
              </TabsTrigger>
              <TabsTrigger value="diagnostic" className="gap-2">
                <Shield className="h-4 w-4" />
                Diagnóstico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <SystemHealthDashboard />
            </TabsContent>

            <TabsContent value="webhook" className="mt-6">
              <GlobalWebhookManager />
            </TabsContent>

            <TabsContent value="config" className="mt-6">
              <AutoSyncConfigManager />
            </TabsContent>

            <TabsContent value="monitor" className="mt-6">
              <AutoSyncMonitor />
            </TabsContent>

            <TabsContent value="test" className="mt-6">
              <TestSyncButton />
            </TabsContent>

            <TabsContent value="sync" className="mt-6">
              <GlobalInstanceSync />
            </TabsContent>

            <TabsContent value="linker" className="mt-6">
              <OrphanInstanceLinker />
            </TabsContent>

            <TabsContent value="orphans" className="mt-6">
              <OrphanInstanceManager />
            </TabsContent>

            <TabsContent value="correction" className="mt-6">
              <VPSInstanceCorrection />
            </TabsContent>

            <TabsContent value="diagnostic" className="mt-6">
              <WhatsAppDiagnostic />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Painel de Administração Original */}
      <WhatsAppAdminPanel />
    </div>
  );
};
