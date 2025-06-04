
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Key, CheckCircle, AlertTriangle, XCircle, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagnosticStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

export const VPSSecretManager = () => {
  const [token, setToken] = useState('wapp_TYXt5I3uIewmPts4EosF8M5DjbkyP0h4');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticSteps, setDiagnosticSteps] = useState<DiagnosticStep[]>([]);
  const [secretConfigured, setSecretConfigured] = useState(false);

  const initialSteps: DiagnosticStep[] = [
    { name: 'secret_config', status: 'pending', message: 'Configurar VPS_API_TOKEN secret' },
    { name: 'edge_function', status: 'pending', message: 'Testar Edge Function (ambiente, secrets)' },
    { name: 'vps_connectivity', status: 'pending', message: 'Testar conectividade VPS (DNS, porta)' },
    { name: 'vps_auth', status: 'pending', message: 'Testar autenticação VPS (token)' },
    { name: 'vps_services', status: 'pending', message: 'Testar serviços VPS (health, instances)' },
    { name: 'whatsapp_server', status: 'pending', message: 'Testar servidor WhatsApp (check_server)' },
    { name: 'hostinger_proxy', status: 'pending', message: 'Testar Hostinger Proxy' },
    { name: 'full_integration', status: 'pending', message: 'Validar integração completa' }
  ];

  const updateDiagnosticStep = (stepName: string, updates: Partial<DiagnosticStep>) => {
    setDiagnosticSteps(prev => prev.map(step => 
      step.name === stepName ? { ...step, ...updates } : step
    ));
  };

  const configureVPSSecret = async () => {
    if (!token.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }

    setIsConfiguring(true);
    updateDiagnosticStep('secret_config', { status: 'running', message: 'Configurando VPS_API_TOKEN...' });
    
    try {
      console.log('[Secret Manager] 🔑 Configurando VPS_API_TOKEN:', token.substring(0, 10) + '...');
      
      // Usar vps_diagnostic para atualizar o secret
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { 
          test: 'update_token',
          newToken: token.trim()
        }
      });

      if (error) {
        throw new Error(`Erro ao configurar secret: ${error.message}`);
      }

      if (data?.success) {
        setSecretConfigured(true);
        updateDiagnosticStep('secret_config', { 
          status: 'success', 
          message: 'VPS_API_TOKEN configurado com sucesso',
          details: data
        });
        toast.success('Secret VPS_API_TOKEN configurado!');
        return true;
      } else {
        throw new Error(data?.error || 'Falha ao configurar secret');
      }
      
    } catch (error: any) {
      console.error('[Secret Manager] ❌ Erro ao configurar secret:', error);
      updateDiagnosticStep('secret_config', { 
        status: 'error', 
        message: `Erro: ${error.message}`,
        details: error
      });
      toast.error(`Erro ao configurar secret: ${error.message}`);
      return false;
    } finally {
      setIsConfiguring(false);
    }
  };

  const runCompleteDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticSteps(initialSteps);
    
    try {
      console.log('[Secret Manager] 🚀 Iniciando diagnósticos completos...');

      // PASSO 1: Configurar secret se não estiver configurado
      if (!secretConfigured) {
        const secretSuccess = await configureVPSSecret();
        if (!secretSuccess) {
          toast.error('Falha ao configurar secret. Parando diagnósticos.');
          return;
        }
      }

      // PASSO 2: Teste Edge Function
      updateDiagnosticStep('edge_function', { status: 'running', message: 'Testando Edge Function...' });
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'edge_function' }
        });

        if (edgeError) throw edgeError;
        
        updateDiagnosticStep('edge_function', { 
          status: edgeData?.success ? 'success' : 'error',
          message: edgeData?.success ? 'Edge Function OK' : 'Edge Function com problemas',
          details: edgeData
        });
      } catch (error: any) {
        updateDiagnosticStep('edge_function', { 
          status: 'error', 
          message: `Erro: ${error.message}`,
          details: error
        });
      }

      // PASSO 3: Teste Conectividade VPS
      updateDiagnosticStep('vps_connectivity', { status: 'running', message: 'Testando conectividade VPS...' });
      try {
        const { data: connData, error: connError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'vps_connectivity' }
        });

        if (connError) throw connError;
        
        updateDiagnosticStep('vps_connectivity', { 
          status: connData?.success ? 'success' : 'error',
          message: connData?.success ? 'VPS acessível' : 'VPS inacessível',
          details: connData
        });
      } catch (error: any) {
        updateDiagnosticStep('vps_connectivity', { 
          status: 'error', 
          message: `Erro: ${error.message}`,
          details: error
        });
      }

      // PASSO 4: Teste Autenticação VPS
      updateDiagnosticStep('vps_auth', { status: 'running', message: 'Testando autenticação VPS...' });
      try {
        const { data: authData, error: authError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'vps_auth' }
        });

        if (authError) throw authError;
        
        updateDiagnosticStep('vps_auth', { 
          status: authData?.success ? 'success' : 'error',
          message: authData?.success ? 'Autenticação OK' : 'Falha na autenticação',
          details: authData
        });
      } catch (error: any) {
        updateDiagnosticStep('vps_auth', { 
          status: 'error', 
          message: `Erro: ${error.message}`,
          details: error
        });
      }

      // PASSO 5: Teste Serviços VPS
      updateDiagnosticStep('vps_services', { status: 'running', message: 'Testando serviços VPS...' });
      try {
        const { data: servData, error: servError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'vps_services' }
        });

        if (servError) throw servError;
        
        updateDiagnosticStep('vps_services', { 
          status: servData?.success ? 'success' : 'error',
          message: servData?.success ? 'Serviços VPS OK' : 'Problemas nos serviços',
          details: servData
        });
      } catch (error: any) {
        updateDiagnosticStep('vps_services', { 
          status: 'error', 
          message: `Erro: ${error.message}`,
          details: error
        });
      }

      // PASSO 6: Teste WhatsApp Server
      updateDiagnosticStep('whatsapp_server', { status: 'running', message: 'Testando servidor WhatsApp...' });
      try {
        const { data: wsData, error: wsError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'full_flow', vpsAction: 'check_server' }
        });

        if (wsError) throw wsError;
        
        updateDiagnosticStep('whatsapp_server', { 
          status: wsData?.success ? 'success' : 'error',
          message: wsData?.success ? 'WhatsApp Server OK' : 'Problemas no WhatsApp Server',
          details: wsData
        });
      } catch (error: any) {
        updateDiagnosticStep('whatsapp_server', { 
          status: 'error', 
          message: `Erro: ${error.message}`,
          details: error
        });
      }

      // PASSO 7: Teste Hostinger Proxy
      updateDiagnosticStep('hostinger_proxy', { status: 'running', message: 'Testando Hostinger Proxy...' });
      try {
        const { data: hostData, error: hostError } = await supabase.functions.invoke('hostinger_proxy', {
          body: { action: 'test_connection' }
        });

        if (hostError) throw hostError;
        
        updateDiagnosticStep('hostinger_proxy', { 
          status: hostData?.success ? 'success' : 'error',
          message: hostData?.success ? 'Hostinger Proxy OK' : 'Problemas no Hostinger Proxy',
          details: hostData
        });
      } catch (error: any) {
        updateDiagnosticStep('hostinger_proxy', { 
          status: 'error', 
          message: `Erro: ${error.message}`,
          details: error
        });
      }

      // PASSO 8: Validação Final
      updateDiagnosticStep('full_integration', { status: 'running', message: 'Validando integração completa...' });
      
      const successCount = diagnosticSteps.filter(step => step.status === 'success').length;
      const totalSteps = diagnosticSteps.length - 1; // Excluir o próprio step de integração
      
      if (successCount >= totalSteps * 0.8) { // 80% de sucesso
        updateDiagnosticStep('full_integration', { 
          status: 'success',
          message: `Integração OK (${successCount}/${totalSteps} testes passou)`,
          details: { successRate: (successCount / totalSteps * 100).toFixed(1) + '%' }
        });
        toast.success('🎉 Diagnósticos completos! Sistema funcionando!');
      } else {
        updateDiagnosticStep('full_integration', { 
          status: 'error',
          message: `Integração com problemas (${successCount}/${totalSteps} testes passou)`,
          details: { successRate: (successCount / totalSteps * 100).toFixed(1) + '%' }
        });
        toast.error('❌ Diagnósticos revelaram problemas no sistema');
      }

      console.log('[Secret Manager] ✅ Diagnósticos completos concluídos');

    } catch (error: any) {
      console.error('[Secret Manager] ❌ Erro geral nos diagnósticos:', error);
      toast.error(`Erro nos diagnósticos: ${error.message}`);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      pending: 'outline'
    };
    
    const labels = {
      success: 'SUCESSO',
      error: 'ERRO',
      running: 'EXECUTANDO',
      pending: 'PENDENTE'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configuração do Secret */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Configuração VPS_API_TOKEN Secret
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Este é o token encontrado na VPS: <code>wapp_TYXt5I3uIewmPts4EosF8M5DjbkyP0h4</code>
              <br />Ele será configurado como secret no Supabase para permitir comunicação com a VPS.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <Label htmlFor="vpsToken">Token VPS (do servidor WhatsApp)</Label>
              <Input
                id="vpsToken"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
                placeholder="wapp_..."
              />
            </div>

            <Button 
              onClick={configureVPSSecret}
              disabled={isConfiguring || !token.trim()}
              className="w-full"
            >
              {isConfiguring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Configurando Secret...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Configurar VPS_API_TOKEN Secret
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Execução de Diagnósticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Diagnósticos Automatizados VPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Execute os diagnósticos para verificar todas as Edge Functions e integração com a VPS.
              O sistema testará: conectividade, autenticação, serviços e fluxo completo.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runCompleteDiagnostics}
            disabled={isRunningDiagnostics}
            className="w-full"
            size="lg"
          >
            {isRunningDiagnostics ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando Diagnósticos...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Executar Todos os Diagnósticos
              </>
            )}
          </Button>

          {/* Resultados dos Diagnósticos */}
          {diagnosticSteps.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-medium">Resultados dos Diagnósticos:</h3>
              {diagnosticSteps.map((step, index) => (
                <div key={step.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <span className="font-medium">
                        {index + 1}. {step.message}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(step.status)}
                      {step.duration && (
                        <span className="text-xs text-muted-foreground">
                          {step.duration}ms
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {step.details && (
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer text-muted-foreground">
                        Ver detalhes técnicos
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
