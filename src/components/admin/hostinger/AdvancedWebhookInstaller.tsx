
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Webhook, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal,
  Zap,
  MessageSquare,
  QrCode,
  Activity
} from "lucide-react";
import { generateAdvancedWebhookDeployScript } from "../../../supabase/functions/deploy_whatsapp_server/advancedWebhookDeployScript";

export const AdvancedWebhookInstaller = () => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installationLogs, setInstallationLogs] = useState<string[]>([]);
  const [installationStatus, setInstallationStatus] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setInstallationLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const installWebhookServer = async () => {
    setIsInstalling(true);
    setInstallationStatus('installing');
    setInstallationLogs([]);
    
    try {
      addLog('🚀 Iniciando instalação do servidor de webhooks...');
      
      // Gerar script de instalação
      const deployScript = generateAdvancedWebhookDeployScript();
      addLog('📋 Script de instalação gerado');
      
      // Executar via edge function
      const { supabase } = await import('@/integrations/supabase/client');
      
      addLog('📡 Enviando script para VPS...');
      
      const { data, error } = await supabase.functions.invoke('deploy_whatsapp_server', {
        body: {
          action: 'install_webhook_server',
          script: deployScript,
          serverType: 'webhook_advanced',
          version: '4.0'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        addLog('✅ Instalação concluída com sucesso!');
        addLog('🔗 Servidor de webhooks ativo na porta 3001');
        addLog('📱 QR codes automáticos habilitados');
        addLog('💬 Mensagens automáticas habilitadas');
        addLog('📊 Status automático habilitado');
        
        setInstallationStatus('success');
        toast.success('Servidor de webhooks instalado com sucesso!');
        
        // Testar conectividade
        await testWebhookServer();
        
      } else {
        throw new Error(data?.error || 'Falha na instalação');
      }
      
    } catch (error: any) {
      console.error('Erro na instalação:', error);
      addLog(`❌ Erro: ${error.message}`);
      setInstallationStatus('error');
      toast.error(`Erro na instalação: ${error.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const testWebhookServer = async () => {
    try {
      addLog('🧪 Testando conectividade do servidor...');
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('test_vps_connection', {
        body: {
          action: 'test_webhook_endpoints',
          endpoints: [
            '/health',
            '/status', 
            '/webhook/global/status',
            '/instances'
          ]
        }
      });

      if (data?.success) {
        addLog('✅ Todos os endpoints respondem corretamente');
        addLog('🎉 Servidor de webhooks totalmente funcional!');
      } else {
        addLog('⚠️ Alguns endpoints podem não estar respondendo');
      }
      
    } catch (error: any) {
      addLog(`⚠️ Erro no teste: ${error.message}`);
    }
  };

  const getStatusBadge = () => {
    switch (installationStatus) {
      case 'installing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Instalando
          </Badge>
        );
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Instalado
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
        return (
          <Badge variant="outline">
            <Webhook className="h-3 w-3 mr-1" />
            Não Instalado
          </Badge>
        );
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-purple-800">
              Instalador de Webhook Avançado
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-900 mb-3">
            🎯 Recursos que serão instalados:
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <QrCode className="h-4 w-4" />
              <span>QR Code automático via webhook</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <MessageSquare className="h-4 w-4" />
              <span>Mensagens automáticas via webhook</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Activity className="h-4 w-4" />
              <span>Status de conexão automático</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Zap className="h-4 w-4" />
              <span>Múltiplas instâncias simultâneas</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50/80 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            🚀 Como funciona após a instalação:
          </h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li><strong>CREATE</strong> → Instância criada na VPS</li>
            <li><strong>QR AUTOMÁTICO</strong> → VPS gera QR e envia webhook para Supabase</li>
            <li><strong>MODAL INSTANTÂNEO</strong> → Frontend recebe QR pelo banco (sem polling)</li>
            <li><strong>MENSAGENS AUTOMÁTICAS</strong> → VPS envia todas as mensagens via webhook</li>
            <li><strong>STATUS AUTOMÁTICO</strong> → VPS atualiza status de conexão via webhook</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={installWebhookServer}
            disabled={isInstalling}
            className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
          >
            {isInstalling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Instalando Servidor...
              </>
            ) : (
              <>
                <Webhook className="h-4 w-4 mr-2" />
                Instalar Servidor de Webhooks
              </>
            )}
          </Button>
          
          {installationStatus === 'success' && (
            <Button 
              onClick={testWebhookServer}
              variant="outline"
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Testar
            </Button>
          )}
        </div>

        {installationLogs.length > 0 && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
            <h4 className="text-white mb-2 font-bold">📋 Logs de Instalação:</h4>
            {installationLogs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2 text-gray-700">📚 Endpoints que serão criados:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• <code>POST /instance/create</code> - Criar instância com webhook automático</div>
            <div>• <code>GET /instance/:id/qr</code> - Obter QR code</div>
            <div>• <code>POST /webhook/global</code> - Configurar webhook global</div>
            <div>• <code>GET /webhook/global/status</code> - Status do webhook</div>
            <div>• <code>POST /instance/:id/webhook</code> - Webhook por instância</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
