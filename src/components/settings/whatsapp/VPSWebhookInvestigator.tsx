
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, CheckCircle, RefreshCw, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const VPSWebhookInvestigator = () => {
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigation, setInvestigation] = useState<any>(null);

  const handleInvestigate = async () => {
    setIsInvestigating(true);
    setInvestigation(null);

    try {
      console.log('[VPS Webhook Investigator] 🔍 Iniciando investigação...');

      // Verificar instâncias recentes sem QR Code
      const { data: recentInstances, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .is('qr_code', null)
        .eq('connection_type', 'web')
        .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // últimos 30 min
        .order('created_at', { ascending: false });

      if (instancesError) {
        throw instancesError;
      }

      // Testar webhook atual da VPS
      const { data: webhookTest, error: webhookError } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'test_webhook_endpoint',
          test_data: {
            instance_name: 'test_webhook_connectivity',
            timestamp: new Date().toISOString()
          }
        }
      });

      const investigationResult = {
        timestamp: new Date().toISOString(),
        recentInstancesWithoutQR: recentInstances || [],
        webhookTest: webhookTest || { error: webhookError?.message },
        issues: [],
        recommendations: []
      };

      // Analisar problemas
      if (recentInstances && recentInstances.length > 0) {
        investigationResult.issues.push({
          type: 'missing_qr_codes',
          severity: 'high',
          description: `${recentInstances.length} instância(s) criada(s) recentemente sem QR Code`,
          instances: recentInstances.map(i => i.instance_name)
        });
      }

      if (webhookError || !webhookTest?.success) {
        investigationResult.issues.push({
          type: 'webhook_connectivity',
          severity: 'critical',
          description: 'Falha na comunicação com webhook da VPS',
          error: webhookError?.message || 'Resposta inválida do webhook'
        });

        investigationResult.recommendations.push({
          action: 'verify_vps_status',
          description: 'Verificar se a VPS está online e o serviço WhatsApp está rodando'
        });

        investigationResult.recommendations.push({
          action: 'check_webhook_endpoint',
          description: 'Verificar se o endpoint webhook está configurado corretamente'
        });
      }

      if (investigationResult.issues.length === 0) {
        investigationResult.status = 'healthy';
        investigationResult.message = 'Sistema funcionando normalmente';
      } else {
        investigationResult.status = 'issues_found';
        investigationResult.message = `${investigationResult.issues.length} problema(s) detectado(s)`;
      }

      setInvestigation(investigationResult);

    } catch (error: any) {
      console.error('[VPS Webhook Investigator] ❌ Erro na investigação:', error);
      setInvestigation({
        status: 'error',
        message: 'Erro durante investigação',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsInvestigating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Saudável</Badge>;
      case 'issues_found':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Problemas</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Search className="h-5 w-5" />
          Investigação VPS & Webhook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700">
          <p>🔍 <strong>Objetivo:</strong> Investigar problemas de conectividade e QR Code</p>
          <p>🎯 <strong>Verificações:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Instâncias sem QR Code</li>
            <li>Conectividade com webhook VPS</li>
            <li>Status do serviço WhatsApp Web</li>
          </ul>
        </div>

        <Button
          onClick={handleInvestigate}
          disabled={isInvestigating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isInvestigating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Investigando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Iniciar Investigação
            </>
          )}
        </Button>

        {investigation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status do Sistema:</span>
              {getStatusBadge(investigation.status)}
            </div>

            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">{investigation.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                Investigação realizada em: {new Date(investigation.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>

            {investigation.recentInstancesWithoutQR && investigation.recentInstancesWithoutQR.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  ⚠️ Instâncias sem QR Code
                </h4>
                <div className="space-y-1">
                  {investigation.recentInstancesWithoutQR.map((instance: any) => (
                    <div key={instance.id} className="text-xs text-yellow-700">
                      • {instance.instance_name} (criada em {new Date(instance.created_at).toLocaleString('pt-BR')})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {investigation.issues && investigation.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-800">Problemas Detectados:</h4>
                {investigation.issues.map((issue: any, index: number) => (
                  <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <div className="font-medium text-red-800">{issue.description}</div>
                    {issue.error && (
                      <div className="text-red-600 mt-1">Erro: {issue.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {investigation.recommendations && investigation.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-800">Recomendações:</h4>
                {investigation.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <div className="text-blue-800">{rec.description}</div>
                  </div>
                ))}
              </div>
            )}

            {investigation.webhookTest && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">Teste de Webhook</span>
                </div>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(investigation.webhookTest, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p><strong>💡 Sobre o problema do QR Code:</strong></p>
          <p>Se instâncias são criadas mas não recebem QR Code, geralmente indica:</p>
          <p>1. VPS offline ou serviço WhatsApp parado</p>
          <p>2. Webhook configurado incorretamente</p>
          <p>3. Problemas de conectividade entre VPS e Supabase</p>
        </div>
      </CardContent>
    </Card>
  );
};
