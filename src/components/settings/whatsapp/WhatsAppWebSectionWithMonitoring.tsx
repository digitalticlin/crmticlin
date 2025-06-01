
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, Monitor } from "lucide-react";
import { WhatsAppWebSection } from "./WhatsAppWebSection";
import { VPSMonitoringPanel } from "./VPSMonitoringPanel";

export function WhatsAppWebSectionWithMonitoring() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-600" />
            <CardTitle>WhatsApp Web.js</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie suas conexões WhatsApp e monitore a sincronização com o servidor VPS
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="instances" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Monitoramento VPS
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="instances" className="mt-6">
          <WhatsAppWebSection />
        </TabsContent>
        
        <TabsContent value="monitoring" className="mt-6">
          <VPSMonitoringPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
