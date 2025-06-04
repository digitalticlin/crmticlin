import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Key, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Save,
  TestTube,
  Zap
} from "lucide-react";

interface TokenTestResult {
  token: string;
  success: boolean;
  error?: string;
  responseData?: any;
  duration: number;
  timestamp: string;
}

export const VPSTokenSynchronizer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentToken, setCurrentToken] = useState('3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3');
  const [candidateTokens, setCandidateTokens] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TokenTestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [discoveredToken, setDiscoveredToken] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[VPS Token Sync] ${message}`);
  };

  const generateCandidateTokens = () => {
    const baseTokens = [
      '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3', // Token VPS correto
      'wapp_TYXt5I3uIewmPts4EosF8M5DjbkyP0h4', // Token antigo Supabase
      'default-token', // Token fallback
    ];

    // Gerar variações do token atual
    const variations = [];
    if (currentToken && !baseTokens.includes(currentToken)) {
      variations.push(currentToken);
    }

    const allTokens = [...new Set([...baseTokens, ...variations])];
    setCandidateTokens(allTokens);
    addLog(`Gerados ${allTokens.length} tokens candidatos para teste`);
    
    return allTokens;
  };

  const testSingleToken = async (token: string): Promise<TokenTestResult> => {
    const startTime = Date.now();
    addLog(`🔍 Testando token: ${token.substring(0, 10)}...`);

    try {
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { 
          test: 'vps_auth',
          testToken: token
        }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(error.message);
      }

      const result: TokenTestResult = {
        token,
        success: data.success || false,
        responseData: data.details,
        duration,
        timestamp: new Date().toISOString(),
        error: data.success ? undefined : (data.error || 'Token inválido')
      };

      if (result.success) {
        addLog(`✅ Token válido encontrado: ${token.substring(0, 10)}...`);
        setDiscoveredToken(token);
      } else {
        addLog(`❌ Token inválido: ${result.error}`);
      }

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: TokenTestResult = {
        token,
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };

      addLog(`💥 Erro ao testar token: ${error.message}`);
      return result;
    }
  };

  const runTokenDiscovery = async () => {
    setIsRunning(true);
    setTestResults([]);
    setLogs([]);
    setDiscoveredToken(null);
    setProgress(0);

    try {
      addLog("🚀 Iniciando descoberta automática de token VPS");

      const tokens = generateCandidateTokens();
      const results: TokenTestResult[] = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const result = await testSingleToken(token);
        results.push(result);
        setTestResults([...results]);

        const progressPercent = ((i + 1) / tokens.length) * 100;
        setProgress(progressPercent);

        if (result.success) {
          addLog(`🎯 Token correto descoberto! Interrompendo busca.`);
          break;
        }

        // Pequena pausa entre testes para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const successfulResults = results.filter(r => r.success);
      
      if (successfulResults.length > 0) {
        addLog(`✅ Descoberta concluída: ${successfulResults.length} token(s) válido(s) encontrado(s)`);
        toast.success(`Token VPS válido descoberto!`);
      } else {
        addLog(`❌ Nenhum token válido encontrado nos ${results.length} tokens testados`);
        toast.warning('Nenhum token válido encontrado. Verifique se o servidor VPS está acessível.');
      }

    } catch (error: any) {
      addLog(`💥 Erro geral na descoberta: ${error.message}`);
      toast.error(`Erro na descoberta: ${error.message}`);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const updateVPSToken = async (newToken: string) => {
    if (!newToken) {
      toast.error('Token não pode estar vazio');
      return;
    }

    try {
      addLog(`🔄 Atualizando VPS_API_TOKEN secret...`);
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { 
          test: 'update_token',
          newToken
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        addLog(`✅ Token atualizado com sucesso`);
        toast.success('Token VPS atualizado com sucesso!');
        
        // Testar o token recém-atualizado
        addLog(`🔍 Testando token atualizado...`);
        const testResult = await testSingleToken(newToken);
        
        if (testResult.success) {
          addLog(`✅ Token atualizado funcionando corretamente`);
          toast.success('Token verificado e funcionando!');
        } else {
          addLog(`⚠️ Token atualizado, mas teste de verificação falhou`);
          toast.warning('Token atualizado, mas verificação falhou');
        }
      } else {
        throw new Error(data.error || 'Falha ao atualizar token');
      }

    } catch (error: any) {
      addLog(`❌ Erro ao atualizar token: ${error.message}`);
      toast.error(`Erro ao atualizar token: ${error.message}`);
    }
  };

  const handleQuickFix = async () => {
    const correctToken = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    addLog(`🚀 Aplicando correção rápida com token VPS correto`);
    await updateVPSToken(correctToken);
  };

  const handleManualTokenUpdate = async () => {
    if (!currentToken.trim()) {
      toast.error('Digite um token válido');
      return;
    }

    await updateVPSToken(currentToken.trim());
  };

  const handleUseDiscoveredToken = async () => {
    if (!discoveredToken) {
      toast.error('Nenhum token descoberto para usar');
      return;
    }

    await updateVPSToken(discoveredToken);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? 'VÁLIDO' : 'INVÁLIDO'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Correção Rápida - NOVO */}
      <Card className="border-green-500 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Zap className="h-5 w-5 text-green-600" />
            🚀 Correção Rápida - Token VPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-500 bg-green-100">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Token VPS correto identificado:</strong> 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3
              <br />
              <small>Este é o token atual da variável de ambiente VPS_API_TOKEN na VPS</small>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleQuickFix}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Aplicar Correção Rápida
          </Button>
        </CardContent>
      </Card>

      {/* Descoberta Automática */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Descoberta Automática de Token VPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Esta ferramenta testa automaticamente tokens candidatos para encontrar o token VPS correto.
              Inclui o token VPS atual e variações baseadas no token configurado.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runTokenDiscovery}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Descobrindo Token...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Descobrir Token Correto
              </>
            )}
          </Button>

          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso da Descoberta</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {discoveredToken && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Token válido descoberto:</strong></p>
                  <code className="text-xs bg-green-100 p-1 rounded">
                    {discoveredToken}
                  </code>
                  <Button 
                    onClick={handleUseDiscoveredToken}
                    size="sm"
                    className="ml-2"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Usar Este Token
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Atualização Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-600" />
            Atualização Manual de Token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manualToken">Token VPS Manual</Label>
            <Input
              id="manualToken"
              type="password"
              value={currentToken}
              onChange={(e) => setCurrentToken(e.target.value)}
              placeholder="Cole o token VPS correto aqui..."
              className="font-mono"
            />
          </div>
          
          <Button 
            onClick={handleManualTokenUpdate}
            disabled={!currentToken.trim()}
            variant="outline"
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Atualizar Token Manual
          </Button>
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-purple-600" />
              Resultados dos Testes de Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60 w-full">
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        <code className="text-xs bg-gray-100 p-1 rounded">
                          {result.token.substring(0, 20)}...
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(result.success)}
                        <span className="text-xs text-muted-foreground">
                          {result.duration}ms
                        </span>
                      </div>
                    </div>
                    
                    {result.error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <strong>Erro:</strong> {result.error}
                      </div>
                    )}

                    {result.success && result.responseData && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer text-green-600">
                          Ver dados de resposta
                        </summary>
                        <pre className="mt-2 p-2 bg-green-50 rounded overflow-auto max-h-20">
                          {JSON.stringify(result.responseData, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Logs de Sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 w-full">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono bg-black/5 p-2 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
