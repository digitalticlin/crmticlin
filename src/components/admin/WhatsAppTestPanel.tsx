
import { VPSCompleteDiagnostic } from "./VPSCompleteDiagnostic";
import { VPSConnectivityTest } from "../settings/whatsapp/VPSConnectivityTest";
import { VPSTestTrigger } from "./VPSTestTrigger";
import { ModularTestPanel } from "./ModularTestPanel";
import { VPSEndpointDiscoveryPanel } from "./VPSEndpointDiscovery";
import { VPSDeepInvestigation } from "./VPSDeepInvestigation";
import { VPSWebhookCorrector } from "./VPSWebhookCorrector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TestTube, Settings, Monitor, Activity, Search, Wrench } from "lucide-react";

export const WhatsAppTestPanel = () => {
  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Wrench className="h-5 w-5" />
            Centro de Diagnóstico WhatsApp - CORREÇÃO DISPONÍVEL
          </CardTitle>
          <p className="text-green-700">
            🎯 <strong>NOVO:</strong> Use o "Corretor de Webhook" para corrigir a sincronização VPS ↔ Supabase
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="corrector" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="corrector" className="gap-2">
            <Wrench className="h-4 w-4" />
            Corretor
          </TabsTrigger>
          <TabsTrigger value="investigation" className="gap-2">
            <Search className="h-4 w-4" />
            Investigação
          </TabsTrigger>
          <TabsTrigger value="discovery" className="gap-2">
            <Search className="h-4 w-4" />
            Descoberta
          </TabsTrigger>
          <TabsTrigger value="diagnostic" className="gap-2">
            <TestTube className="h-4 w-4" />
            Diagnóstico
          </TabsTrigger>
          <TabsTrigger value="connectivity" className="gap-2">
            <Monitor className="h-4 w-4" />
            Conectividade
          </TabsTrigger>
          <TabsTrigger value="modular" className="gap-2">
            <Settings className="h-4 w-4" />
            Modular
          </TabsTrigger>
          <TabsTrigger value="triggers" className="gap-2">
            <Activity className="h-4 w-4" />
            Triggers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="corrector" className="space-y-6">
          <VPSWebhookCorrector />
        </TabsContent>

        <TabsContent value="investigation" className="space-y-6">
          <VPSDeepInvestigation />
        </TabsContent>

        <TabsContent value="discovery" className="space-y-6">
          <VPSEndpointDiscoveryPanel />
        </TabsContent>

        <TabsContent value="diagnostic" className="space-y-6">
          <VPSCompleteDiagnostic />
        </TabsContent>

        <TabsContent value="connectivity" className="space-y-6">
          <VPSConnectivityTest />
        </TabsContent>

        <TabsContent value="modular" className="space-y-6">
          <ModularTestPanel />
        </TabsContent>

        <TabsContent value="triggers" className="space-y-6">
          <VPSTestTrigger />
        </TabsContent>
      </Tabs>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>🔄 Fluxo Recomendado (ATUALIZADO COM CORREÇÃO):</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li><strong>Corretor de Webhook:</strong> ⭐ EXECUTE PRIMEIRO - Corrige sincronização VPS ↔ Supabase</li>
              <li><strong>Verificação:</strong> Teste se webhook está funcionando após aplicar correção</li>
              <li><strong>Teste End-to-End:</strong> Crie instância e verifique QR code aparecendo</li>
              <li><strong>Diagnóstico:</strong> Use outras abas apenas se ainda houver problemas</li>
              <li><strong>Validação Final:</strong> Confirme fluxo completo funcionando</li>
            </ol>
            <div className="mt-3 p-3 bg-white/70 rounded border border-blue-200">
              <p className="font-medium">✨ Após correção aplicada:</p>
              <p>• QR codes aparecerão automaticamente na interface</p>
              <p>• Status de conexão será sincronizado em tempo real</p>
              <p>• Mensagens serão recebidas no Supabase</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
