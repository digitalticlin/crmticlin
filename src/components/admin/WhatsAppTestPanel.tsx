
import { VPSCompleteDiagnostic } from "./VPSCompleteDiagnostic";
import { VPSConnectivityTest } from "../settings/whatsapp/VPSConnectivityTest";
import { VPSTestTrigger } from "./VPSTestTrigger";
import { ModularTestPanel } from "./ModularTestPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TestTube, Settings, Monitor, Activity } from "lucide-react";

export const WhatsAppTestPanel = () => {
  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Centro de Diagnóstico WhatsApp Completo
          </CardTitle>
          <p className="text-orange-700 text-sm">
            Execute testes completos para garantir que toda a integração WhatsApp está funcionando perfeitamente
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="modular" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="modular" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Arquitetura V2.0
          </TabsTrigger>
          <TabsTrigger value="post-correction" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Pós-Correção
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Diagnóstico V1.0
          </TabsTrigger>
          <TabsTrigger value="connectivity" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Conectividade
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modular" className="space-y-6">
          <ModularTestPanel />
        </TabsContent>

        <TabsContent value="post-correction" className="space-y-6">
          <VPSTestTrigger />
        </TabsContent>

        <TabsContent value="complete" className="space-y-6">
          <VPSCompleteDiagnostic />
        </TabsContent>

        <TabsContent value="connectivity" className="space-y-6">
          <VPSConnectivityTest />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">VPS WhatsApp Server</h4>
                  <p className="text-sm text-blue-700">
                    <strong>URL:</strong> http://31.97.24.222:3001<br/>
                    <strong>Webhook:</strong> https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-medium text-green-800 mb-2">Secrets Configurados</h4>
                  <p className="text-sm text-green-700">
                    • VPS_API_TOKEN<br/>
                    • SUPABASE_URL<br/>
                    • SUPABASE_SERVICE_ROLE_KEY
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <h4 className="font-medium text-yellow-800 mb-2">Última Correção</h4>
                  <p className="text-sm text-yellow-700">
                    ✅ AUTH_TOKEN na VPS alinhado com VPS_API_TOKEN<br/>
                    ✅ Servidor reiniciado via PM2<br/>
                    ✅ Tokens confirmados: 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
