
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VPSQuickDiagnostic } from "./vps/VPSQuickDiagnostic";
import { VPSAdvancedDiagnostic } from "./vps/VPSAdvancedDiagnostic";
import { VPSAutoFixPanel } from "./vps/VPSAutoFixPanel";
import { AdvancedWebhookInstaller } from "./hostinger/AdvancedWebhookInstaller";
import { QuickVPSCorrection } from "./hostinger/QuickVPSCorrection";
import { 
  Server, 
  Wrench, 
  Zap, 
  TestTube, 
  AlertTriangle
} from "lucide-react";

export const VPSDiagnosticsSection = () => {
  return (
    <div className="space-y-6">
      {/* Quick VPS Correction - Novo componente prioritário */}
      <QuickVPSCorrection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Diagnósticos e Correções VPS
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ferramentas completas para diagnosticar e corrigir problemas na VPS WhatsApp
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quick" className="gap-2">
                <Zap className="h-4 w-4" />
                Rápido
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-2">
                <TestTube className="h-4 w-4" />
                Avançado
              </TabsTrigger>
              <TabsTrigger value="autofix" className="gap-2">
                <Wrench className="h-4 w-4" />
                Correção
              </TabsTrigger>
              <TabsTrigger value="installer" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Installer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="mt-6">
              <VPSQuickDiagnostic />
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <VPSAdvancedDiagnostic />
            </TabsContent>

            <TabsContent value="autofix" className="mt-6">
              <VPSAutoFixPanel />
            </TabsContent>

            <TabsContent value="installer" className="mt-6">
              <AdvancedWebhookInstaller />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
