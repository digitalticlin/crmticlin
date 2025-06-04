
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Search, Key, Server, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TokenDiscoveryResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const VPSTokenDiscovery = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<TokenDiscoveryResult[]>([]);
  const [suggestedToken, setSuggestedToken] = useState('');
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);

  const discoverWhatsAppToken = async () => {
    setIsDiscovering(true);
    setDiscoveryResults([]);
    console.log('[Token Discovery] 🔍 Iniciando descoberta de token WhatsApp...');
    
    try {
      // Passo 1: Testar conectividade com Hostinger API
      const { data: hostingerTest, error: hostingerError } = await supabase.functions.invoke('hostinger_proxy', {
        body: { 
          action: 'test_connection'
        }
      });

      let step1Result: TokenDiscoveryResult;
      if (hostingerError || !hostingerTest?.success) {
        step1Result = {
          step: 'Hostinger API',
          status: 'error',
          message: 'Falha na conexão com Hostinger API',
          details: hostingerError || hostingerTest
        };
      } else {
        step1Result = {
          step: 'Hostinger API',
          status: 'success',
          message: 'Conectado com sucesso à Hostinger API',
          details: hostingerTest
        };
      }
      
      setDiscoveryResults(prev => [...prev, step1Result]);

      if (step1Result.status === 'error') {
        throw new Error('Não foi possível conectar com a Hostinger API');
      }

      // Passo 2: Verificar status do servidor WhatsApp na VPS
      const { data: whatsappCheck, error: whatsappError } = await supabase.functions.invoke('hostinger_proxy', {
        body: { 
          action: 'check_whatsapp_server'
        }
      });

      let step2Result: TokenDiscoveryResult;
      if (whatsappError || !whatsappCheck?.success) {
        step2Result = {
          step: 'Servidor WhatsApp',
          status: 'warning',
          message: 'Servidor WhatsApp não está rodando ou não foi encontrado',
          details: whatsappError || whatsappCheck
        };
      } else {
        step2Result = {
          step: 'Servidor WhatsApp',
          status: 'success',
          message: 'Servidor WhatsApp encontrado na VPS',
          details: whatsappCheck
        };
      }
      
      setDiscoveryResults(prev => [...prev, step2Result]);

      // Passo 3: Tentar descobrir configuração atual do token
      const { data: tokenConfig, error: tokenError } = await supabase.functions.invoke('hostinger_proxy', {
        body: { 
          action: 'discover_whatsapp_token'
        }
      });

      let step3Result: TokenDiscoveryResult;
      if (tokenError || !tokenConfig?.success) {
        step3Result = {
          step: 'Configuração Token',
          status: 'warning',
          message: 'Não foi possível descobrir token atual. Será necessário configurar manualmente.',
          details: tokenError || tokenConfig
        };
        
        // Sugerir um token padrão
        setSuggestedToken('whatsapp-api-token-' + Math.random().toString(36).substr(2, 9));
      } else {
        step3Result = {
          step: 'Configuração Token',
          status: 'success',
          message: 'Token atual descoberto',
          details: tokenConfig
        };
        
        if (tokenConfig.token) {
          setSuggestedToken(tokenConfig.token);
        }
      }
      
      setDiscoveryResults(prev => [...prev, step3Result]);

      toast.success('Descoberta de token concluída!');
      
    } catch (error: any) {
      console.error('[Token Discovery] ❌ Erro na descoberta:', error);
      setDiscoveryResults(prev => [...prev, {
        step: 'Descoberta Geral',
        status: 'error',
        message: `Erro inesperado: ${error.message}`,
        details: error
      }]);
      toast.error(`Erro na descoberta: ${error.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const updateWhatsAppToken = async () => {
    if (!suggestedToken.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }

    setIsUpdatingToken(true);
    
    try {
      console.log('[Token Discovery] 🔄 Atualizando token WhatsApp...');
      
      // Atualizar VPS_API_TOKEN secret
      const { error: updateError } = await supabase.functions.invoke('vps_diagnostic', {
        body: { 
          test: 'update_token',
          newToken: suggestedToken.trim()
        }
      });

      if (updateError) throw updateError;

      // Configurar token no servidor WhatsApp se possível
      const { data: configResult, error: configError } = await supabase.functions.invoke('hostinger_proxy', {
        body: { 
          action: 'configure_whatsapp_token',
          token: suggestedToken.trim()
        }
      });

      if (configError) {
        console.warn('[Token Discovery] ⚠️ Não foi possível configurar token no servidor:', configError);
        toast.warning('Token atualizado no Supabase, mas não foi possível configurar no servidor VPS');
      } else {
        toast.success('Token atualizado com sucesso no Supabase e configurado no servidor!');
      }

      // Limpar form
      setSuggestedToken('');
      setDiscoveryResults([]);
      
    } catch (error: any) {
      console.error('[Token Discovery] ❌ Erro ao atualizar token:', error);
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
        return null;
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
          <Search className="h-5 w-5 text-blue-600" />
          Descoberta de Token WhatsApp Server
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            Esta ferramenta irá descobrir o token correto do servidor WhatsApp Web.js rodando na VPS
            e configurá-lo automaticamente no Supabase.
          </AlertDescription>
        </Alert>

        {/* Botão de Descoberta */}
        <div>
          <Button 
            onClick={discoverWhatsAppToken}
            disabled={isDiscovering}
            className="w-full"
          >
            {isDiscovering ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-spin" />
                Descobrindo Token...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Descobrir Token WhatsApp
              </>
            )}
          </Button>
        </div>

        {/* Resultados da Descoberta */}
        {discoveryResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Resultados da Descoberta:</h3>
            {discoveryResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.step}</span>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.message}
                </p>
                {result.details && (
                  <details className="text-xs mt-2">
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

        {/* Configuração de Token */}
        {suggestedToken && (
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Configurar Token WhatsApp
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="whatsappToken">Token do Servidor WhatsApp</Label>
                <Input
                  id="whatsappToken"
                  type="text"
                  value={suggestedToken}
                  onChange={(e) => setSuggestedToken(e.target.value)}
                  placeholder="Token do servidor WhatsApp Web.js..."
                  className="font-mono"
                />
              </div>
              
              <Button 
                onClick={updateWhatsAppToken}
                disabled={isUpdatingToken || !suggestedToken.trim()}
                className="w-full"
              >
                {isUpdatingToken ? (
                  <>
                    <Key className="h-4 w-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Configurar Token
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
