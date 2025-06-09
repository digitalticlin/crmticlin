
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Terminal, Download, Play, RefreshCw, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InstallStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: string;
}

export const VPSFileInstaller = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSteps, setInstallSteps] = useState<InstallStep[]>([
    {
      id: 'generate',
      title: 'Gerar Arquivos Corrigidos',
      description: 'Criar vps-server-persistent.js e whatsapp-server-corrected.js',
      status: 'pending'
    },
    {
      id: 'copy',
      title: 'Copiar para VPS',
      description: 'Instruções para copiar os arquivos para /root/ na VPS',
      status: 'pending'
    },
    {
      id: 'install',
      title: 'Executar Instalação',
      description: 'Rodar script de instalação e configuração PM2',
      status: 'pending'
    },
    {
      id: 'verify',
      title: 'Verificar Conectividade',
      description: 'Testar portas 3001 e 3002 e endpoints /health',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: InstallStep['status'], output?: string) => {
    setInstallSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, output: output || step.output }
        : step
    ));
  };

  const generateFiles = async () => {
    setIsInstalling(true);
    updateStepStatus('generate', 'running');

    try {
      const { data, error } = await supabase.functions.invoke('vps_file_installer', {
        body: { action: 'install_whatsapp_servers' }
      });

      if (error) throw error;

      if (data?.success) {
        updateStepStatus('generate', 'completed', 'Arquivos gerados com sucesso');
        updateStepStatus('copy', 'running');
        
        // Mostrar instruções de cópia
        const copyInstructions = `
1. SSH na VPS: ssh root@31.97.24.222
2. Navegue para /root: cd /root
3. Crie os arquivos abaixo com os conteúdos gerados
4. Execute: chmod +x install-script.sh
5. Execute: ./install-script.sh
        `;
        
        updateStepStatus('copy', 'completed', copyInstructions);
        toast.success('Arquivos gerados! Siga as instruções para copiar para VPS.');
        
      } else {
        throw new Error(data?.error || 'Falha na geração de arquivos');
      }

    } catch (error: any) {
      console.error('Erro na geração:', error);
      updateStepStatus('generate', 'error', error.message);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const restartServices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('vps_file_installer', {
        body: { action: 'restart_pm2_services' }
      });

      if (error) throw error;

      if (data?.success) {
        updateStepStatus('install', 'completed', 'Comandos de reinicialização gerados');
        toast.success('Execute os comandos gerados na VPS para reiniciar serviços');
      }

    } catch (error: any) {
      console.error('Erro no restart:', error);
      toast.error(`Erro: ${error.message}`);
    }
  };

  const getStepIcon = (status: InstallStep['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <Terminal className="h-4 w-4 text-red-500" />;
      default:
        return <Terminal className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: InstallStep['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'default',
      error: 'destructive'
    } as const;

    const colors = {
      pending: 'text-gray-600',
      running: 'text-blue-600',
      completed: 'text-green-600',
      error: 'text-red-600'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status === 'pending' && 'Pendente'}
        {status === 'running' && 'Executando'}
        {status === 'completed' && 'Concluído'}
        {status === 'error' && 'Erro'}
      </Badge>
    );
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800">Instalador de Arquivos VPS</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-white/80 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 mb-2">
            <strong>🎯 Objetivo:</strong> Instalar os servidores WhatsApp corrigidos na VPS
          </p>
          <p className="text-sm text-blue-600">
            Este instalador vai gerar os arquivos <code>vps-server-persistent.js</code> e <code>whatsapp-server-corrected.js</code> 
            corrigidos e dar instruções para instalá-los na VPS com PM2.
          </p>
        </div>

        {/* Steps de Instalação */}
        <div className="space-y-4">
          {installSteps.map((step) => (
            <div key={step.id} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-blue-100">
              <div className="mt-0.5">
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  {getStatusBadge(step.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                {step.output && (
                  <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{step.output}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <Button
            onClick={generateFiles}
            disabled={isInstalling}
            className="flex-1"
          >
            {isInstalling ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando Arquivos...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar Arquivos Corrigidos
              </>
            )}
          </Button>

          <Button
            onClick={restartServices}
            variant="outline"
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Gerar Comandos PM2
          </Button>
        </div>

        {/* Comandos Manuais */}
        <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs">
          <p className="text-green-300 mb-2">📋 Comandos para executar na VPS após gerar os arquivos:</p>
          <div className="space-y-1">
            <div>ssh root@31.97.24.222</div>
            <div>cd /root</div>
            <div># Copiar arquivos gerados para /root/</div>
            <div>chmod +x install-script.sh</div>
            <div>./install-script.sh</div>
            <div>pm2 list</div>
            <div>curl http://localhost:3001/health</div>
            <div>curl http://localhost:3002/health</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
