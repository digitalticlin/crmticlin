
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Key,
  Server,
  RefreshCw 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const VPSTokenDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [newToken, setNewToken] = useState('');
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    console.log('[VPS Token Diagnostic] 🔍 Iniciando diagnóstico completo...');
    
    try {
      // Test 1: VPS Connectivity
      const connectivityResult = await testVPSConnectivity();
      setResults(prev => [...prev, connectivityResult]);
      
      // Test 2: Token Authentication
      const tokenResult = await testTokenAuthentication();
      setResults(prev => [...prev, tokenResult]);
      
      // Test 3: VPS Server Info
      const serverInfoResult = await testVPSServerInfo();
      setResults(prev => [...prev, serverInfoResult]);
      
      // Test 4: Instance Creation Test
      const instanceTestResult = await testInstanceCreation();
      setResults(prev => [...prev, instanceTestResult]);
      
      console.log('[VPS Token Diagnostic] ✅ Diagnóstico concluído');
      
    } catch (error: any) {
      console.error('[VPS Token Diagnostic] ❌ Erro no diagnóstico:', error);
      setResults(prev => [...prev, {
        test: 'Diagnóstico Geral',
        status: 'error',
        message: `Erro inesperado: ${error.message}`,
        details: error
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const testVPSConnectivity = async (): Promise<DiagnosticResult> => {
    try {
      console.log('[Diagnostic] 🌐 Testando conectividade VPS...');
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'vps_connectivity' }
      });

      if (error) throw error;

      return {
        test: 'Conectividade VPS',
        status: data.success ? 'success' : 'error',
        message: data.success ? 'VPS acessível' : data.error || 'VPS inacessível',
        details: data.details
      };
    } catch (error: any) {
      return {
        test: 'Conectividade VPS',
        status: 'error',
        message: `Erro de conectividade: ${error.message}`,
        details: error
      };
    }
  };

  const testTokenAuthentication = async (): Promise<DiagnosticResult> => {
    try {
      console.log('[Diagnostic] 🔑 Testando autenticação de token...');
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'vps_auth' }
      });

      if (error) throw error;

      return {
        test: 'Autenticação Token',
        status: data.success ? 'success' : 'error',
        message: data.success ? 'Token válido' : data.error || 'Token inválido',
        details: data.details
      };
    } catch (error: any) {
      return {
        test: 'Autenticação Token',
        status: 'error',
        message: `Erro de autenticação: ${error.message}`,
        details: error
      };
    }
  };

  const testVPSServerInfo = async (): Promise<DiagnosticResult> => {
    try {
      console.log('[Diagnostic] 🖥️ Obtendo informações do servidor VPS...');
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'vps_services' }
      });

      if (error) throw error;

      return {
        test: 'Informações Servidor',
        status: data.success ? 'success' : 'warning',
        message: data.success ? 'Servidor funcionando' : 'Problemas no servidor',
        details: data.details
      };
    } catch (error: any) {
      return {
        test: 'Informações Servidor',
        status: 'error',
        message: `Erro ao obter info: ${error.message}`,
        details: error
      };
    }
  };

  const testInstanceCreation = async (): Promise<DiagnosticResult> => {
    try {
      console.log('[Diagnostic] 🚀 Testando fluxo de criação de instância...');
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'full_flow', vpsAction: 'check_server' }
      });

      if (error) throw error;

      return {
        test: 'Fluxo Criação Instância',
        status: data.success ? 'success' : 'error',
        message: data.success ? 'Fluxo funcional' : data.error || 'Fluxo com problemas',
        details: data.details
      };
    } catch (error: any) {
      return {
        test: 'Fluxo Criação Instância',
        status: 'error',
        message: `Erro no fluxo: ${error.message}`,
        details: error
      };
    }
  };

  const updateToken = async () => {
    if (!newToken.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }

    setIsUpdatingToken(true);
    
    try {
      console.log('[VPS Token Diagnostic] 🔄 Atualizando token VPS...');
      
      // Update VPS_API_TOKEN secret
      const { error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { 
          test: 'update_token',
          newToken: newToken.trim()
        }
      });

      if (error) throw error;

      toast.success('Token atualizado com sucesso! Execute o diagnóstico novamente.');
      setNewToken('');
      
    } catch (error: any) {
      console.error('[VPS Token Diagnostic] ❌ Erro ao atualizar token:', error);
      toast.error(`Erro ao atualizar token: ${error.message}`);
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Diagnóstico de Token VPS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diagnóstico */}
        <div>
          <Button 
            onClick={runDiagnostic}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando Diagnóstico...
              </>
            ) : (
              <>
                <Server className="h-4 w-4 mr-2" />
                Executar Diagnóstico Completo
              </>
            )}
          </Button>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Resultados do Diagnóstico:</h3>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {result.message}
                </p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Ver detalhes
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Atualização de Token */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Atualizar Token VPS
          </h3>
          
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Se o diagnóstico indicar problemas de autenticação, insira o token correto da VPS aqui.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="newToken">Novo Token VPS</Label>
              <Input
                id="newToken"
                type="password"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="Cole o token da VPS aqui..."
                className="font-mono"
              />
            </div>
            
            <Button 
              onClick={updateToken}
              disabled={isUpdatingToken || !newToken.trim()}
              variant="outline"
              className="w-full"
            >
              {isUpdatingToken ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Token
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
