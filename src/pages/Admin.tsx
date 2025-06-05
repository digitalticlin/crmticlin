
import { useAuth } from '@/contexts/AuthContext';
import { GlobalWebhookManager } from '@/components/admin/GlobalWebhookManager';
import { InstanceStabilityDashboard } from '@/components/admin/InstanceStabilityDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Globe, Activity } from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();

  if (!user) {
    return <div>Acesso negado</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerenciamento avançado do sistema WhatsApp
        </p>
      </div>

      <Tabs defaultValue="stability" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stability" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Estabilidade
          </TabsTrigger>
          <TabsTrigger value="webhook" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Webhook Global
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stability" className="mt-6">
          <InstanceStabilityDashboard />
        </TabsContent>
        
        <TabsContent value="webhook" className="mt-6">
          <GlobalWebhookManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
