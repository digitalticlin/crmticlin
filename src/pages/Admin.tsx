
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  MessageSquare, 
  Server, 
  Database,
  Settings,
  Shield
} from "lucide-react";

// CORREÇÃO: Remover import do VPSDebugDashboard obsoleto
import { WhatsAppWebAdminPanel } from "@/components/admin/WhatsAppWebAdminPanel";
import { SimplifiedWhatsAppPanel } from "@/components/admin/SimplifiedWhatsAppPanel";

export default function Admin() {
  return (
    <PageLayout>
      <ModernPageHeader 
        title="Painel Administrativo" 
        description="Ferramentas de diagnóstico e monitoramento do sistema"
      />
      
      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border border-white/30">
          <TabsTrigger 
            value="whatsapp" 
            className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp System
          </TabsTrigger>
          <TabsTrigger 
            value="simplified"
            className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
          >
            <Settings className="h-4 w-4" />
            Simplified Panel
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="whatsapp" className="space-y-6">
            <WhatsAppWebAdminPanel />
          </TabsContent>

          <TabsContent value="simplified" className="space-y-6">
            <SimplifiedWhatsAppPanel />
          </TabsContent>
        </div>
      </Tabs>
    </PageLayout>
  );
}
