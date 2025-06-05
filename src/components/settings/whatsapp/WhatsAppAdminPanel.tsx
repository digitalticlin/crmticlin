
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Database, Globe } from "lucide-react";
import { OrphanInstanceManager } from "@/components/admin/OrphanInstanceManager";
import { VPSInstanceCorrection } from "@/components/admin/VPSInstanceCorrection";
import { WhatsAppDiagnostic } from "./WhatsAppDiagnostic";
import { GlobalInstanceSync } from "@/components/admin/GlobalInstanceSync";

export const WhatsAppAdminPanel = () => {
  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          Painel de Administração WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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
