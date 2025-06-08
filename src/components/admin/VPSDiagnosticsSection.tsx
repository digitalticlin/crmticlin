
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VPSCleanupTool } from "../settings/whatsapp/VPSCleanupTool";
import { VPSAutoCorrector } from "../settings/whatsapp/VPSAutoCorrector";
import { VPSWebhookInvestigator } from "../settings/whatsapp/VPSWebhookInvestigator";
import { AutoImportExecutor } from "../settings/whatsapp/AutoImportExecutor";
import { Wrench, Trash2, Search, Download } from "lucide-react";

export const VPSDiagnosticsSection = () => {
  const [activeTab, setActiveTab] = useState("cleanup");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Diagnósticos e Correção VPS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cleanup" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Limpeza
              </TabsTrigger>
              <TabsTrigger value="corrector" className="gap-2">
                <Wrench className="h-4 w-4" />
                Correção
              </TabsTrigger>
              <TabsTrigger value="investigator" className="gap-2">
                <Search className="h-4 w-4" />
                Investigação
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Download className="h-4 w-4" />
                Importação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cleanup" className="space-y-4">
              <VPSCleanupTool />
            </TabsContent>

            <TabsContent value="corrector" className="space-y-4">
              <VPSAutoCorrector />
            </TabsContent>

            <TabsContent value="investigator" className="space-y-4">
              <VPSWebhookInvestigator />
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <AutoImportExecutor />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
