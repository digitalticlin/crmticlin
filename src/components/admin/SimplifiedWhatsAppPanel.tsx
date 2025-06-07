
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from "@/components/ui/card";
import { RefreshCcw, Server, Globe, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { VPSTokenSynchronizer } from "./vps/VPSTokenSynchronizer";
import { VPSInstanceCreationTester } from "./vps/VPSInstanceCreationTester";
import { VPSComprehensiveDiagnostic } from "./vps/VPSComprehensiveDiagnostic";
import { VPSDeepInvestigation } from "./vps/VPSDeepInvestigation";
import { VPSSystemDiagnostic } from "./vps/VPSSystemDiagnostic";
import { AutoDeployButton } from "./hostinger/AutoDeployButton";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SimplifiedWhatsAppPanel() {
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<any>(null);

  const handleCheckServerHealth = async () => {
    try {
      setIsCheckingServer(true);
      const result = await WhatsAppWebService.checkServerHealth();
      
      if (result.success) {
        setServerStatus(result.data);
        toast.success("Servidor funcionando perfeitamente!");
      } else {
        toast.error(`Problema no servidor: ${result.error || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Erro ao verificar servidor");
    } finally {
      setIsCheckingServer(false);
    }
  };

  const getServerStatusIcon = () => {
    if (!serverStatus) return <Server className="h-5 w-5 text-gray-500" />;
    
    const isOnline = serverStatus.status === 'online' || serverStatus.success;
    if (isOnline) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getServerStatusText = () => {
    if (!serverStatus) return "Clique para verificar";
    
    const isOnline = serverStatus.status === 'online' || serverStatus.success;
    return isOnline ? "Online e funcionando" : "Offline ou com problemas";
  };

  return (
    <div className="space-y-8">
      {/* SEÇÃO 1: DIAGNÓSTICO PRINCIPAL */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">🎯 Diagnóstico Principal</h2>
          <p className="text-muted-foreground">
            Execute um diagnóstico completo do sistema antes de qualquer configuração
          </p>
        </div>

        {/* 1. Diagnóstico Completo do Sistema */}
        <VPSSystemDiagnostic />
      </div>

      {/* SEÇÃO 2: CONTROLE OPERACIONAL */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">⚙️ Controle Operacional</h2>
          <p className="text-muted-foreground">
            Ferramentas para gerenciar o servidor WhatsApp após diagnóstico
          </p>
        </div>

        {/* 2. Status do Servidor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getServerStatusIcon()}
                <div>
                  <CardTitle className="text-lg">Status do Servidor WhatsApp</CardTitle>
                  <CardDescription>
                    Verificar se o servidor está online e funcionando
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleCheckServerHealth}
                disabled={isCheckingServer}
                variant="outline"
              >
                {isCheckingServer ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Verificar Status
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          
          {serverStatus && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <p className="text-sm text-muted-foreground">{getServerStatusText()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Instâncias Ativas:</span>
                  <p className="text-sm text-muted-foreground">{serverStatus.activeInstances || 0}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Última Verificação:</span>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Servidor:</span>
                  <p className="text-sm text-muted-foreground">31.97.24.222:3001</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 3. Gerenciador de Token */}
        <VPSTokenSynchronizer />

        {/* 4. Teste de Criação de Instância */}
        <VPSInstanceCreationTester />
      </div>

      {/* SEÇÃO 3: DIAGNÓSTICOS AVANÇADOS */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">🔍 Diagnósticos Avançados</h2>
          <p className="text-muted-foreground">
            Para problemas complexos que o diagnóstico principal não resolve
          </p>
        </div>

        {/* 5. Diagnóstico Completo Legacy */}
        <VPSComprehensiveDiagnostic />

        {/* 6. Investigação Avançada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Investigação Avançada
            </CardTitle>
            <CardDescription>
              Para problemas que persistem após todos os diagnósticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VPSDeepInvestigation />
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 4: DEPLOY E REINSTALAÇÃO */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">🚀 Deploy e Reinstalação</h2>
          <p className="text-muted-foreground">
            Use apenas quando todos os diagnósticos falharem
          </p>
        </div>

        {/* 7. Deploy Automático */}
        <AutoDeployButton />
      </div>
    </div>
  );
}
