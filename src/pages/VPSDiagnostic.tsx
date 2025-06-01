
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VPSDiagnosticPanel } from "@/components/admin/VPSDiagnosticPanel";
import { VPSManualTestPanel } from "@/components/admin/VPSManualTestPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VPSDiagnostic = () => {
  console.log('[VPSDiagnostic] Componente renderizado');

  return (
    <DashboardLayout>
      <div className="p-6 h-full overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Diagnóstico VPS</h1>
          <p className="text-muted-foreground">
            Ferramentas de diagnóstico para identificar problemas na VPS Node.js
          </p>
        </div>

        <Tabs defaultValue="automatic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="automatic">Diagnóstico Automático</TabsTrigger>
            <TabsTrigger value="manual">Testes Manuais</TabsTrigger>
          </TabsList>

          <TabsContent value="automatic">
            <VPSDiagnosticPanel />
          </TabsContent>

          <TabsContent value="manual">
            <VPSManualTestPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default VPSDiagnostic;
