
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Network,
  Zap,
  Copy,
  RefreshCw
} from "lucide-react";

export const VPSFirewallCorrector = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const analyzeFirewallIssue = async () => {
    try {
      setIsAnalyzing(true);
      toast.loading('Analisando problema de firewall...', { id: 'firewall-analysis' });

      const { data, error } = await supabase.functions.invoke('vps_network_deep_diagnostic', {
        body: { testType: 'firewall_detection' }
      });

      if (error) {
        throw new Error(`Erro na análise: ${error.message}`);
      }

      // Também testar o fluxo de produção para detectar IP atual
      const { data: flowData } = await supabase.functions.invoke('vps_network_deep_diagnostic', {
        body: { testType: 'production_flow_exact' }
      });

      const currentIP = data.edgeFunctionInfo?.edgeIP || 'unknown';
      
      const analysis = {
        currentIP,
        firewallBlocking: !data.success,
        missingRanges: detectMissingRanges(currentIP),
        testResults: data.result,
        flowTestSuccess: flowData?.success || false,
        hostingerRequest: generateHostingerRequest(currentIP)
      };

      setAnalysisResult(analysis);
      
      if (analysis.firewallBlocking) {
        toast.error(`🔥 BLOQUEIO CONFIRMADO: IP ${currentIP} bloqueado`, { id: 'firewall-analysis' });
      } else {
        toast.success('✅ Firewall OK - sem bloqueios detectados', { id: 'firewall-analysis' });
      }

    } catch (error: any) {
      console.error('[Firewall Corrector] ❌ Erro:', error);
      toast.error(`Erro na análise: ${error.message}`, { id: 'firewall-analysis' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectMissingRanges = (currentIP: string) => {
    const liberatedRanges = [
      '13.104.0.0/14', '13.107.42.14/32', '13.107.246.0/24',
      '20.190.128.0/18', '40.64.0.0/10', '52.239.158.0/23',
      '104.16.0.0/13', '104.24.0.0/14', '108.162.192.0/18',
      '141.101.64.0/18', '162.158.0.0/15', '172.64.0.0/13',
      '173.245.48.0/20', '188.114.96.0/20', '190.93.240.0/20',
      '197.234.240.0/22', '198.41.128.0/17'
    ];

    if (!currentIP || currentIP === 'unknown') {
      return ['Não foi possível detectar IP atual'];
    }

    // Detectar range do IP atual
    const ipParts = currentIP.split('.').map(Number);
    const firstOctet = ipParts[0];
    
    // Verificar se está em algum range liberado
    const isInLiberatedRange = liberatedRanges.some(range => {
      return isIPInRange(currentIP, range);
    });

    if (!isInLiberatedRange) {
      // Sugerir range baseado no primeiro octeto
      const suggestedRange = `${firstOctet}.0.0.0/8`;
      return [`Range em falta: ${suggestedRange} (para IP ${currentIP})`];
    }

    return [];
  };

  const isIPInRange = (ip: string, range: string) => {
    // Implementação básica - em produção usaria biblioteca específica
    const [rangeIP, cidr] = range.split('/');
    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(rangeIP);
    const mask = ~(Math.pow(2, 32 - parseInt(cidr)) - 1);
    
    return (ipNum & mask) === (rangeNum & mask);
  };

  const ipToNumber = (ip: string) => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  };

  const generateHostingerRequest = (currentIP: string) => {
    if (!currentIP || currentIP === 'unknown') {
      return "Não foi possível gerar solicitação - IP não detectado";
    }

    const ipParts = currentIP.split('.').map(Number);
    const firstOctet = ipParts[0];
    const suggestedRange = `${firstOctet}.0.0.0/8`;

    return `SOLICITAÇÃO URGENTE PARA HOSTINGER:

🔥 PROBLEMA CRÍTICO: Nova faixa de IP do Supabase detectada

📍 IP ATUAL BLOQUEADO: ${currentIP}
🎯 RANGE NECESSÁRIO: ${suggestedRange}

Por favor, libere o seguinte range de IP adicional nas portas 3001, 3002 e 8080 (TCP):
- ${suggestedRange}

JUSTIFICATIVA: 
- IP ${currentIP} não está nos ranges previamente liberados
- Necessário para funcionamento das Edge Functions do Supabase
- Supabase usa IPs dinâmicos de diferentes ranges AWS

URGÊNCIA: ALTA - Sistema bloqueado atualmente`;
  };

  const testConnectivityNow = async () => {
    try {
      setIsTesting(true);
      toast.loading('Testando conectividade atual...', { id: 'connectivity-test' });

      const { data, error } = await supabase.functions.invoke('vps_network_deep_diagnostic', {
        body: { testType: 'production_flow_exact' }
      });

      if (error) {
        throw new Error(`Erro no teste: ${error.message}`);
      }

      if (data.success && data.result.success) {
        toast.success('🎉 SUCESSO! Conectividade funcionando!', { id: 'connectivity-test' });
        setAnalysisResult(prev => prev ? { ...prev, flowTestSuccess: true } : null);
      } else {
        toast.error('❌ Ainda bloqueado - aguardar liberação', { id: 'connectivity-test' });
        setAnalysisResult(prev => prev ? { ...prev, flowTestSuccess: false } : null);
      }

    } catch (error: any) {
      console.error('[Connectivity Test] ❌ Erro:', error);
      toast.error(`Erro no teste: ${error.message}`, { id: 'connectivity-test' });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Solicitação copiada para clipboard!');
  };

  return (
    <div className="space-y-4">
      {/* Botões de Ação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button 
          onClick={analyzeFirewallIssue}
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Analisar Problema
            </>
          )}
        </Button>

        <Button 
          onClick={testConnectivityNow}
          disabled={isTesting}
          variant="outline"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Testando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Testar Agora
            </>
          )}
        </Button>
      </div>

      {/* Resultados da Análise */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Status Atual */}
          <Card className={analysisResult.flowTestSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-sm ${analysisResult.flowTestSuccess ? "text-green-800" : "text-red-800"}`}>
                {analysisResult.flowTestSuccess ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                Status Atual: {analysisResult.flowTestSuccess ? "FUNCIONANDO" : "BLOQUEADO"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">IP Atual:</span>
                  <Badge variant="outline" className="ml-2">{analysisResult.currentIP}</Badge>
                </div>
                <div>
                  <span className="font-medium">Firewall:</span>
                  <Badge variant={analysisResult.firewallBlocking ? "destructive" : "default"} className="ml-2">
                    {analysisResult.firewallBlocking ? "BLOQUEADO" : "OK"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranges em Falta */}
          {analysisResult.missingRanges.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Ranges em falta:</strong>
                <ul className="list-disc list-inside mt-2">
                  {analysisResult.missingRanges.map((range: string, index: number) => (
                    <li key={index} className="text-sm">{range}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Solicitação para Hostinger */}
          {analysisResult.hostingerRequest && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Solicitação para Hostinger
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(analysisResult.hostingerRequest)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-48">
                  {analysisResult.hostingerRequest}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Próximos passos:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Copie a solicitação acima e envie para o suporte da Hostinger</li>
                <li>Aguarde confirmação da liberação (geralmente 5-15 minutos)</li>
                <li>Use o botão "Testar Agora" para verificar se foi liberado</li>
                <li>Quando der sucesso, o sistema funcionará normalmente</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
