
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Key, Server, RefreshCw, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const WhatsAppTokenGenerator = () => {
  const [generatedToken, setGeneratedToken] = useState('');
  const [customToken, setCustomToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  const generateSecureToken = () => {
    setIsGenerating(true);
    
    // Simular geração (para dar feedback visual)
    setTimeout(() => {
      // Gerar token seguro de 32 caracteres
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const finalToken = `wapp_${token}`;
      setGeneratedToken(finalToken);
      setCustomToken(finalToken);
      setIsGenerating(false);
      toast.success('Token gerado com sucesso!');
    }, 1000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setTokenCopied(true);
      toast.success('Token copiado para a área de transferência!');
      
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar token');
    }
  };

  const usePresetToken = (preset: string) => {
    setCustomToken(preset);
    setGeneratedToken(preset);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-green-600" />
          Gerador de Token WhatsApp Server
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            Este token será usado para autenticar requisições para o servidor WhatsApp Web.js
            rodando na sua VPS. Mantenha-o seguro e não compartilhe publicamente.
          </AlertDescription>
        </Alert>

        {/* Gerador de Token */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Token Gerado Automaticamente</Label>
            <Button
              onClick={generateSecureToken}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Gerar Token
                </>
              )}
            </Button>
          </div>

          {generatedToken && (
            <div className="flex items-center gap-2">
              <Input
                value={generatedToken}
                readOnly
                className="font-mono bg-gray-50"
              />
              <Button
                onClick={() => copyToClipboard(generatedToken)}
                variant="outline"
                size="sm"
              >
                {tokenCopied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Tokens Pré-definidos */}
        <div className="space-y-3">
          <Label>Ou escolha um token pré-definido:</Label>
          <div className="grid grid-cols-1 gap-2">
            {[
              'whatsapp-api-token-2024',
              'ticlin-whatsapp-server-key',
              'vps-whatsapp-auth-token',
              'default-whatsapp-token'
            ].map((preset) => (
              <div key={preset} className="flex items-center justify-between p-2 border rounded">
                <code className="text-sm">{preset}</code>
                <Button
                  onClick={() => usePresetToken(preset)}
                  variant="ghost"
                  size="sm"
                >
                  Usar este
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Token Customizado */}
        <div className="space-y-3">
          <Label htmlFor="customToken">Token Personalizado</Label>
          <Input
            id="customToken"
            type="text"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            placeholder="Digite seu próprio token..."
            className="font-mono"
          />
        </div>

        {/* Token Atual */}
        {customToken && (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-green-800">Token Selecionado:</span>
              <Badge className="bg-green-600">Pronto para usar</Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white rounded border text-sm">
                {customToken}
              </code>
              <Button
                onClick={() => copyToClipboard(customToken)}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Como usar:</strong></p>
          <p>1. Gere ou escolha um token acima</p>
          <p>2. Use este token na ferramenta "Descoberta de Token WhatsApp"</p>
          <p>3. O token será configurado automaticamente no servidor VPS</p>
        </div>
      </CardContent>
    </Card>
  );
};
