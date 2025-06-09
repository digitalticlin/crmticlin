
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Server, CheckCircle, XCircle, AlertTriangle, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstallationStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
}

export const VPSAutoInstaller = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<any>(null);

  const checkServerStatus = async () => {
    setIsChecking(true);
    setSteps([]);
    
    try {
      console.log('[VPS Auto Installer] 🔍 Verificando status do servidor...');
      
      const { data, error } = await supabase.functions.invoke('vps_auto_installer', {
        body: { action: 'check_server_status' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setServerStatus(data);
      
      if (data.server_running) {
        toast.success(`Servidor já está rodando na porta ${data.port}!`);
      } else {
        toast.warning('Servidor não está rodando. Clique em "Instalar" para configurar.');
      }

    } catch (error: any) {
      console.error('[VPS Auto Installer] ❌ Erro:', error);
      toast.error(`Erro ao verificar: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const installServer = async () => {
    setIsInstalling(true);
    setSteps([]);
    setServerStatus(null);
    
    try {
      console.log('[VPS Auto Installer] 🚀 Iniciando instalação...');
      
      const { data, error } = await supabase.functions.invoke('vps_auto_installer', {
        body: { action: 'check_and_install' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setSteps(data.steps || []);
      
      if (data.success) {
        if (data.already_running) {
          toast.success(`Servidor já estava rodando na porta ${data.port}!`);
        } else {
          toast.success('Servidor instalado e iniciado com sucesso!');
        }
        
        // Verificar status após instalação
        setTimeout(() => {
          checkServerStatus();
        }, 2000);
      } else {
        toast.error('Falha na instalação automática. Verifique os logs.');
      }

    } catch (error: any) {
      console.error('[VPS Auto Installer] ❌ Erro na instalação:', error);
      toast.error(`Erro na instalação: ${error.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const getStatusIcon = () => {
    if (!serverStatus) return <Server className="h-5 w-5 text-gray-500" />;
    return serverStatus.server_running ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (!serverStatus) return null;
    return serverStatus.server_running ? 
      <Badge className="bg-green-500">ONLINE - Porta {serverStatus.port}</Badge> : 
      <Badge variant="destructive">OFFLINE</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Instalador Automático VPS
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Verifica e instala automaticamente o servidor WhatsApp na VPS
          </p>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkServerStatus}
            disabled={isChecking || isInstalling}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Server className="h-4 w-4" />
                Verificar Status
              </>
            )}
          </Button>
          
          <Button 
            onClick={installServer}
            disabled={isChecking || isInstalling}
            className="flex items-center gap-2"
          >
            {isInstalling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Instalando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Instalar Servidor
              </>
            )}
          </Button>
        </div>

        {serverStatus && (
          <Card className={`border-l-4 ${serverStatus.server_running ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Status do Servidor</span>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-gray-600">{serverStatus.message}</p>
              {serverStatus.server_running && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ Servidor acessível em: http://31.97.24.222:{serverStatus.port}/health
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Passos da Instalação:</h4>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              {steps.map((step, index) => (
                <div key={index} className="text-sm font-mono flex items-center gap-2">
                  {step.startsWith('✅') ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : step.startsWith('❌') ? (
                    <XCircle className="h-3 w-3 text-red-500" />
                  ) : step.startsWith('⚠️') ? (
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-1">Como Funciona:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. <strong>Verificar:</strong> Checa se o servidor já está rodando</p>
            <p>2. <strong>Instalar:</strong> Instala Node.js, PM2 e servidor WhatsApp</p>
            <p>3. <strong>Iniciar:</strong> Coloca o servidor online automaticamente</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
