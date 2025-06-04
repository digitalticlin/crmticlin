
import { WhatsAppWebSection } from "./WhatsAppWebSection";
import { VPSDiagnosticExecutor } from "./VPSDiagnosticExecutor";
import { VPSConnectivityTest } from "./VPSConnectivityTest";
import { WhatsAppDiagnostic } from "./WhatsAppDiagnostic";
import { VPSDiagnosticPanel } from "./VPSDiagnosticPanel";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WhatsAppSettings = () => {
  console.log('[WhatsAppSettings] Component rendering - WhatsApp Web.js only');
  
  const { companyId, loading: companyLoading } = useCompanyData();
  
  const {
    instances,
    loading: instancesLoading,
    error,
    refetch
  } = useWhatsAppWebInstances(companyId, companyLoading);

  console.log('[WhatsAppSettings] WhatsApp Web instances loaded:', {
    instancesCount: instances.length,
    loading: instancesLoading,
    companyLoading
  });

  return (
    <div className="space-y-8">
      <Tabs defaultValue="instances" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instances">Instâncias</TabsTrigger>
          <TabsTrigger value="diagnostic-executor">Diagnóstico Completo</TabsTrigger>
          <TabsTrigger value="connectivity">Testes VPS</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
        </TabsList>
        
        <TabsContent value="instances" className="space-y-6">
          <WhatsAppWebSection />
        </TabsContent>
        
        <TabsContent value="diagnostic-executor" className="space-y-6">
          <VPSDiagnosticExecutor />
        </TabsContent>
        
        <TabsContent value="connectivity" className="space-y-6">
          <VPSConnectivityTest />
          <VPSDiagnosticPanel />
        </TabsContent>
        
        <TabsContent value="sync" className="space-y-6">
          <WhatsAppDiagnostic />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppSettings;
