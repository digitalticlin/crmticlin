
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Wrench, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Download,
  Terminal,
  Zap
} from "lucide-react";

interface CorrectionResult {
  success: boolean;
  message?: string;
  fixScript?: string;
  steps?: string[];
  instructions?: string[];
  nextSteps?: string[];
  error?: string;
}

interface VerificationResult {
  success: boolean;
  verification?: {
    serverHealth: {
      working: boolean;
      data: any;
    };
    webhookEndpoint: {
      working: boolean;
      data: any;
      status: number;
    };
    recommendation: string;
  };
  error?: string;
}

export const VPSWebhookCorrector = () => {
  const [isApplying, setIsApplying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<CorrectionResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const applyWebhookFix = async () => {
    setIsApplying(true);
    setLogs([]);
    setCorrectionResult(null);
    
    try {
      addLog('🔧 Iniciando correção de webhook...');
      
      const { data, error } = await supabase.functions.invoke('vps_webhook_corrector', {
        body: { action: 'apply_webhook_fix' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setCorrectionResult(data);
      
      if (data.success) {
        addLog('✅ Script de correção preparado com sucesso!');
        toast.success('Script de correção de webhook preparado!');
      } else {
        throw new Error(data.error || 'Falha na preparação do script');
      }

    } catch (error: any) {
      addLog(`❌ Erro: ${error.message}`);
      toast.error(`Erro na correção: ${error.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const verifyWebhook = async () => {
    setIsVerifying(true);
    
    try {
      addLog('🧪 Verificando status do webhook...');
      
      const { data, error } = await supabase.functions.invoke('vps_webhook_corrector', {
        body: { action: 'verify_webhook_working' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setVerificationResult(data);
      
      if (data.success && data.verification?.webhookEndpoint?.working) {
        addLog('✅ Webhook está funcionando corretamente!');
        toast.success('Webhook configurado e funcionando!');
      } else {
        addLog('⚠️ Webhook ainda não está configurado');
        toast.warning('Webhook precisa ser configurado');
      }

    } catch (error: any) {
      addLog(`❌ Erro na verificação: ${error.message}`);
      toast.error(`Erro na verificação: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const downloadScript = () => {
    if (!correctionResult?.fixScript) return;
    
    const blob = new Blob([correctionResult.fixScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webhook_fix.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Script baixado! Execute via SSH na VPS.');
  };

  const getStatusIcon = (working: boolean) => {
    return working ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (working: boolean) => {
    return working ? (
      <Badge className="bg-green-500">FUNCIONANDO</Badge>
    ) : (
      <Badge variant="destructive">PRECISA CORREÇÃO</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            Corretor de Webhook VPS ↔ Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta ferramenta corrige a sincronização entre VPS e Supabase adicionando 
              configuração de webhook automático ao servidor da porta 3002.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={applyWebhookFix}
              disabled={isApplying}
              className="flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Preparando Correção...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  Aplicar Correção de Webhook
                </>
              )}
            </Button>
            
            <Button 
              onClick={verifyWebhook}
              disabled={isVerifying}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Verificar Webhook
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da verificação */}
      {verificationResult && (
        <Card className={verificationResult.verification?.webhookEndpoint?.working 
          ? "border-green-200 bg-green-50" 
          : "border-yellow-200 bg-yellow-50"
        }>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Status do Webhook</CardTitle>
              {verificationResult.verification && 
                getStatusBadge(verificationResult.verification.webhookEndpoint.working)
              }
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {verificationResult.verification && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(verificationResult.verification.serverHealth.working)}
                    <span className="text-sm">
                      Servidor VPS: {verificationResult.verification.serverHealth.working ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(verificationResult.verification.webhookEndpoint.working)}
                    <span className="text-sm">
                      Endpoint Webhook: {verificationResult.verification.webhookEndpoint.working ? 'Configurado' : 'Não configurado'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-white/80 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">
                    Recomendação:
                  </p>
                  <p className="text-sm text-gray-600">
                    {verificationResult.verification.recommendation}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultado da correção */}
      {correctionResult && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800">Script de Correção Preparado</CardTitle>
              {correctionResult.fixScript && (
                <Button 
                  onClick={downloadScript}
                  size="sm"
                  variant="outline"
                  className="border-blue-500 text-blue-600"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar Script
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {correctionResult.instructions && (
              <div className="bg-white/80 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📋 Instruções SSH:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  {correctionResult.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}

            {correctionResult.nextSteps && (
              <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">🎯 Próximos Passos:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  {correctionResult.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {correctionResult.steps && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-blue-800">Passos Executados:</h4>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  {correctionResult.steps.map((step, index) => (
                    <div key={index} className="text-sm font-mono flex items-center gap-2">
                      {step.startsWith('✅') ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : step.startsWith('❌') ? (
                        <XCircle className="h-3 w-3 text-red-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-blue-400" />
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Logs de Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs space-y-1">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Informações importantes */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Zap className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="text-sm text-orange-700">
              <p><strong>Como funciona a correção:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Adiciona endpoints de webhook ao servidor VPS (porta 3002)</li>
                <li>Configura URL do Supabase para receber eventos</li>
                <li>Ativa envio automático de QR codes, status e mensagens</li>
                <li>Sincroniza VPS ↔ Supabase em tempo real</li>
              </ul>
              
              <p className="mt-3"><strong>Após aplicar:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>QR codes aparecerão automaticamente na interface</li>
                <li>Status de conexão será sincronizado</li>
                <li>Mensagens serão recebidas em tempo real</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
