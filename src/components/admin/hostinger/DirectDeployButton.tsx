
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Terminal, Loader2, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { AdvancedWebhookInstaller } from "./AdvancedWebhookInstaller";

export const DirectDeployButton = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const deployViaSSH = async () => {
    setIsDeploying(true);
    setDeployStatus('deploying');
    setLogs([]);
    
    try {
      addLog('🚀 Iniciando deploy via SSH...');
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('vps_auto_deploy', {
        body: {
          action: 'ssh_deploy',
          deployType: 'whatsapp_server_complete',
          version: '3.0'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        addLog('✅ Deploy SSH concluído com sucesso!');
        setDeployStatus('success');
        toast.success('Deploy via SSH realizado com sucesso!');
      } else {
        throw new Error(data?.error || 'Falha no deploy SSH');
      }
      
    } catch (error: any) {
      console.error('Erro no deploy SSH:', error);
      addLog(`❌ Erro: ${error.message}`);
      setDeployStatus('error');
      toast.error(`Erro no deploy: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusBadge = () => {
    switch (deployStatus) {
      case 'deploying':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Deployando
          </Badge>
        );
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sucesso
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Instalador de Webhook Avançado - Componente Principal */}
      <AdvancedWebhookInstaller />
      
      {/* Deploy SSH Básico - Alternativa */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Deploy SSH Básico</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-white/80 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              <strong>Deploy básico via SSH</strong> - Instala servidor WhatsApp simples sem webhooks avançados.
              <br />
              <span className="text-green-600">
                ⚠️ Recomendamos usar o "Instalador de Webhook Avançado" acima para recursos completos.
              </span>
            </p>
          </div>

          <Button
            onClick={deployViaSSH}
            disabled={isDeploying}
            variant="outline"
            className="w-full text-green-600 border-green-300 hover:bg-green-50"
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deployando via SSH...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Deploy SSH Básico
              </>
            )}
          </Button>

          {logs.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs max-h-32 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
