
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, Download, CheckCircle2, AlertTriangle, Server, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const QuickVPSCorrection = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [installStep, setInstallStep] = useState<'ready' | 'generating' | 'installing' | 'completed'>('ready');
  const [serverCode, setServerCode] = useState<string>('');

  const generateCorrectedServer = async () => {
    setIsGenerating(true);
    setInstallStep('generating');
    
    try {
      console.log('[Quick VPS] 🔧 Gerando servidor corrigido...');
      
      const { data, error } = await supabase.functions.invoke('vps_file_installer', {
        body: { 
          action: 'generate_corrected_server',
          target_port: 3002,
          webhook_url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
          auth_token: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
        }
      });

      if (error) throw error;

      if (data?.server_code) {
        setServerCode(data.server_code);
        setInstallStep('installing');
        toast.success('✅ Servidor corrigido gerado! Preparando instalação...');
        
        // Auto-executar instalação
        setTimeout(() => {
          installCorrectedServer(data.server_code);
        }, 1000);
      } else {
        throw new Error('Código do servidor não foi gerado');
      }
      
    } catch (error: any) {
      console.error('[Quick VPS] ❌ Erro:', error);
      toast.error(`Erro: ${error.message}`);
      setInstallStep('ready');
    } finally {
      setIsGenerating(false);
    }
  };

  const installCorrectedServer = async (code: string) => {
    try {
      console.log('[Quick VPS] 🚀 Instalando servidor na VPS...');
      
      const { data, error } = await supabase.functions.invoke('vps_file_installer', {
        body: { 
          action: 'install_to_vps',
          server_code: code,
          filename: 'vps-server-persistent.js',
          start_with_pm2: true
        }
      });

      if (error) throw error;

      if (data?.success) {
        setInstallStep('completed');
        toast.success('🎯 Servidor instalado e iniciado com sucesso!');
      } else {
        throw new Error(data?.error || 'Falha na instalação');
      }
      
    } catch (error: any) {
      console.error('[Quick VPS] ❌ Erro na instalação:', error);
      toast.error(`Erro na instalação: ${error.message}`);
      setInstallStep('ready');
    }
  };

  const getStepIcon = () => {
    switch (installStep) {
      case 'generating':
        return <Download className="h-5 w-5 animate-pulse text-blue-500" />;
      case 'installing':
        return <Server className="h-5 w-5 animate-pulse text-orange-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Zap className="h-5 w-5 text-purple-500" />;
    }
  };

  const getStepMessage = () => {
    switch (installStep) {
      case 'generating':
        return 'Gerando servidor corrigido...';
      case 'installing':
        return 'Instalando na VPS e iniciando com PM2...';
      case 'completed':
        return 'Servidor instalado e rodando na porta 3002!';
      default:
        return 'Pronto para corrigir o servidor VPS';
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStepIcon()}
            <CardTitle className="text-green-800">Correção Rápida VPS</CardTitle>
          </div>
          <Badge className="bg-green-600 text-white">
            {installStep === 'completed' ? 'Concluído' : 'Em Progresso'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status da Operação */}
        <div className="bg-white/80 p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">{getStepMessage()}</h4>
          <div className="space-y-2 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>VPS limpa e dependências instaladas</span>
            </div>
            <div className="flex items-center gap-2">
              {installStep === 'ready' ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              <span>Servidor corrigido {installStep === 'ready' ? 'aguardando geração' : 'gerado'}</span>
            </div>
            <div className="flex items-center gap-2">
              {installStep === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )}
              <span>Instalação na VPS {installStep === 'completed' ? 'concluída' : 'pendente'}</span>
            </div>
          </div>
        </div>

        {/* Botão Principal */}
        <div className="flex gap-3">
          <Button
            onClick={generateCorrectedServer}
            disabled={isGenerating || installStep !== 'ready'}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Corrigindo...
              </>
            ) : installStep === 'completed' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Correção Concluída
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Gerar e Instalar Servidor Corrigido
              </>
            )}
          </Button>
        </div>

        {/* Resultado Final */}
        {installStep === 'completed' && (
          <div className="bg-green-100 border border-green-300 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">🎯 Correção Aplicada</h4>
            <div className="text-sm text-green-700 space-y-1">
              <div>• <strong>Servidor:</strong> vps-server-persistent.js instalado</div>
              <div>• <strong>Porta:</strong> 3002 (unificada)</div>
              <div>• <strong>Webhook:</strong> Configurado via variável de ambiente</div>
              <div>• <strong>PM2:</strong> whatsapp-main-3002 ativo</div>
              <div>• <strong>Status:</strong> Pronto para receber requisições</div>
            </div>
          </div>
        )}

        {/* Comandos de Verificação */}
        {installStep === 'completed' && (
          <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
            <div className="mb-2 text-green-300"># Comandos para verificar:</div>
            <div>pm2 list</div>
            <div>curl http://localhost:3002/health</div>
            <div>curl http://31.97.24.222:3002/health</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
