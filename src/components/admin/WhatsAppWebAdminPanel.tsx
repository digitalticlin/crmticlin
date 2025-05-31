
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { RefreshCcw, Server, Globe } from "lucide-react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { VPSTestPanel } from "./VPSTestPanel";

// Mock data para instâncias WhatsApp Web.js
const mockWebInstances = [
  { 
    id: '1', 
    name: 'Atendimento Web', 
    phone: '+5511912345678', 
    instanceName: 'tech_solutions_atendimento_web',
    company: 'Tech Solutions Ltda',
    companyId: '1',
    status: 'connected',
    lastActivity: '2024-05-13 15:45',
    messages: 143,
    serverUrl: 'http://31.97.24.222:3001',
    vpsInstanceId: 'whatsapp_1648392847_abc123'
  },
  { 
    id: '2', 
    name: 'Vendas Web', 
    phone: '+5511987654321', 
    instanceName: 'marketing_digital_vendas_web',
    company: 'Marketing Digital SA',
    companyId: '2',
    status: 'disconnected',
    lastActivity: '2024-05-12 10:30',
    messages: 78,
    serverUrl: 'http://31.97.24.222:3001',
    vpsInstanceId: 'whatsapp_1648392948_def456'
  }
];

export default function WhatsAppWebAdminPanel() {
  const [instances] = useState(mockWebInstances);
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<any>(null);

  const handleCheckServerHealth = async () => {
    try {
      setIsCheckingServer(true);
      const result = await WhatsAppWebService.checkServerHealth();
      
      if (result.success) {
        setServerStatus(result.data);
        toast.success("Servidor VPS WhatsApp Web.js está funcionando!");
      } else {
        toast.error(`Erro no servidor VPS: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Erro ao verificar servidor VPS");
    } finally {
      setIsCheckingServer(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'connected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-1.5 h-1.5 mr-1.5 bg-green-400 rounded-full"></span>
            Conectado
          </span>
        );
      case 'disconnected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="w-1.5 h-1.5 mr-1.5 bg-gray-400 rounded-full"></span>
            Desconectado
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="w-1.5 h-1.5 mr-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
            Conectando
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Instâncias WhatsApp Web.js</CardTitle>
                <CardDescription>
                  Monitore todas as conexões WhatsApp via servidor VPS próprio
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-1"
                onClick={handleCheckServerHealth}
                disabled={isCheckingServer}
              >
                {isCheckingServer ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Server className="h-4 w-4" />
                    Verificar Servidor
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {serverStatus && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Status do Servidor VPS:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Status:</span> {serverStatus.status || 'Online'}</div>
                <div><span className="font-medium">Uptime:</span> {serverStatus.uptime || 'N/A'}</div>
                <div><span className="font-medium">Instâncias Ativas:</span> {serverStatus.activeInstances || 0}</div>
                <div><span className="font-medium">Última Verificação:</span> {new Date().toLocaleString()}</div>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">Telefone</th>
                  <th className="text-left p-3 font-medium">Instância VPS</th>
                  <th className="text-left p-3 font-medium">Empresa</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Última Atividade</th>
                  <th className="text-left p-3 font-medium">Mensagens 24h</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((instance) => (
                  <tr key={instance.id} className="border-b">
                    <td className="p-3 font-medium">{instance.name}</td>
                    <td className="p-3">{instance.phone}</td>
                    <td className="p-3 font-mono text-xs">{instance.vpsInstanceId}</td>
                    <td className="p-3">{instance.company}</td>
                    <td className="p-3">{getStatusBadge(instance.status)}</td>
                    <td className="p-3">{instance.lastActivity}</td>
                    <td className="p-3">{instance.messages}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Reconectar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Logs
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {instances.length} instâncias WhatsApp Web.js
          </div>
          <div className="text-sm text-muted-foreground">
            Última verificação: {new Date().toLocaleString()}
          </div>
        </CardFooter>
      </Card>
      
      <VPSTestPanel />
    </div>
  );
}
