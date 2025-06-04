
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, ExternalLink, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const HostingerTokenForm = () => {
  const [token, setToken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const updateHostingerToken = async () => {
    if (!token.trim()) {
      toast.error('Token não pode estar vazio');
      return;
    }

    setIsUpdating(true);
    
    try {
      console.log('[Hostinger Token] 🔄 Atualizando token da Hostinger...');
      
      // Testar se o token funciona fazendo uma chamada de teste
      const { data: testResult, error: testError } = await supabase.functions.invoke('test_vps_connection', {
        body: { 
          test: 'hostinger_token_test',
          token: token.trim()
        }
      });

      if (testError) {
        throw new Error(`Erro ao testar token: ${testError.message}`);
      }

      // Se o teste passou, atualizar o secret
      const { error: updateError } = await supabase.functions.invoke('vps_diagnostic', {
        body: { 
          test: 'update_hostinger_token',
          token: token.trim()
        }
      });

      if (updateError) {
        throw new Error(`Erro ao salvar token: ${updateError.message}`);
      }

      setIsConfigured(true);
      setToken('');
      toast.success('Token da Hostinger configurado com sucesso!');
      
    } catch (error: any) {
      console.error('[Hostinger Token] ❌ Erro:', error);
      toast.error(`Erro ao configurar token: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Token da API Hostinger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações sobre o token */}
        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            Para usar a API da Hostinger, você precisa de um token de API. 
            Você pode gerar um token no painel da Hostinger em: 
            <strong> Configurações → API → Gerar Token</strong>
          </AlertDescription>
        </Alert>

        {/* Link para gerar token */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div>
            <h3 className="font-medium text-blue-800">Gerar Token da Hostinger</h3>
            <p className="text-sm text-blue-600">
              Acesse o painel da Hostinger para gerar seu token de API
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://hpanel.hostinger.com/api', '_blank')}
            className="border-blue-600 text-blue-600 hover:bg-blue-100"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Hostinger
          </Button>
        </div>

        {/* Formulário do token */}
        {!isConfigured ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="hostingerToken">Token da API Hostinger</Label>
              <Input
                id="hostingerToken"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Insira seu token da API Hostinger..."
                className="font-mono"
              />
            </div>
            
            <Button 
              onClick={updateHostingerToken}
              disabled={isUpdating || !token.trim()}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <Key className="h-4 w-4 mr-2 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Configurar Token Hostinger
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Token da Hostinger configurado com sucesso!
            </span>
          </div>
        )}

        {/* Instruções */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Passo 1:</strong> Acesse o painel da Hostinger</p>
          <p><strong>Passo 2:</strong> Vá em Configurações → API</p>
          <p><strong>Passo 3:</strong> Gere um novo token</p>
          <p><strong>Passo 4:</strong> Cole o token no campo acima</p>
        </div>
      </CardContent>
    </Card>
  );
};
