
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Database, Globe, TestTube } from "lucide-react";
import { OrphanInstanceManager } from "@/components/admin/OrphanInstanceManager";
import { VPSInstanceCorrection } from "@/components/admin/VPSInstanceCorrection";
import { WhatsAppDiagnostic } from "@/components/settings/whatsapp/WhatsAppDiagnostic";
import { GlobalInstanceSync } from "@/components/admin/GlobalInstanceSync";
import { TestSyncButton } from "@/components/admin/TestSyncButton";

export const WhatsAppAdminPanel = () => {
  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          Painel de Administração WhatsApp - Admin Global
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="test" className="gap-2">
              <TestTube className="h-4 w-4" />
              Teste Sync
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <Globe className="h-4 w-4" />
              Sincronização
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

          <TabsContent value="test" className="mt-6">
            <TestSyncButton />
          </TabsContent>

          <TabsContent value="sync" className="mt-6">
            <GlobalInstanceSync />
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
  );
};
