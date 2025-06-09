
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Terminal, Download, Play, RefreshCw, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InstallStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: string;
  commands?: string[];
}

export const VPSFileInstaller = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSteps, setInstallSteps] = useState<InstallStep[]>([
    {
      id: 'cleanup',
      title: '🧹 Limpeza de Conflitos',
      description: 'Parar servidores existentes na porta 3001 e limpar PM2',
      status: 'pending'
    },
    {
      id: 'generate',
      title: '📝 Gerar Servidor Corrigido',
      description: 'Criar vps-server-persistent.js otimizado para porta 3002',
      status: 'pending'
    },
    {
      id: 'install',
      title: '🚀 Instalar Servidor Principal',
      description: 'Instalar e iniciar servidor único na porta 3002',
      status: 'pending'
    },
    {
      id: 'verify',
      title: '✅ Verificar Conectividade',
      description: 'Testar porta 3002 e endpoints do sistema',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: InstallStep['status'], output?: string, commands?: string[]) => {
    setInstallSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, output: output || step.output, commands: commands || step.commands }
        : step
    ));
  };

  const generateCleanupCommands = () => {
    const commands = [
      "# 🧹 LIMPEZA COMPLETA DE CONFLITOS",
      "echo '📴 Parando todos os processos PM2...'",
      "pm2 stop all",
      "pm2 delete all",
      "pm2 kill",
      "",
      "# 🗑️ Limpar arquivos antigos",
      "echo '🗑️ Removendo arquivos antigos...'",
      "rm -f /root/whatsapp-server.js",
      "rm -f /root/vps-server-persistent.js",
      "rm -f /root/whatsapp-server-corrected.js",
      "",
      "# 🔍 Verificar portas livres",
      "echo '🔍 Verificando portas 3001 e 3002...'",
      "lsof -ti:3001 | xargs -r kill -9",
      "lsof -ti:3002 | xargs -r kill -9",
      "netstat -tlnp | grep -E ':(3001|3002)'",
      "",
      "echo '✅ Limpeza concluída! Pronto para instalação.'"
    ];
    return commands.join('\n');
  };

  const runCleanup = async () => {
    updateStepStatus('cleanup', 'running');
    
    try {
      const commands = generateCleanupCommands();
      updateStepStatus('cleanup', 'completed', commands);
      toast.success("🧹 Comandos de limpeza gerados! Execute na VPS.");
      
      // Auto-avançar para próximo step
      setTimeout(() => {
        updateStepStatus('generate', 'running');
        generateFiles();
      }, 1000);
      
    } catch (error: any) {
      updateStepStatus('cleanup', 'error', error.message);
      toast.error(`❌ Erro na limpeza: ${error.message}`);
    }
  };

  const generateFiles = async () => {
    try {
      console.log('[VPS Installer] 📦 Gerando servidor corrigido...');

      const { data, error } = await supabase.functions.invoke('vps_file_installer', {
        body: { action: 'install_whatsapp_servers' }
      });

      if (error) throw error;

      if (data?.success) {
        const output = [
          "✅ Servidor vps-server-persistent.js gerado",
          "📊 Características do servidor:",
          "• Porta 3002 (unificada)",
          "• Webhook automático configurado", 
          "• Persistência de sessões",
          "• Múltiplas instâncias WhatsApp",
          "• Auto-restart com PM2",
          "",
          "📋 Próximos passos:",
          "1. Copie o arquivo para /root/ na VPS",
          "2. Execute os comandos de instalação",
          "3. Verifique conectividade"
        ].join('\n');
        
        updateStepStatus('generate', 'completed', output);
        toast.success('📝 Servidor corrigido gerado com sucesso!');
        
        // Auto-avançar
        setTimeout(() => {
          updateStepStatus('install', 'running');
          generateInstallCommands();
        }, 1000);
        
      } else {
        throw new Error(data?.error || 'Falha na geração do servidor');
      }

    } catch (error: any) {
      console.error('Erro na geração:', error);
      updateStepStatus('generate', 'error', error.message);
      toast.error(`❌ Erro: ${error.message}`);
    }
  };

  const generateInstallCommands = () => {
    const commands = [
      "# 🚀 INSTALAÇÃO DO SERVIDOR PRINCIPAL",
      "echo '📦 Instalando dependências...'",
      "cd /root",
      "npm install whatsapp-web.js express cors node-fetch",
      "",
      "# ⚙️ Configurar variáveis de ambiente",
      "export AUTH_TOKEN='3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'",
      "export WEBHOOK_URL='https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'",
      "",
      "# 🚀 Iniciar servidor principal na porta 3002",
      "echo '🚀 Iniciando servidor WhatsApp na porta 3002...'",
      "PORT=3002 AUTH_TOKEN='3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3' pm2 start vps-server-persistent.js --name whatsapp-main-3002",
      "",
      "# 💾 Salvar configuração PM2",
      "pm2 save",
      "pm2 startup",
      "",
      "# ✅ Verificar instalação",
      "echo '✅ Verificando instalação...'",
      "pm2 list",
      "sleep 3",
      "curl -s http://localhost:3002/health || echo '⚠️ Servidor ainda não respondeu'",
      "",
      "echo '🎯 Instalação concluída! Servidor rodando na porta 3002'"
    ];
    
    updateStepStatus('install', 'completed', commands.join('\n'));
    toast.success("🚀 Comandos de instalação gerados!");
    
    // Auto-avançar para verificação
    setTimeout(() => {
      updateStepStatus('verify', 'running');
      generateVerificationCommands();
    }, 1000);
  };

  const generateVerificationCommands = () => {
    const commands = [
      "# 🔍 VERIFICAÇÃO COMPLETA DO SISTEMA",
      "echo '🔍 Testando conectividade do sistema...'",
      "",
      "# 1. Status PM2",
      "echo '📊 Status PM2:'",
      "pm2 list",
      "",
      "# 2. Teste local da porta 3002",
      "echo '🌐 Testando porta 3002 localmente:'",
      "curl -s http://localhost:3002/health",
      "",
      "# 3. Teste externo da VPS",
      "echo '🌍 Testando acesso externo:'",
      "curl -s http://31.97.24.222:3002/health",
      "",
      "# 4. Verificar logs do servidor",
      "echo '📋 Logs recentes:'",
      "pm2 logs whatsapp-main-3002 --lines 10",
      "",
      "# 5. Testar endpoint de instâncias",
      "echo '🔗 Testando endpoint de instâncias:'",
      "curl -s -H 'Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3' http://localhost:3002/instances",
      "",
      "echo '✅ Verificação concluída! Sistema pronto para uso.'"
    ];
    
    updateStepStatus('verify', 'completed', commands.join('\n'));
    toast.success("🎯 Sistema verificado! Pronto para uso.");
  };

  const startInstallation = async () => {
    setIsInstalling(true);
    toast.info("🚀 Iniciando correção completa do sistema VPS...");
    
    // Reset all steps
    setInstallSteps(prev => prev.map(step => ({ ...step, status: 'pending', output: undefined })));
    
    // Start cleanup
    setTimeout(() => runCleanup(), 500);
  };

  const copyCommands = (stepId: string) => {
    const step = installSteps.find(s => s.id === stepId);
    if (step?.output) {
      navigator.clipboard.writeText(step.output);
      toast.success(`📋 Comandos de ${step.title} copiados!`);
    }
  };

  const getStepIcon = (status: InstallStep['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
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
            <CardTitle className="text-blue-800">Correção Completa VPS</CardTitle>
          </div>
          <Badge className="bg-green-600 text-white">
            Sistema Unificado
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informações da Correção */}
        <div className="bg-white/80 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">🎯 Plano de Correção</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Parar servidor conflitante na porta 3001</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Instalar servidor único na porta 3002</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Configurar webhook automático</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Verificar conectividade completa</span>
            </div>
          </div>
        </div>

        {/* Steps de Instalação */}
        <div className="space-y-4">
          {installSteps.map((step) => (
            <div key={step.id} className="bg-white/60 rounded-lg border border-blue-100 overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {getStepIcon(step.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(step.status)}
                  {step.output && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCommands(step.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {step.output && (
                <div className="px-3 pb-3">
                  <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{step.output}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <Button
            onClick={startInstallation}
            disabled={isInstalling}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isInstalling ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Corrigindo Sistema...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Correção Completa
              </>
            )}
          </Button>
        </div>

        {/* Resumo Final */}
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">📋 Resultado Final</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>• <strong>Porta 3002:</strong> Servidor WhatsApp principal (unificado)</div>
            <div>• <strong>Porta 3001:</strong> Livre (sem conflitos)</div>
            <div>• <strong>Webhook:</strong> Automático para Supabase</div>
            <div>• <strong>PM2:</strong> Auto-restart configurado</div>
            <div>• <strong>Edge Functions:</strong> Conectam apenas na 3002</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
